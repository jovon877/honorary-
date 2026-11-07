import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DbClient } from "@honorary-homes/database";
import { createDbTestHarness, type DbTestHarness } from "./db-test-harness.js";

let db: DbClient;
let harness: DbTestHarness;

type DatabaseRole = "app_rw" | "commerce_writer" | "credential_issuer";
type TestRow = Record<string, unknown>;
type TestQuery = (sql: string, parameters?: readonly unknown[]) => Promise<TestRow[]>;

async function asRole<T>(
  databaseRole: DatabaseRole,
  userId: string,
  roles: string,
  mfaVerifiedAt: number | null,
  run: (query: TestQuery) => Promise<T>,
): Promise<T> {
  return harness.asRole(databaseRole, userId, roles, mfaVerifiedAt, run);
}

beforeAll(async () => {
  harness = await createDbTestHarness("m0-5-controls");
  db = harness.owner;
  await db.exec(`
    INSERT INTO academy.orgs VALUES ('FIXTURE-org','FIXTURE — not real','internal',false);
    INSERT INTO academy.users (id, org_id, display_name) VALUES
      ('FIXTURE-author','FIXTURE-org','FIXTURE — objective author'),
      ('FIXTURE-owner','FIXTURE-org','FIXTURE — curriculum owner'),
      ('FIXTURE-learner','FIXTURE-org','FIXTURE — learner');
    INSERT INTO credentials.signing_keys (key_id, public_key_pem)
      VALUES ('FIXTURE-key','FIXTURE — public key placeholder');
    INSERT INTO academy.scenarios (id, title, sim_type, author_id)
      VALUES ('SIM-999', 'FIXTURE — not real', 'inspection', 'FIXTURE-author');
    INSERT INTO academy.scenario_versions
      (scenario_id, version, status, lesson_id, environment_id, content, content_hash)
      VALUES ('SIM-999', 1, 'draft', 'les_sim110', 'ENV-NE-01', '{}', repeat('c', 64));
  `);
}, 60_000);

afterAll(async () => {
  if (harness) await harness.close();
});

describe("M0.5 database controls", () => {
  it("starts the owner-managed objective and region registries empty", async () => {
    const objectives = await db.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM academy.learning_objectives",
    );
    const regions = await db.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM academy.region_configs",
    );
    expect(objectives.rows[0]?.count).toBe(0);
    expect(regions.rows[0]?.count).toBe(0);
  });

  it("prevents learners from enumerating users and draft catalog metadata", async () => {
    const users = await asRole("app_rw", "FIXTURE-learner", "learner", null, (query) =>
      query("SELECT id FROM academy.users ORDER BY id"),
    );
    const courses = await asRole("app_rw", "FIXTURE-learner", "learner", null, (query) =>
      query("SELECT id FROM academy.courses"),
    );
    const scenarios = await asRole("app_rw", "FIXTURE-learner", "learner", null, (query) =>
      query("SELECT id FROM academy.scenarios"),
    );
    expect(users.map((row) => row.id)).toEqual(["FIXTURE-learner"]);
    expect(courses).toHaveLength(0);
    expect(scenarios).toHaveLength(0);
  });

  it("keeps objective authors from approving their own text and freezes approved versions", async () => {
    await asRole("app_rw", "FIXTURE-author", "instructional_designer", null, async (query) => {
      await query(`INSERT INTO academy.learning_objectives
          (id, version, course_version_id, statement, bloom_level, source_package_id, created_by)
          VALUES ('FIXTURE-OBJ', 1, 'cv_construction_safety_1', 'FIXTURE — not real objective text',
                  'apply', 'FIXTURE-source', 'FIXTURE-author')`);
    });

    await expect(
      asRole("app_rw", "FIXTURE-author", "curriculum_owner", null, async (query) => {
        await query(`UPDATE academy.learning_objectives
            SET status='approved', approved_by='FIXTURE-author', approved_at=now()
            WHERE id='FIXTURE-OBJ' AND version=1`);
      }),
    ).rejects.toThrow();

    await asRole("app_rw", "FIXTURE-owner", "curriculum_owner", null, async (query) => {
      await query(`UPDATE academy.learning_objectives
          SET status='approved', approved_by='FIXTURE-owner', approved_at=now()
          WHERE id='FIXTURE-OBJ' AND version=1`);
    });

    await expect(
      db.query(`UPDATE academy.learning_objectives SET statement='changed' WHERE id='FIXTURE-OBJ'`),
    ).rejects.toThrow(/immutable/);
  });

  it("allows enrollment writes only through the dedicated commerce role", async () => {
    await expect(
      asRole("app_rw", "FIXTURE-owner", "platform_admin", null, async (query) => {
        await query(`INSERT INTO academy.enrollments
          (user_id, course_id, source) VALUES
          ('FIXTURE-learner', 'crs_construction_safety', 'purchase')`);
      }),
    ).rejects.toThrow(/permission denied/);

    const rows = await asRole("commerce_writer", "FIXTURE-commerce-event", "", null, (query) =>
      query(`INSERT INTO academy.enrollments
          (user_id, course_id, source) VALUES
          ('FIXTURE-learner', 'crs_construction_safety', 'purchase')
          RETURNING user_id`),
    );
    expect(rows[0]?.user_id).toBe("FIXTURE-learner");
  });

  it("allows issuance only through the issuer role with an approved, linted definition", async () => {
    const insert = `INSERT INTO credentials.issued
      (credential_id, definition_id, subject_id, payload, signature, key_id, issued_at)
      VALUES ('FIXTUREcredential00000001', 'HH-RFC-CARPENTRY', 'FIXTURE-learner',
              '{}', 'FIXTURE-signature', 'FIXTURE-key', now())`;

    await expect(
      asRole("app_rw", "FIXTURE-owner", "compliance_reviewer", null, async (query) => {
        await query(insert);
      }),
    ).rejects.toThrow(/permission denied/);

    await expect(
      asRole("credential_issuer", "FIXTURE-issuer", "", null, async (query) => {
        await query(insert);
      }),
    ).rejects.toThrow(/row-level security/);

    await db.query(`UPDATE credentials.definitions
      SET status='approved', claims_lint_passed=true WHERE id='HH-RFC-CARPENTRY'`);
    await asRole("credential_issuer", "FIXTURE-issuer", "", null, async (query) => {
      await query(insert);
    });
    const issued = await db.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM credentials.issued",
    );
    expect(issued.rows[0]?.count).toBe(1);

    await db.query(`INSERT INTO credentials.signing_keys (key_id, public_key_pem)
      VALUES ('FIXTURE-other-key', 'FIXTURE — another public key placeholder')`);
    await expect(
      db.query(`UPDATE credentials.issued SET key_id='FIXTURE-other-key'
        WHERE credential_id='FIXTUREcredential00000001'`),
    ).rejects.toThrow(/immutable/);
    await expect(
      db.query(`UPDATE credentials.issued
        SET revoked_at=now(), revoked_reason='FIXTURE — issued in error'
        WHERE credential_id='FIXTUREcredential00000001'`),
    ).rejects.toThrow();
  });

  it("enforces reviewer identity, separation of duties and recent MFA in PostgreSQL", async () => {
    const nowSeconds = Math.floor(Date.now() / 1_000);
    const insertApproval = (approverId: string) => `INSERT INTO academy.approvals
      (scenario_id, version, content_hash, review_type, approver_id, decision)
      VALUES ('SIM-999', 1, repeat('c', 64), 'trade_safety', '${approverId}', 'approved')`;

    await expect(
      asRole("app_rw", "FIXTURE-author", "trade_safety_reviewer", nowSeconds, async (query) => {
        await query(insertApproval("FIXTURE-author"));
      }),
    ).rejects.toThrow(/row-level security/);

    await expect(
      asRole("app_rw", "FIXTURE-owner", "trade_safety_reviewer", null, async (query) => {
        await query(insertApproval("FIXTURE-owner"));
      }),
    ).rejects.toThrow(/row-level security/);

    await asRole("app_rw", "FIXTURE-owner", "trade_safety_reviewer", nowSeconds, async (query) => {
      await query(insertApproval("FIXTURE-owner"));
    });
  });

  it("enforces the xAPI verb allowlist below the application boundary", async () => {
    await expect(
      asRole("app_rw", "FIXTURE-learner", "learner", null, async (query) => {
        await query(`INSERT INTO training.xapi_statements (id, learner_id, verb, body)
          VALUES ('00000000-0000-4000-8000-000000000099', 'FIXTURE-learner',
                  'https://attacker.example/verb', '{}')`);
      }),
    ).rejects.toThrow(/xapi_verb_allowlist/);
  });

  it("requires recent MFA and a privileged role to read the audit stream", async () => {
    await db.query(`INSERT INTO audit.events
      (seq, prev_hash, hash, actor_id, action, resource_type, resource_id, outcome)
      VALUES (1, repeat('0',64), repeat('1',64), 'FIXTURE-owner',
              'FIXTURE-action', 'FIXTURE-resource', '1', 'succeeded')`);

    const withoutMfa = await asRole("app_rw", "FIXTURE-owner", "platform_admin", null, (query) =>
      query("SELECT seq FROM audit.events"),
    );
    expect(withoutMfa).toHaveLength(0);

    const nowSeconds = Math.floor(Date.now() / 1_000);
    const withMfa = await asRole("app_rw", "FIXTURE-owner", "platform_admin", nowSeconds, (query) =>
      query("SELECT seq FROM audit.events"),
    );
    expect(withMfa.map((row) => row.seq)).toEqual([1]);
  });
});
