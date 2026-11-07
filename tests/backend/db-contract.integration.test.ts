import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MIGRATION_FILES } from "@honorary-homes/database";
import { createDbTestHarness, type DbTestHarness } from "./db-test-harness.js";

let harness: DbTestHarness;

beforeAll(async () => {
  harness = await createDbTestHarness("db-contract");
  await harness.owner.exec(`
    INSERT INTO academy.orgs (id, name, org_type, individual_response_access)
      VALUES ('FIXTURE-db-org', 'FIXTURE — not real', 'internal', false);
    INSERT INTO academy.users (id, org_id, display_name)
      VALUES ('FIXTURE-db-learner', 'FIXTURE-db-org', 'FIXTURE — learner');
  `);
}, 60_000);

afterAll(async () => {
  if (harness) await harness.close();
});

describe("DbClient contract", () => {
  it("applies the forward-only migrations once and makes the rerun a no-op", () => {
    expect(harness.firstMigrationRun).toEqual(MIGRATION_FILES);
    expect(harness.secondMigrationRun).toEqual([]);
  });

  it("keeps app_login non-superuser, unable to bypass RLS, and a member of app_rw", async () => {
    const role = await harness.owner.query<{
      rolsuper: boolean;
      rolbypassrls: boolean;
      app_member: boolean;
    }>(`SELECT rolsuper, rolbypassrls,
              pg_has_role('app_login', 'app_rw', 'member') AS app_member
         FROM pg_roles WHERE rolname = 'app_login'`);
    expect(role.rows).toEqual([{ rolsuper: false, rolbypassrls: false, app_member: true }]);

    if (harness.app.engine === "postgresql") {
      const login = await harness.app.query<{ session_user: string }>(
        "SELECT session_user::text AS session_user",
      );
      expect(login.rows[0]?.session_user).toBe("app_login");
    }
  });

  it("does not leak transaction-local request identity into the next pooled transaction", async () => {
    await harness.asRole("app_rw", "FIXTURE-db-learner", "learner", null, async (query) => {
      const rows = await query(
        "SELECT current_setting('app.user_id', true) AS user_id, current_setting('app.roles', true) AS roles",
      );
      expect(rows[0]).toMatchObject({ user_id: "FIXTURE-db-learner", roles: "learner" });
    });

    await harness.app.transaction(async (transaction) => {
      await transaction.query("SET LOCAL ROLE app_rw");
      const rows = await transaction.query<{ user_id: string | null; roles: string | null }>(
        "SELECT nullif(current_setting('app.user_id', true), '') AS user_id, nullif(current_setting('app.roles', true), '') AS roles",
      );
      expect(rows.rows[0]).toEqual({ user_id: null, roles: null });
    });
  });

  it("allows exactly one concurrent insert for the same xAPI statement id", async () => {
    const statementId = "00000000-0000-4000-8000-000000000777";
    const insert = () =>
      harness.asRole("app_rw", "FIXTURE-db-learner", "learner", null, (query) =>
        query(
          `INSERT INTO training.xapi_statements (id, learner_id, verb, body)
           VALUES ($1, $2, $3, $4::jsonb)
           RETURNING id`,
          [
            statementId,
            "FIXTURE-db-learner",
            "http://adlnet.gov/expapi/verbs/experienced",
            JSON.stringify({ fixture: "FIXTURE — not real" }),
          ],
        ),
      );

    const results = await Promise.allSettled([insert(), insert()]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    const stored = await harness.owner.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM training.xapi_statements WHERE id = $1",
      [statementId],
    );
    expect(stored.rows[0]?.count).toBe(1);
  });
});
