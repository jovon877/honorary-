import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

export interface SqlQueryResult<Row> {
  rows: Row[];
}

export interface SqlExecutor {
  query<Row>(sql: string, parameters?: readonly unknown[]): Promise<SqlQueryResult<Row>>;
}

export interface DbTransaction extends SqlExecutor {
  exec(sql: string): Promise<void>;
}

export interface DbClient extends DbTransaction {
  readonly engine: "pglite" | "postgresql";
  transaction<T>(run: (transaction: DbTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface DbClientOptions {
  /** Explicit URL wins. Otherwise DATABASE_URL selects pg; no URL selects PGlite. */
  databaseUrl?: string;
}

interface PgClientLike {
  query<Row>(sql: string, parameters?: unknown[]): Promise<SqlQueryResult<Row>>;
  release(): void;
}

interface PgPoolLike {
  query<Row>(sql: string, parameters?: unknown[]): Promise<SqlQueryResult<Row>>;
  connect(): Promise<PgClientLike>;
  end(): Promise<void>;
}

interface PgModuleLike {
  Pool: new (options: { connectionString: string }) => PgPoolLike;
}

interface PGliteLike {
  query<Row>(sql: string, parameters?: unknown[]): Promise<SqlQueryResult<Row>>;
  exec(sql: string): Promise<unknown>;
  transaction<T>(run: (transaction: PGliteLike) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

function mutable(parameters: readonly unknown[] | undefined): unknown[] | undefined {
  return parameters ? [...parameters] : undefined;
}

class PostgresDbClient implements DbClient {
  readonly engine = "postgresql" as const;

  constructor(private readonly pool: PgPoolLike) {}

  query<Row>(sql: string, parameters?: readonly unknown[]): Promise<SqlQueryResult<Row>> {
    const values = mutable(parameters);
    return values ? this.pool.query<Row>(sql, values) : this.pool.query<Row>(sql);
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async transaction<T>(run: (transaction: DbTransaction) => Promise<T>): Promise<T> {
    const connection = await this.pool.connect();
    await connection.query("BEGIN");
    try {
      const result = await run({
        exec: async (sql: string) => {
          await connection.query(sql);
        },
        query: <Row>(sql: string, parameters?: readonly unknown[]) => {
          const values = mutable(parameters);
          return values ? connection.query<Row>(sql, values) : connection.query<Row>(sql);
        },
      });
      await connection.query("COMMIT");
      return result;
    } catch (error) {
      await connection.query("ROLLBACK");
      throw error;
    } finally {
      connection.release();
    }
  }

  close(): Promise<void> {
    return this.pool.end();
  }
}

class PGliteDbClient implements DbClient {
  readonly engine = "pglite" as const;

  constructor(private readonly database: PGliteLike) {}

  query<Row>(sql: string, parameters?: readonly unknown[]): Promise<SqlQueryResult<Row>> {
    const values = mutable(parameters);
    return values ? this.database.query<Row>(sql, values) : this.database.query<Row>(sql);
  }

  async exec(sql: string): Promise<void> {
    await this.database.exec(sql);
  }

  transaction<T>(run: (transaction: DbTransaction) => Promise<T>): Promise<T> {
    return this.database.transaction((transaction) =>
      run({
        exec: async (sql: string) => {
          await transaction.exec(sql);
        },
        query: <Row>(sql: string, parameters?: readonly unknown[]) => {
          const values = mutable(parameters);
          return values ? transaction.query<Row>(sql, values) : transaction.query<Row>(sql);
        },
      }),
    );
  }

  close(): Promise<void> {
    return this.database.close();
  }
}

/**
 * The serverless-safe database boundary. Production uses pg only when a URL is
 * present; local and test runs stay in process through PGlite.
 */
export async function createDbClient(options: DbClientOptions = {}): Promise<DbClient> {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  if (databaseUrl) {
    const require = createRequire(import.meta.url);
    const { Pool } = require("pg") as PgModuleLike;
    return new PostgresDbClient(new Pool({ connectionString: databaseUrl }));
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const database = (await PGlite.create()) as unknown as PGliteLike;
  return new PGliteDbClient(database);
}

export const MIGRATION_FILES = [
  "001_init.sql",
  "002_credentials.sql",
  "003_seed_catalog.sql",
  "004_m0_5_controls.sql",
  "005_db_integration.sql",
] as const;

export interface Migration {
  name: string;
  sql: string;
  checksum: string;
}

export async function readMigrations(): Promise<readonly Migration[]> {
  return Promise.all(
    MIGRATION_FILES.map(async (name) => {
      const sql = await readFile(
        new URL(`../../../db/migrations/${name}`, import.meta.url),
        "utf8",
      );
      return {
        name,
        sql,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    }),
  );
}

/** Applies each forward-only migration once and detects edits to applied SQL. */
export async function runMigrations(client: DbClient): Promise<readonly string[]> {
  const migrations = await readMigrations();
  return client.transaction(async (transaction) => {
    if (client.engine === "postgresql") {
      await transaction.query("SELECT pg_advisory_xact_lock(723301121)");
    }
    await transaction.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const result = await transaction.query<{ name: string; checksum: string }>(
      "SELECT name, checksum FROM public.schema_migrations",
    );
    const applied = new Map(result.rows.map((row) => [row.name, row.checksum]));
    const newlyApplied: string[] = [];

    for (const migration of migrations) {
      const recordedChecksum = applied.get(migration.name);
      if (recordedChecksum) {
        if (recordedChecksum !== migration.checksum) {
          throw new Error(`applied migration changed: ${migration.name}`);
        }
        continue;
      }
      await transaction.exec(migration.sql);
      await transaction.query(
        "INSERT INTO public.schema_migrations (name, checksum) VALUES ($1, $2)",
        [migration.name, migration.checksum],
      );
      newlyApplied.push(migration.name);
    }
    return newlyApplied;
  });
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

/** `true` makes every value transaction-local; pooled sessions never retain identity. */
export const SET_REQUEST_IDENTITY_SQL =
  "SELECT set_config('app.user_id', $1, true), set_config('app.roles', $2, true), set_config('app.mfa_verified_at', $3, true)";
