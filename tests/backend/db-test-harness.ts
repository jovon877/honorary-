import { randomUUID } from "node:crypto";
import {
  SET_REQUEST_IDENTITY_SQL,
  createDbClient,
  requestIdentityParameters,
  runMigrations,
  type DbClient,
  type SqlExecutor,
} from "@honorary-homes/database";

export type DatabaseRole = "app_rw" | "commerce_writer" | "credential_issuer";
export type TestRow = Record<string, unknown>;
export type TestQuery = (sql: string, parameters?: readonly unknown[]) => Promise<TestRow[]>;

export interface DbTestHarness {
  readonly owner: DbClient;
  readonly app: DbClient;
  readonly firstMigrationRun: readonly string[];
  readonly secondMigrationRun: readonly string[];
  asRole<T>(
    databaseRole: DatabaseRole,
    userId: string,
    roles: string,
    mfaVerifiedAt: number | null,
    run: (query: TestQuery) => Promise<T>,
  ): Promise<T>;
  close(): Promise<void>;
}

function databaseUrl(baseUrl: string, databaseName: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

function safeDatabaseName(suiteName: string): string {
  const stem = suiteName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `hh_${stem}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

async function runAsRole<T>(
  client: DbClient,
  databaseRole: DatabaseRole,
  userId: string,
  roles: string,
  mfaVerifiedAt: number | null,
  run: (query: TestQuery) => Promise<T>,
): Promise<T> {
  return client.transaction(async (transaction) => {
    await transaction.query(`SET LOCAL ROLE ${databaseRole}`);
    await transaction.query(
      SET_REQUEST_IDENTITY_SQL,
      requestIdentityParameters({
        userId,
        roles: roles ? roles.split(",") : [],
        mfaVerifiedAt,
      }),
    );
    return run(async (sql, parameters) => {
      const result = await transaction.query<TestRow>(sql, parameters);
      return result.rows;
    });
  });
}

export async function createDbTestHarness(suiteName: string): Promise<DbTestHarness> {
  const appBaseUrl = process.env.DATABASE_URL;
  const ownerBaseUrl = process.env.DATABASE_OWNER_URL;
  let admin: DbClient | undefined;
  let owner: DbClient;
  let app: DbClient;
  let testDatabaseName: string | undefined;

  if (appBaseUrl) {
    if (!ownerBaseUrl) throw new Error("DATABASE_OWNER_URL is required with DATABASE_URL");
    testDatabaseName = safeDatabaseName(suiteName);
    admin = await createDbClient({ databaseUrl: ownerBaseUrl });
    await admin.query(`CREATE DATABASE "${testDatabaseName}"`);
    owner = await createDbClient({ databaseUrl: databaseUrl(ownerBaseUrl, testDatabaseName) });
    app = await createDbClient({ databaseUrl: databaseUrl(appBaseUrl, testDatabaseName) });
  } else {
    owner = await createDbClient();
    app = owner;
  }

  const firstMigrationRun = await runMigrations(owner);
  const secondMigrationRun = await runMigrations(owner);

  return {
    owner,
    app,
    firstMigrationRun,
    secondMigrationRun,
    asRole(databaseRole, userId, roles, mfaVerifiedAt, run) {
      const client = databaseRole === "app_rw" ? app : owner;
      return runAsRole(client, databaseRole, userId, roles, mfaVerifiedAt, run);
    },
    async close() {
      if (app !== owner) await app.close();
      await owner.close();
      if (admin && testDatabaseName) {
        await admin.query(
          "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
          [testDatabaseName],
        );
        await admin.query(`DROP DATABASE "${testDatabaseName}"`);
        await admin.close();
      }
    },
  };
}

export async function queryRows<Row>(
  executor: SqlExecutor,
  sql: string,
  parameters?: readonly unknown[],
): Promise<Row[]> {
  return (await executor.query<Row>(sql, parameters)).rows;
}
