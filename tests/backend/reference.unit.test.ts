import { describe, expect, it } from "vitest";
import { randomUUID, randomBytes } from "node:crypto";
import {
  authorize,
  type Principal,
  type TrainingRecordResource,
} from "@honorary-homes/authorization";
import {
  canPublishScenario,
  type Approval,
  type ScenarioVersionRef,
} from "@honorary-homes/publishing";
import { ingestStatement, SIM_VERB_IRIS } from "@honorary-homes/sim-xapi";
import {
  AuditLog,
  RateLimiter,
  buildCsp,
  createNonce,
  lintClaims,
  redact,
  securityHeaders,
  verifyChain,
} from "@honorary-homes/security";
import {
  loadSimulation,
  publicCatalog,
  signAssetUrl,
  verifyAssetUrl,
} from "@honorary-homes/catalog";
import {
  canDeliverThirdParty,
  checkEligibility,
  displayableThirdParty,
  generateIssuerKey,
  issueCredential,
  validateThirdPartyRecord,
  verifyCredential,
  type CredentialDefinition,
  type LearnerEvidence,
} from "@honorary-homes/credentials";

const NOW = 1_800_000_000;
const human = (
  id: string,
  roles: Principal["roles"],
  extra: Partial<Principal> = {},
): Principal => ({
  id,
  kind: "human",
  roles,
  orgId: "org1",
  instructsCohortIds: [],
  mfaVerifiedAt: NOW - 60,
  ...extra,
});
const record = (o: Partial<TrainingRecordResource> = {}): TrainingRecordResource => ({
  type: "training_record",
  learnerId: "L1",
  orgId: "org1",
  cohortId: "C1",
  orgIndividualAccessAuthorized: false,
  ...o,
});

describe("authorization", () => {
  it("denies by default and lets learners read only their own records", () => {
    expect(authorize(human("L1", ["learner"]), "attempt.read", record(), NOW).allow).toBe(true);
    expect(authorize(human("L2", ["learner"]), "attempt.read", record(), NOW).allow).toBe(false);
  });
  it("instructors only see cohorts they teach", () => {
    const i = human("I1", ["instructor"], { instructsCohortIds: ["C1"] });
    expect(authorize(i, "attempt.read", record(), NOW).allow).toBe(true);
    expect(authorize(i, "attempt.read", record({ cohortId: "C9" }), NOW).allow).toBe(false);
  });
  it("property/housing staff are denied even if they also hold instructor", () => {
    const p = human("P1", ["instructor", "property_staff"], { instructsCohortIds: ["C1"] });
    const d = authorize(p, "attempt.read", record(), NOW);
    expect(d.allow).toBe(false);
    expect(d.reason).toMatch(/separation/);
  });
  it("platform admins cannot read private learner responses", () => {
    expect(authorize(human("A1", ["platform_admin"]), "response.read", record(), NOW).allow).toBe(
      false,
    );
  });
  it("org admins see individuals only with contract authorization", () => {
    const o = human("O1", ["org_admin"]);
    expect(authorize(o, "response.read", record(), NOW).allow).toBe(false);
    expect(
      authorize(o, "response.read", record({ orgIndividualAccessAuthorized: true }), NOW).allow,
    ).toBe(true);
    expect(authorize(o, "aggregate.read", { type: "org", orgId: "org2" }, NOW).allow).toBe(false);
  });
  it("AI service principals can only draft", () => {
    const ai: Principal = {
      id: "svc:content-ai",
      kind: "service",
      roles: ["final_publisher"],
      orgId: null,
      instructsCohortIds: [],
      mfaVerifiedAt: NOW,
    };
    expect(authorize(ai, "scenario.draft.create", { type: "system" }, NOW).allow).toBe(true);
    expect(
      authorize(
        ai,
        "scenario.publish",
        { type: "scenario", scenarioId: "SIM-110", authorId: "x" },
        NOW,
      ).allow,
    ).toBe(false);
    expect(authorize(ai, "attempt.read", record(), NOW).allow).toBe(false);
  });
  it("publishing requires step-up MFA and separation of duties", () => {
    const res = { type: "scenario", scenarioId: "SIM-110", authorId: "AUTH" } as const;
    expect(
      authorize(
        human("P", ["final_publisher"], { mfaVerifiedAt: NOW - 3600 }),
        "scenario.publish",
        res,
        NOW,
      ).allow,
    ).toBe(false);
    expect(authorize(human("P", ["final_publisher"]), "scenario.publish", res, NOW).allow).toBe(
      true,
    );
    expect(authorize(human("AUTH", ["final_publisher"]), "scenario.publish", res, NOW).allow).toBe(
      false,
    );
  });
});

describe("publish gate", () => {
  const s: ScenarioVersionRef = {
    scenarioId: "SIM-110",
    version: 1,
    status: "approved",
    authorId: "AUTH",
    contentHash: "a".repeat(64),
    reviewRequirements: ["trade_safety", "instructional_design"],
    hasNonVisualPath: true,
    claimsLintPassed: true,
  };
  const ap = (
    reviewType: Approval["reviewType"],
    approverId: string,
    o: Partial<Approval> = {},
  ): Approval => ({
    scenarioId: "SIM-110",
    version: 1,
    contentHash: "a".repeat(64),
    reviewType,
    approverId,
    approverKind: "human",
    decision: "approved",
    decidedAt: "2026-11-06T00:00:00Z",
    ...o,
  });
  const full = [
    ap("trade_safety", "R1"),
    ap("instructional_design", "R2"),
    ap("accessibility", "R3"),
    ap("final_publisher", "R4"),
  ];

  it("passes with every required human approval", () =>
    expect(canPublishScenario(s, full).ok).toBe(true));
  it("fails when the author approves their own work", () => {
    expect(canPublishScenario(s, [...full.slice(1), ap("trade_safety", "AUTH")]).ok).toBe(false);
  });
  it("ignores AI approvals and approvals of a different content hash", () => {
    expect(
      canPublishScenario(s, [
        ap("trade_safety", "R1", { approverKind: "service" }),
        ...full.slice(1),
      ]).ok,
    ).toBe(false);
    expect(
      canPublishScenario(s, [
        ap("trade_safety", "R1", { contentHash: "b".repeat(64) }),
        ...full.slice(1),
      ]).ok,
    ).toBe(false);
  });
  it("blocks on an open rejection, missing non-3D path, or failed claims lint", () => {
    expect(
      canPublishScenario(s, [...full, ap("trade_safety", "R5", { decision: "rejected" })]).ok,
    ).toBe(false);
    expect(canPublishScenario({ ...s, hasNonVisualPath: false }, full).ok).toBe(false);
    expect(canPublishScenario({ ...s, claimsLintPassed: false }, full).ok).toBe(false);
  });
  it("requires two distinct people", () => {
    const one = full.map((a) => ({ ...a, approverId: "R1" }));
    expect(canPublishScenario(s, one).problems).toContain(
      "requires at least two distinct human approvers",
    );
  });
});

describe("xAPI ingestion", () => {
  const nowMs = Date.parse("2026-11-06T12:00:00Z");
  const EXT = "https://honoraryhomes.org/xapi/ext/";
  const make = (o: Record<string, unknown> = {}) => ({
    id: randomUUID(),
    actor: { account: { homePage: "https://honoraryhomes.org", name: "L1" } },
    verb: { id: SIM_VERB_IRIS.passed },
    object: { id: "https://honoraryhomes.org/sim/SIM-110" },
    result: { success: true, score: { scaled: 0.9 } },
    context: {
      registration: randomUUID(),
      extensions: {
        [`${EXT}courseVersionId`]: "cv_construction_safety_1",
        [`${EXT}lessonId`]: "les_sim110",
        [`${EXT}scenarioId`]: "SIM-110",
        [`${EXT}scenarioVersion`]: 1,
        [`${EXT}attemptSeed`]: 42,
        [`${EXT}stage`]: "prove",
      },
    },
    timestamp: "2026-11-06T11:59:00Z",
    ...o,
  });
  const ctx = { authenticatedLearnerId: "L1", nowMs, alreadyStored: () => false };

  it("accepts a valid statement", () =>
    expect(ingestStatement(JSON.stringify(make()), ctx).status).toBe("accepted"));
  it("rejects actor spoofing with 403", () => {
    const r = ingestStatement(JSON.stringify(make()), { ...ctx, authenticatedLearnerId: "L2" });
    expect(r).toMatchObject({ status: "rejected", httpStatus: 403 });
  });
  it("rejects unknown keys (no free-text smuggling) and unknown verbs", () => {
    expect(ingestStatement(JSON.stringify(make({ notes: "my address is ..." })), ctx).status).toBe(
      "rejected",
    );
    expect(
      ingestStatement(JSON.stringify(make({ verb: { id: "http://evil/verb" } })), ctx).status,
    ).toBe("rejected");
  });
  it("rejects oversized, malformed, future and stale payloads", () => {
    expect(ingestStatement("x".repeat(20_000), ctx)).toMatchObject({ httpStatus: 413 });
    expect(ingestStatement("{not json", ctx)).toMatchObject({ httpStatus: 400 });
    expect(
      ingestStatement(JSON.stringify(make({ timestamp: "2026-11-06T13:00:00Z" })), ctx).status,
    ).toBe("rejected");
    expect(
      ingestStatement(JSON.stringify(make({ timestamp: "2026-10-01T00:00:00Z" })), ctx).status,
    ).toBe("rejected");
  });
  it("is idempotent", () => {
    expect(
      ingestStatement(JSON.stringify(make()), { ...ctx, alreadyStored: () => true }).status,
    ).toBe("duplicate");
  });
});

describe("audit log", () => {
  it("detects tampering anywhere in the chain", () => {
    const log = new AuditLog();
    for (let i = 0; i < 5; i++) {
      log.append({
        actorId: "U1",
        actorKind: "human",
        action: "scenario.publish",
        resourceType: "scenario",
        resourceId: `SIM-11${i}`,
        outcome: "succeeded",
        requestId: `r${i}`,
        occurredAt: "2026-11-06T00:00:00Z",
      });
    }
    expect(verifyChain(log.all()).valid).toBe(true);
    const tampered = log.all().map((e) => ({ ...e }));
    tampered[2]!.outcome = "denied";
    expect(verifyChain(tampered)).toEqual({ valid: false, brokenAtSeq: 3 });
    expect(verifyChain([...log.all()].filter((e) => e.seq !== 2)).valid).toBe(false);
  });
  it("refuses secrets in metadata", () => {
    expect(() =>
      new AuditLog().append({
        actorId: "U",
        actorKind: "human",
        action: "a",
        resourceType: "r",
        resourceId: "1",
        outcome: "succeeded",
        requestId: "x",
        occurredAt: "2026-11-06T00:00:00Z",
        metadata: { accessToken: "abc" },
      }),
    ).toThrow();
  });
});

describe("rate limiter", () => {
  it("blocks after capacity and refills over time", () => {
    let t = 0;
    const rl = new RateLimiter({ capacity: 3, refillPerSecond: 1 }, () => t);
    expect([1, 2, 3].map(() => rl.take("ip").allowed)).toEqual([true, true, true]);
    expect(rl.take("ip")).toEqual({ allowed: false, retryAfterSeconds: 1 });
    t += 1000;
    expect(rl.take("ip").allowed).toBe(true);
  });
});

describe("security headers", () => {
  it("allows WASM for physics without unsafe-eval and blocks framing/objects", () => {
    const csp = buildCsp({
      assetOrigin: "https://assets.honoraryhomes.org",
      lrsOrigin: "https://api.honoraryhomes.org",
      nonce: createNonce(),
    });
    expect(csp).toContain("'wasm-unsafe-eval'");
    expect(csp).not.toMatch(/'unsafe-eval'|'unsafe-inline'/);
    expect(csp).toContain("object-src 'none'");
    expect(
      securityHeaders({
        assetOrigin: "https://a.example.org",
        lrsOrigin: "https://b.example.org",
        nonce: createNonce(),
      })["Strict-Transport-Security"],
    ).toMatch(/max-age=63072000/);
  });
  it("rejects non-https origins", () => {
    expect(() =>
      buildCsp({ assetOrigin: "http://x.org", lrsOrigin: "https://y.org", nonce: createNonce() }),
    ).toThrow();
  });
});

describe("claims linter and redaction", () => {
  it("flags certification and guarantee language, allows prep language", () => {
    expect(lintClaims("Get OSHA 10 certified and a guaranteed job!").map((f) => f.ruleId)).toEqual(
      expect.arrayContaining(["certified", "osha-card", "job-guarantee"]),
    );
    expect(lintClaims("This simulation prepares you for OSHA 10 training.")).toEqual([]);
    expect(lintClaims("You would have died.").map((f) => f.ruleId)).toContain("injury-imagery");
  });
  it("redacts PII and secrets before AI or logs", () => {
    const r = redact(
      "email jo@ex.com call 207-555-0134 key sk-abcdefghijklmnopqrstu ssn 123-45-6789",
    );
    expect(r.text).not.toMatch(/jo@ex\.com|555-0134|sk-abc|123-45-6789/);
    expect(r.redactions).toMatchObject({ EMAIL: 1, PHONE: 1, API_KEY: 1, SSN: 1 });
  });
});

describe("course + simulation catalog", () => {
  const cfg = {
    secret: randomBytes(32),
    assetOrigin: "https://assets.honoraryhomes.org",
    ttlSeconds: 600,
  };
  it("public catalog shows only latest published versions", () => {
    const rows = [
      {
        courseId: "c1",
        sku: "A",
        slug: "a",
        schoolSlug: "skilled-trades",
        title: "A",
        version: 1,
        status: "published",
        priceCents: 39900,
      },
      {
        courseId: "c1",
        sku: "A",
        slug: "a",
        schoolSlug: "skilled-trades",
        title: "A",
        version: 2,
        status: "published",
        priceCents: 39900,
      },
      {
        courseId: "c2",
        sku: "B",
        slug: "b",
        schoolSlug: "skilled-trades",
        title: "B",
        version: 1,
        status: "draft",
        priceCents: 59900,
      },
    ];
    expect(publicCatalog(rows).map((r) => [r.courseId, r.version])).toEqual([["c1", 2]]);
  });
  it("loads a sim only for enrolled learners and hides drafts as 404", () => {
    const sim = {
      scenarioId: "SIM-110",
      version: 1,
      status: "published",
      courseId: "c1",
      assetKeys: ["sims/SIM-110/v1/house.glb"],
    };
    const ok = loadSimulation(
      "L1",
      sim,
      [{ userId: "L1", courseId: "c1", active: true }],
      cfg,
      NOW,
    );
    expect(ok.ok).toBe(true);
    expect(
      loadSimulation("L2", sim, [{ userId: "L1", courseId: "c1", active: true }], cfg, NOW),
    ).toMatchObject({ status: 403 });
    expect(
      loadSimulation(
        "L1",
        { ...sim, status: "draft" },
        [{ userId: "L1", courseId: "c1", active: true }],
        cfg,
        NOW,
      ),
    ).toMatchObject({ status: 404 });
  });
  it("signed asset URLs expire and resist tampering", () => {
    const url = signAssetUrl(cfg, "L1", "sims/SIM-110/v1/house.glb", NOW);
    expect(verifyAssetUrl(cfg, url, NOW + 10).valid).toBe(true);
    expect(verifyAssetUrl(cfg, url, NOW + 601).valid).toBe(false);
    expect(verifyAssetUrl(cfg, url.replace("u=L1", "u=L2"), NOW).valid).toBe(false);
    expect(() => signAssetUrl(cfg, "L1", "../secrets", NOW)).toThrow();
  });
});

describe("credentials and certifications", () => {
  const key = generateIssuerKey("hh-2026-01");
  const keys = new Map([[key.keyId, key.publicKey]]);
  const now = new Date("2026-11-06T00:00:00Z");
  const rfc: CredentialDefinition = {
    id: "HH-RFC-CARPENTRY",
    kind: "ready_for_crew",
    title: "Ready for Crew — Carpentry",
    disclaimer: "Internal Honorary Homes readiness sign-off by an instructor, in person.",
    scenarioIds: ["SIM-110", "SIM-121"],
    validDays: 365,
  };
  const ev = (o: Partial<LearnerEvidence> = {}): LearnerEvidence => ({
    learnerId: "L1",
    courseCompleted: () => true,
    passedProveScenarioIds: new Set(["SIM-110", "SIM-121"]),
    verifiedOjtHours: 0,
    readyForCrewSignoff: { instructorId: "I1", signedAt: "2026-11-05T00:00:00Z", inPerson: true },
    ...o,
  });
  const id = () => randomBytes(18).toString("base64url");

  it("Ready for Crew needs passed sims AND an in-person sign-off by someone else", () => {
    expect(checkEligibility(rfc, ev()).eligible).toBe(true);
    expect(checkEligibility(rfc, ev({ readyForCrewSignoff: undefined })).unmet).toContain(
      "requires in-person instructor sign-off",
    );
    expect(
      checkEligibility(
        rfc,
        ev({ readyForCrewSignoff: { instructorId: "L1", signedAt: "x", inPerson: true } }),
      ).eligible,
    ).toBe(false);
    expect(
      checkEligibility(rfc, ev({ passedProveScenarioIds: new Set(["SIM-110"]) })).eligible,
    ).toBe(false);
  });
  it("issues signed credentials that verify, expire and can be revoked", () => {
    const r = issueCredential(rfc, ev(), key, id(), now);
    if (!r.ok) throw new Error("expected issue");
    expect(verifyCredential(r.credential, keys, new Set(), now)).toBe("valid");
    expect(
      verifyCredential(r.credential, keys, new Set([r.credential.payload.credentialId]), now),
    ).toBe("revoked");
    expect(verifyCredential(r.credential, keys, new Set(), new Date("2028-01-01"))).toBe("expired");
    const forged = {
      ...r.credential,
      payload: { ...r.credential.payload, title: "Master Carpenter License" },
    };
    expect(verifyCredential(forged, keys, new Set(), now)).toBe("invalid_signature");
    expect(JSON.stringify(r.credential.payload)).not.toMatch(/@/); // no emails on public payload
  });
  it("OJT hours record needs enough supervisor-verified hours", () => {
    const ojt: CredentialDefinition = {
      id: "HH-OJT-CARP-500",
      kind: "ojt_hours_record",
      title: "OJT 500",
      disclaimer: "Record of supervisor-verified on-the-job hours.",
      minOjtHours: 500,
    };
    expect(checkEligibility(ojt, ev({ verifiedOjtHours: 499 })).eligible).toBe(false);
    expect(checkEligibility(ojt, ev({ verifiedOjtHours: 500 })).eligible).toBe(true);
  });
  it("third-party credentials (OSHA, EPA RRP) need a current accreditation to be delivered by Honorary Homes", () => {
    const acc = [
      {
        program: "EPA RRP Accredited Training Provider",
        credentialType: "EPA-RRP-RENOVATOR",
        issuingBody: "EPA",
        jurisdiction: "US",
        accreditationNumber: "TEST-0001",
        validFrom: "2026-01-01",
        validUntil: "2027-01-01",
        verifiedByUserId: "COMP1",
        evidenceDocumentKey: "docs/acc/rrp.pdf",
      },
    ];
    expect(canDeliverThirdParty("OSHA-10-CONSTRUCTION", "VT", acc, now).allowed).toBe(false);
    expect(canDeliverThirdParty("EPA-RRP-RENOVATOR", "ME", acc, now).allowed).toBe(true);
    expect(
      canDeliverThirdParty("EPA-RRP-RENOVATOR", "ME", acc, new Date("2027-06-01")).allowed,
    ).toBe(false);
    const rec = {
      learnerId: "L1",
      credentialType: "OSHA-10-CONSTRUCTION",
      issuingBody: "OSHA",
      jurisdiction: "VT",
      earnedAt: "2026-10-01",
      source: "delivered_by_honorary_homes" as const,
      verification: "unverified" as const,
    };
    expect(validateThirdPartyRecord(rec, acc, now).length).toBeGreaterThan(0);
    expect(displayableThirdParty({ ...rec, source: "earned_elsewhere" }, now)).toBe(false);
    expect(
      displayableThirdParty(
        {
          ...rec,
          source: "earned_elsewhere",
          verification: "verified_primary_source",
          verifiedByUserId: "C",
          evidenceDocumentKey: "k",
        },
        now,
      ),
    ).toBe(true);
  });
});
