/**
 * Tamper-evident, append-only audit log.
 * Each entry stores the SHA-256 of (previous hash + canonical JSON of the entry).
 * Editing, deleting or reordering any entry breaks verification from that point on.
 * The database enforces append-only too (see sql/001_init.sql); this adds detection
 * if someone with DB superuser access alters rows.
 */
import { createHash } from "node:crypto";

export interface AuditEvent {
  actorId: string;
  actorKind: "human" | "service";
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: "allowed" | "denied" | "succeeded" | "failed";
  reason?: string;
  requestId: string;
  occurredAt: string;
  /** Never put secrets, tokens, or learner free-text here. */
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AuditEntry extends AuditEvent {
  seq: number;
  prevHash: string;
  hash: string;
}

export const GENESIS_HASH = "0".repeat(64);

/** Deterministic JSON: keys sorted at every level. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",")}}`;
}

export function hashEntry(prevHash: string, seq: number, event: AuditEvent): string {
  return createHash("sha256")
    .update(prevHash)
    .update("\n")
    .update(canonicalJson({ seq, ...event }))
    .digest("hex");
}

const FORBIDDEN_METADATA_KEYS =
  /pass(word)?|token|secret|authorization|cookie|ssn|card|response_text/i;

export class AuditLog {
  private readonly entries: AuditEntry[] = [];

  append(event: AuditEvent): AuditEntry {
    for (const key of Object.keys(event.metadata ?? {})) {
      if (FORBIDDEN_METADATA_KEYS.test(key))
        throw new Error(`audit metadata key not allowed: ${key}`);
    }
    const prev = this.entries.at(-1);
    const seq = prev ? prev.seq + 1 : 1;
    const prevHash = prev ? prev.hash : GENESIS_HASH;
    const entry: AuditEntry = Object.freeze({
      ...event,
      seq,
      prevHash,
      hash: hashEntry(prevHash, seq, event),
    });
    this.entries.push(entry);
    return entry;
  }

  all(): readonly AuditEntry[] {
    return this.entries;
  }
}

export function verifyChain(entries: readonly AuditEntry[]): {
  valid: boolean;
  brokenAtSeq?: number;
} {
  let prevHash = GENESIS_HASH;
  let expectedSeq = 1;
  for (const e of entries) {
    const { seq, prevHash: storedPrev, hash, ...event } = e;
    if (
      seq !== expectedSeq ||
      storedPrev !== prevHash ||
      hashEntry(prevHash, seq, event) !== hash
    ) {
      return { valid: false, brokenAtSeq: seq };
    }
    prevHash = hash;
    expectedSeq++;
  }
  return { valid: true };
}
