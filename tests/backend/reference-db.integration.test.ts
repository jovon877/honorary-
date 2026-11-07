/**
 * Runs the real SQL migrations against Postgres (PGlite, in-process WASM Postgres)
 * and proves RLS, immutability and append-only rules hold at the database layer.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readMigrations } from "@honorary-homes/database";

let db: PGlite;
type TestRow = Record<string, unknown>;
type TestQuery = (sql: string, parameters?: unknown[]) => Promise<TestRow[]>;

/** Run statements as the app role with a given identity, inside a transaction. */
async function as<T>(userId: string, roles: string, fn: (q: TestQuery) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.query(`SET LOCAL ROLE app_rw`);
    await tx.query(
      `SELECT set_config('app.user_id', $1, true), set_config('app.roles', $2, true)`,
      [userId, roles],
    );
    return fn(async (s, p) => (await tx.query<TestRow>(s, p)).rows);
  });
}

beforeAll(async () => {
  db = await PGlite.create();
  for (const migration of await readMigrations()) await db.exec(migration.sql);
  // Fixture data (FIXTURE — not real)
  await db.exec(`
    INSERT INTO academy.orgs VALUES ('org1','FIXTURE Org','internal',false);
    INSERT INTO academy.users (id, org_id, display_name) VALUES
      ('L1','org1','FIXTURE Learner 1'),('L2','org1','FIXTURE Learner 2'),
      ('I1','org1','FIXTURE Instructor'),('P1','org1','FIXTURE Property Staff'),
      ('AUTH','org1','FIXTURE Author'),('C1U','org1','FIXTURE Compliance');
    INSERT INTO academy.cohorts VALUES ('C1','org1','FIXTURE Cohort');
    INSERT INTO academy.cohort_members VALUES ('C1','L1','learner'),('C1','I1','instructor');
    INSERT INTO academy.scenarios VALUES ('SIM-110','Hazard Hunt','hazard_recognition','AUTH');
    INSERT INTO academy.scenario_versions (scenario_id, version, status, lesson_id, environment_id, content, content_hash, has_non_visual_path, published_at)
      VALUES ('SIM-110',1,'published','les_sim110','ENV-NE-01','{}', repeat('a',64), true, now()),
             ('SIM-110',2,'draft','les_sim110','ENV-NE-01','{}', repeat('b',64), false, NULL);
    UPDATE academy.course_versions SET status='published', published_at=now() WHERE id='cv_construction_safety_1';
    UPDATE credentials.definitions SET status='approved' WHERE id='HH-RFC-CARPENTRY';
    INSERT INTO credentials.signing_keys (key_id, public_key_pem)
      VALUES ('k1','FIXTURE — not a real public key');
    INSERT INTO academy.enrollments VALUES ('L1','crs_construction_safety','purchase',true);
    INSERT INTO training.sim_attempts (id, learner_id, cohort_id, scenario_id, scenario_version, stage, seed, score_scaled, passed)
      VALUES ('00000000-0000-4000-8000-000000000001','L1','C1','SIM-110',1,'prove',42,0.9,true),
             ('00000000-0000-4000-8000-000000000002','L2',NULL,'SIM-110',1,'practice',7,0.5,false);
  `);
}, 60_000);

describe("catalog seed", () => {
  it("seeds 11 sim-hosting courses (10 still draft after fixture publishes one) and 19 simulation lessons", async () => {
    const c = await db.query<{ n: number }>(
      `SELECT count(*)::int n FROM academy.course_versions WHERE status='draft'`,
    );
    const l = await db.query<{ n: number }>(
      `SELECT count(*)::int n FROM academy.lessons WHERE lesson_kind='simulation'`,
    );
    expect(c.rows[0]!.n).toBe(10);
    expect(l.rows[0]!.n).toBe(19);
  });
  it("learners see published scenario and course versions only", async () => {
    const rows = await as("L1", "learner", (q) =>
      q(`SELECT version FROM academy.scenario_versions ORDER BY version`),
    );
    expect(rows.map((r) => r.version)).toEqual([1]);
    const visible = await as("L1", "learner", (q) => q(`SELECT id FROM academy.course_versions`));
    expect(visible.map((r) => r.id)).toEqual(["cv_construction_safety_1"]);
  });
});

describe("row-level security on training records", () => {
  it("learner sees only own attempts", async () => {
    const rows = await as("L1", "learner", (q) =>
      q(`SELECT learner_id FROM training.sim_attempts`),
    );
    expect(rows.map((r) => r.learner_id)).toEqual(["L1"]);
  });
  it("instructor sees their cohort only", async () => {
    const rows = await as("I1", "instructor", (q) =>
      q(`SELECT learner_id FROM training.sim_attempts`),
    );
    expect(rows.map((r) => r.learner_id)).toEqual(["L1"]);
  });
  it("property staff see nothing, even with instructor role", async () => {
    const rows = await as("I1", "instructor,property_staff", (q) =>
      q(`SELECT 1 FROM training.sim_attempts`),
    );
    expect(rows).toHaveLength(0);
  });
  it("cannot insert attempts for someone else, or without enrollment, or on drafts", async () => {
    await expect(
      as("L1", "learner", (q) =>
        q(
          `INSERT INTO training.sim_attempts (id, learner_id, scenario_id, scenario_version, stage, seed) VALUES (gen_random_uuid(),'L2','SIM-110',1,'learn',1)`,
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      as("L2", "learner", (q) =>
        q(
          `INSERT INTO training.sim_attempts (id, learner_id, scenario_id, scenario_version, stage, seed) VALUES (gen_random_uuid(),'L2','SIM-110',1,'learn',1)`,
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      as("L1", "learner", (q) =>
        q(
          `INSERT INTO training.sim_attempts (id, learner_id, scenario_id, scenario_version, stage, seed) VALUES (gen_random_uuid(),'L1','SIM-110',2,'learn',1)`,
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    const ok = await as("L1", "learner", (q) =>
      q(
        `INSERT INTO training.sim_attempts (id, learner_id, scenario_id, scenario_version, stage, seed) VALUES (gen_random_uuid(),'L1','SIM-110',1,'learn',1) RETURNING learner_id`,
      ),
    );
    expect(ok[0]!.learner_id).toBe("L1");
  });
  it("app role has no access to the housing schema", async () => {
    await db.exec(`CREATE TABLE IF NOT EXISTS housing.leases (id int)`);
    await expect(as("L1", "learner", (q) => q(`SELECT * FROM housing.leases`))).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("immutability", () => {
  it("published scenario content cannot change; only retirement", async () => {
    await expect(
      db.query(
        `UPDATE academy.scenario_versions SET content='{"x":1}' WHERE scenario_id='SIM-110' AND version=1`,
      ),
    ).rejects.toThrow(/immutable/);
  });
  it("audit log is append-only", async () => {
    await db.query(
      `INSERT INTO audit.events (seq, prev_hash, hash, actor_id, action, resource_type, resource_id, outcome) VALUES (1, repeat('0',64), repeat('1',64), 'U','x','r','1','succeeded')`,
    );
    await expect(db.query(`UPDATE audit.events SET outcome='denied'`)).rejects.toThrow(
      /append-only/,
    );
    await expect(db.query(`DELETE FROM audit.events`)).rejects.toThrow(/append-only/);
  });
  it("only a final publisher can set status to published", async () => {
    await expect(
      as("AUTH", "instructional_designer", (q) =>
        q(
          `UPDATE academy.scenario_versions SET status='published', published_at=now(), has_non_visual_path=true WHERE scenario_id='SIM-110' AND version=2`,
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("credentials at the database layer", () => {
  it("issued credentials cannot be deleted or altered, only revoked once", async () => {
    await db.query(`INSERT INTO credentials.issued (credential_id, definition_id, subject_id, payload, signature, key_id, issued_at)
      VALUES ('abcdefghijklmnopqrstuvwx','HH-RFC-CARPENTRY','L1','{}','sig','k1',now())`);
    await expect(db.query(`DELETE FROM credentials.issued`)).rejects.toThrow(/cannot be deleted/);
    await expect(
      db.query(`UPDATE credentials.issued SET payload='{"title":"forged"}'`),
    ).rejects.toThrow(/immutable/);
    await db.query(
      `UPDATE credentials.issued SET revoked_at=now(), revoked_reason='issued in error', revoked_by='C1U'`,
    );
    await expect(
      db.query(`UPDATE credentials.issued SET revoked_reason='again', revoked_at=now()`),
    ).rejects.toThrow(/already revoked/);
  });
  it("apprentices log hours but cannot verify their own", async () => {
    await as("L1", "learner", (q) =>
      q(
        `INSERT INTO credentials.ojt_hours (apprentice_id, work_process, project_ref, work_date, hours) VALUES ('L1','framing','FIXTURE-JOB-1','2026-11-05',8)`,
      ),
    );
    await expect(
      as("L1", "learner", (q) =>
        q(
          `INSERT INTO credentials.ojt_hours (apprentice_id, work_process, project_ref, work_date, hours, supervisor_id, verified_at) VALUES ('L1','framing','J','2026-11-05',8,'I1',now())`,
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    const updated = await as("L1", "learner", (q) =>
      q(`UPDATE credentials.ojt_hours SET supervisor_id='I1', verified_at=now() RETURNING id`),
    );
    expect(updated).toHaveLength(0); // RLS: apprentice can't update
    const v = await as("I1", "instructor", (q) =>
      q(
        `UPDATE credentials.ojt_hours SET supervisor_id='I1', verified_at=now() WHERE apprentice_id='L1' RETURNING id`,
      ),
    );
    expect(v).toHaveLength(1);
  });
  it("hours over 16 a day or self-supervision are rejected by constraints", async () => {
    await expect(
      db.query(
        `INSERT INTO credentials.ojt_hours (apprentice_id, work_process, project_ref, work_date, hours) VALUES ('L1','framing','J','2026-11-05',20)`,
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        `INSERT INTO credentials.ojt_hours (apprentice_id, work_process, project_ref, work_date, hours, supervisor_id) VALUES ('L1','framing','J','2026-11-05',4,'L1')`,
      ),
    ).rejects.toThrow();
  });
  it("learners can add outside credentials only as unverified", async () => {
    await expect(
      as("L1", "learner", (q) =>
        q(
          `INSERT INTO credentials.third_party (learner_id, credential_type, issuing_body, jurisdiction, earned_at, source, verification, verified_by, evidence_document_key)
       VALUES ('L1','OSHA-10-CONSTRUCTION','OSHA','VT','2026-10-01','earned_elsewhere','verified_primary_source','L1','x')`,
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    const ok = await as("L1", "learner", (q) =>
      q(
        `INSERT INTO credentials.third_party (learner_id, credential_type, issuing_body, jurisdiction, earned_at, source) VALUES ('L1','OSHA-10-CONSTRUCTION','OSHA','VT','2026-10-01','earned_elsewhere') RETURNING verification`,
      ),
    );
    expect(ok[0]!.verification).toBe("unverified");
  });
});
