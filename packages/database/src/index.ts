import { readFile } from "node:fs/promises";

export interface SqlQueryResult<Row> {
  rows: Row[];
}

export interface SqlExecutor {
  query<Row>(sql: string, parameters?: readonly unknown[]): Promise<SqlQueryResult<Row>>;
}

export const MIGRATION_FILES = [
  "001_init.sql",
  "002_credentials.sql",
  "003_seed_catalog.sql",
  "004_m0_5_controls.sql",
] as const;

export async function readMigrations(): Promise<readonly { name: string; sql: string }[]> {
  return Promise.all(
    MIGRATION_FILES.map(async (name) => ({
      name,
      sql: await readFile(new URL(`../../../db/migrations/${name}`, import.meta.url), "utf8"),
    })),
  );
}

export function requestIdentityParameters(input: {
  userId: string;
  roles: readonly string[];
  mfaVerifiedAt: number | null;
}): readonly [string, string, string] {
  const safe = /^[A-Za-z0-9._:@-]{1,128}$/;
  if (!safe.test(input.userId) || input.roles.some((role) => !safe.test(role))) {
    throw new Error("invalid database request identity");
  }
  return [input.userId, input.roles.join(","), input.mfaVerifiedAt?.toString() ?? ""];
}

export const SET_REQUEST_IDENTITY_SQL =
  "SELECT set_config('app.user_id', $1, true), set_config('app.roles', $2, true), set_config('app.mfa_verified_at', $3, true)";
