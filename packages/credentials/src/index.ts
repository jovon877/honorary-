/**
 * Honorary Homes Academy — credentials and certifications engine.
 *
 * Credential classes (what Honorary Homes may legally stand behind):
 *
 *  HH-ISSUED (Honorary Homes is the issuer)
 *   - completion_certificate     course completed per Academy completion rules
 *   - sim_competency_badge       passing Prove attempt(s), "Simulation practice — verified by replay"
 *   - ready_for_crew             in-person instructor sign-off; gates Earned Ground jobsite work
 *   - ojt_hours_record           on-the-job hours logged and supervisor-verified
 *
 *  THIRD-PARTY (another body is the issuer; we record and verify)
 *   - e.g. OSHA Outreach 10/30 card, EPA RRP Renovator, NCCER credential,
 *     Registered Apprenticeship completion (DOL/State Apprenticeship Agency), first aid/CPR.
 *   - Honorary Homes may DELIVER the training and record the credential only when a
 *     verified accreditation exists for that exact credential, issuer and jurisdiction,
 *     and it hasn't expired. Otherwise the system can only record a credential the
 *     learner earned elsewhere, with verification evidence.
 *
 * Every issued credential is signed (Ed25519), publicly verifiable, revocable and,
 * where applicable, expiring.
 */
import { generateKeyPairSync, sign, verify, type KeyObject } from "node:crypto";
import { canonicalJson, lintClaims } from "@honorary-homes/security";
import { z } from "zod";

export type HHCredentialKind =
  "completion_certificate" | "sim_competency_badge" | "ready_for_crew" | "ojt_hours_record";

export interface CredentialDefinition {
  id: string; // e.g. "HH-CC-CARP-ESS"
  kind: HHCredentialKind;
  title: string;
  /** Mandatory, displayed on every credential (spec §9). */
  disclaimer: string;
  courseId?: string;
  scenarioIds?: readonly string[];
  /** Validity in days; undefined = no expiry. Safety credentials should expire. */
  validDays?: number;
  minOjtHours?: number;
}

export interface LearnerEvidence {
  learnerId: string;
  courseCompleted: (courseId: string) => boolean;
  passedProveScenarioIds: ReadonlySet<string>;
  verifiedOjtHours: number;
  /** In-person sign-off record, if any. */
  readyForCrewSignoff?: { instructorId: string; signedAt: string; inPerson: true } | undefined;
}

export interface Eligibility {
  eligible: boolean;
  unmet: string[];
}

export function checkEligibility(def: CredentialDefinition, ev: LearnerEvidence): Eligibility {
  const unmet: string[] = [];
  if (!def.disclaimer || def.disclaimer.trim().length < 20)
    unmet.push("definition missing required disclaimer");
  if (lintClaims(`${def.title}\n${def.disclaimer}`).length > 0)
    unmet.push("definition contains a blocked claim");

  switch (def.kind) {
    case "completion_certificate":
      if (!def.courseId) unmet.push("definition missing courseId");
      else if (!ev.courseCompleted(def.courseId))
        unmet.push(`course ${def.courseId} not completed`);
      break;
    case "sim_competency_badge":
      if (!def.scenarioIds?.length) unmet.push("definition missing scenarioIds");
      for (const s of def.scenarioIds ?? [])
        if (!ev.passedProveScenarioIds.has(s)) unmet.push(`no passing Prove attempt for ${s}`);
      break;
    case "ready_for_crew":
      for (const s of def.scenarioIds ?? [])
        if (!ev.passedProveScenarioIds.has(s)) unmet.push(`no passing Prove attempt for ${s}`);
      if (!ev.readyForCrewSignoff?.inPerson) unmet.push("requires in-person instructor sign-off");
      else if (ev.readyForCrewSignoff.instructorId === ev.learnerId)
        unmet.push("learner cannot sign off themself");
      break;
    case "ojt_hours_record":
      if ((def.minOjtHours ?? 0) <= 0) unmet.push("definition missing minOjtHours");
      else if (ev.verifiedOjtHours < def.minOjtHours!)
        unmet.push(`needs ${def.minOjtHours} verified OJT hours, has ${ev.verifiedOjtHours}`);
      break;
  }
  return { eligible: unmet.length === 0, unmet };
}

// ---------- signing / verification --------------------------------------------

export interface CredentialPayload {
  credentialId: string; // random, unguessable
  definitionId: string;
  kind: HHCredentialKind;
  title: string;
  disclaimer: string;
  issuer: "Honorary Homes Academy";
  subjectId: string; // opaque learner id, never email or name on the public payload
  issuedAt: string;
  expiresAt?: string | undefined;
  keyId: string;
}

export interface SignedCredential {
  payload: CredentialPayload;
  signature: string; // base64url Ed25519
}

export const SignedCredentialSchema = z
  .object({
    payload: z
      .object({
        credentialId: z.string().regex(/^[A-Za-z0-9_-]{22,128}$/),
        definitionId: z.string().min(1).max(128),
        kind: z.enum([
          "completion_certificate",
          "sim_competency_badge",
          "ready_for_crew",
          "ojt_hours_record",
        ]),
        title: z.string().min(1).max(200),
        disclaimer: z.string().min(20).max(2_000),
        issuer: z.literal("Honorary Homes Academy"),
        subjectId: z.string().min(1).max(128),
        issuedAt: z.iso.datetime({ offset: true }),
        expiresAt: z.iso.datetime({ offset: true }).optional(),
        keyId: z.string().min(1).max(128),
      })
      .strict(),
    signature: z.string().regex(/^[A-Za-z0-9_-]+$/),
  })
  .strict();

export interface IssuerKey {
  keyId: string;
  privateKey: KeyObject;
  publicKey: KeyObject;
}

/** KMS/HSM boundary. Implementations must keep private key material non-exportable. */
export interface KmsClient {
  sign(keyId: string, payload: Uint8Array): Promise<Uint8Array>;
}

/** Local/test adapter only; it deliberately keeps its fixture key in memory. */
export class InMemoryKmsClient implements KmsClient {
  constructor(private readonly keys: ReadonlyMap<string, KeyObject>) {}

  sign(keyId: string, payload: Uint8Array): Promise<Uint8Array> {
    const key = this.keys.get(keyId);
    if (!key) throw new Error(`unknown fixture signing key: ${keyId}`);
    return Promise.resolve(sign(null, Buffer.from(payload), key));
  }
}

export async function signCredentialWithKms(
  payload: CredentialPayload,
  kms: KmsClient,
): Promise<SignedCredential> {
  const signature = await kms.sign(payload.keyId, Buffer.from(canonicalJson(payload)));
  return { payload, signature: Buffer.from(signature).toString("base64url") };
}

/** Dev/test only. Production keys live in a KMS/HSM and are never exported. */
export function generateIssuerKey(keyId: string): IssuerKey {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  return { keyId, privateKey, publicKey };
}

export function issueCredential(
  def: CredentialDefinition,
  ev: LearnerEvidence,
  key: IssuerKey,
  credentialId: string,
  now: Date,
): { ok: true; credential: SignedCredential } | { ok: false; unmet: string[] } {
  const e = checkEligibility(def, ev);
  if (!e.eligible) return { ok: false, unmet: e.unmet };
  if (!/^[A-Za-z0-9_-]{22,}$/.test(credentialId))
    throw new Error("credentialId must be random and >= 128 bits");

  const payload: CredentialPayload = {
    credentialId,
    definitionId: def.id,
    kind: def.kind,
    title: def.title,
    disclaimer: def.disclaimer,
    issuer: "Honorary Homes Academy",
    subjectId: ev.learnerId,
    issuedAt: now.toISOString(),
    ...(def.validDays
      ? { expiresAt: new Date(now.getTime() + def.validDays * 86_400_000).toISOString() }
      : {}),
    keyId: key.keyId,
  };
  const signature = sign(null, Buffer.from(canonicalJson(payload)), key.privateKey).toString(
    "base64url",
  );
  return { ok: true, credential: { payload, signature } };
}

export type VerificationStatus =
  "valid" | "revoked" | "expired" | "invalid_signature" | "unknown_key";

/** Backs the public verification page: /verify/[credentialId]. */
export function verifyCredential(
  c: SignedCredential,
  publicKeys: ReadonlyMap<string, KeyObject>,
  revokedIds: ReadonlySet<string>,
  now: Date,
): VerificationStatus {
  const pk = publicKeys.get(c.payload.keyId);
  if (!pk) return "unknown_key";
  const ok = verify(
    null,
    Buffer.from(canonicalJson(c.payload)),
    pk,
    Buffer.from(c.signature, "base64url"),
  );
  if (!ok) return "invalid_signature";
  if (revokedIds.has(c.payload.credentialId)) return "revoked";
  if (c.payload.expiresAt && Date.parse(c.payload.expiresAt) < now.getTime()) return "expired";
  return "valid";
}

// ---------- third-party credentials & accreditation ---------------------------

export interface Accreditation {
  /** e.g. "OSHA Outreach Training Program", "EPA RRP Accredited Training Provider", "NCCER ATS". */
  program: string;
  credentialType: string; // e.g. "OSHA-10-CONSTRUCTION", "EPA-RRP-RENOVATOR"
  issuingBody: string; // OSHA, EPA (or authorized state), NCCER, DOL/SAA
  jurisdiction: string; // "US" or state code
  accreditationNumber: string;
  validFrom: string;
  validUntil: string;
  verifiedByUserId: string; // compliance reviewer who checked the primary source
  evidenceDocumentKey: string;
}

export interface ThirdPartyCredentialRecord {
  learnerId: string;
  credentialType: string;
  issuingBody: string;
  jurisdiction: string;
  credentialNumber?: string; // stored encrypted at rest; never on public payloads
  earnedAt: string;
  expiresAt?: string;
  source: "delivered_by_honorary_homes" | "earned_elsewhere";
  verification: "unverified" | "verified_primary_source" | "rejected";
  verifiedByUserId?: string;
  evidenceDocumentKey?: string;
}

export function canDeliverThirdParty(
  credentialType: string,
  jurisdiction: string,
  accreditations: readonly Accreditation[],
  now: Date,
): { allowed: boolean; reason: string } {
  const match = accreditations.find(
    (a) =>
      a.credentialType === credentialType &&
      (a.jurisdiction === jurisdiction || a.jurisdiction === "US") &&
      Date.parse(a.validFrom) <= now.getTime() &&
      Date.parse(a.validUntil) >= now.getTime(),
  );
  if (!match) {
    return {
      allowed: false,
      reason: `no current verified accreditation for ${credentialType} in ${jurisdiction}; use "prepares you for" language only`,
    };
  }
  return { allowed: true, reason: `accredited via ${match.program} #${match.accreditationNumber}` };
}

export function validateThirdPartyRecord(
  r: ThirdPartyCredentialRecord,
  accreditations: readonly Accreditation[],
  now: Date,
): string[] {
  const problems: string[] = [];
  if (r.source === "delivered_by_honorary_homes") {
    const d = canDeliverThirdParty(
      r.credentialType,
      r.jurisdiction,
      accreditations,
      new Date(r.earnedAt),
    );
    if (!d.allowed) problems.push(d.reason);
  }
  if (
    r.verification === "verified_primary_source" &&
    (!r.verifiedByUserId || !r.evidenceDocumentKey)
  ) {
    problems.push("verified records need a verifier and evidence document");
  }
  if (r.expiresAt && Date.parse(r.expiresAt) < now.getTime()) problems.push("credential expired");
  return problems;
}

/** Only verified, unexpired third-party credentials may be displayed as held. */
export function displayableThirdParty(r: ThirdPartyCredentialRecord, now: Date): boolean {
  return (
    r.verification === "verified_primary_source" &&
    (!r.expiresAt || Date.parse(r.expiresAt) >= now.getTime())
  );
}
