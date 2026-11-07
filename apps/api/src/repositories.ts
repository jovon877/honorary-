import { createPublicKey, type KeyObject } from "node:crypto";
import { SignedCredentialSchema, type SignedCredential } from "@honorary-homes/credentials";
import type { SqlExecutor } from "@honorary-homes/database";
import type { SimStatement } from "@honorary-homes/sim-xapi";

export interface CredentialLookup {
  credential: SignedCredential;
  publicKeys: ReadonlyMap<string, KeyObject>;
  revokedIds: ReadonlySet<string>;
}

export interface CredentialRepository {
  findPublicCredential(credentialId: string): Promise<CredentialLookup | null>;
}

export interface XapiRepository {
  hasStatement(statementId: string): Promise<boolean>;
  insertStatement(learnerId: string, statement: SimStatement): Promise<"inserted" | "duplicate">;
}

interface CredentialRow {
  payload: unknown;
  signature: string;
  revoked_at: string | null;
  public_key_pem: string;
}

export class PostgresCredentialRepository implements CredentialRepository {
  constructor(private readonly db: SqlExecutor) {}

  async findPublicCredential(credentialId: string): Promise<CredentialLookup | null> {
    const result = await this.db.query<CredentialRow>(
      `SELECT i.payload, i.signature, i.revoked_at, k.public_key_pem
       FROM credentials.issued i
       JOIN credentials.signing_keys k ON k.key_id = i.key_id
       WHERE i.credential_id = $1`,
      [credentialId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const credential = SignedCredentialSchema.parse({
      payload: row.payload,
      signature: row.signature,
    });
    return {
      credential,
      publicKeys: new Map([[credential.payload.keyId, createPublicKey(row.public_key_pem)]]),
      revokedIds: row.revoked_at ? new Set([credentialId]) : new Set(),
    };
  }
}

export class PostgresXapiRepository implements XapiRepository {
  constructor(private readonly db: SqlExecutor) {}

  async hasStatement(statementId: string): Promise<boolean> {
    const result = await this.db.query<{ present: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM training.xapi_statements WHERE id = $1) AS present",
      [statementId],
    );
    return result.rows[0]?.present ?? false;
  }

  async insertStatement(
    learnerId: string,
    statement: SimStatement,
  ): Promise<"inserted" | "duplicate"> {
    const result = await this.db.query<{ id: string }>(
      `INSERT INTO training.xapi_statements (id, learner_id, verb, body)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [statement.id, learnerId, statement.verb.id, JSON.stringify(statement)],
    );
    return result.rows.length === 1 ? "inserted" : "duplicate";
  }
}
