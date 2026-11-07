import { randomBytes, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  generateIssuerKey,
  issueCredential,
  type CredentialDefinition,
  type LearnerEvidence,
} from "@honorary-homes/credentials";
import { FixtureIdentityProvider } from "@honorary-homes/identity";
import { SIM_VERB_IRIS, type SimStatement } from "@honorary-homes/sim-xapi";
import { createApiHandler } from "./handler.js";
import type { CredentialLookup, CredentialRepository, XapiRepository } from "./repositories.js";

const NOW_ISO = "2026-11-06T12:00:00.000Z";
const NOW_MS = Date.parse(NOW_ISO);
const SECURITY_ORIGINS = {
  assetOrigin: "https://assets.example.test",
  lrsOrigin: "https://api.example.test",
} as const;

class CredentialFixtureRepository implements CredentialRepository {
  constructor(private readonly records = new Map<string, CredentialLookup>()) {}
  findPublicCredential(credentialId: string): Promise<CredentialLookup | null> {
    return Promise.resolve(this.records.get(credentialId) ?? null);
  }
}

class XapiFixtureRepository implements XapiRepository {
  readonly statements: SimStatement[] = [];
  hasStatement(statementId: string): Promise<boolean> {
    return Promise.resolve(this.statements.some((statement) => statement.id === statementId));
  }
  insertStatement(_learnerId: string, statement: SimStatement): Promise<"inserted" | "duplicate"> {
    if (this.statements.some((stored) => stored.id === statement.id)) {
      return Promise.resolve("duplicate");
    }
    this.statements.push(structuredClone(statement));
    return Promise.resolve("inserted");
  }
}

const identity = new FixtureIdentityProvider("test", [
  {
    subject: "FIXTURE-learner",
    sessionId: "FIXTURE-session",
    roles: ["learner"],
    orgId: null,
    authenticatedAt: Math.floor(NOW_MS / 1000),
    mfaVerifiedAt: Math.floor(NOW_MS / 1000),
  },
]);

function statement(actor = "FIXTURE-learner", id = randomUUID()): Record<string, unknown> {
  const ext = "https://honoraryhomes.org/xapi/ext/";
  return {
    id,
    actor: { account: { homePage: "https://honoraryhomes.org", name: actor } },
    verb: { id: SIM_VERB_IRIS.passed },
    object: { id: "https://honoraryhomes.org/sim/FIXTURE-SIM" },
    result: { success: true, score: { scaled: 0.9 } },
    context: {
      registration: randomUUID(),
      extensions: {
        [`${ext}courseVersionId`]: "FIXTURE-course-version",
        [`${ext}lessonId`]: "FIXTURE-lesson",
        [`${ext}scenarioId`]: "FIXTURE-SIM",
        [`${ext}scenarioVersion`]: 1,
        [`${ext}attemptSeed`]: 42,
        [`${ext}stage`]: "prove",
      },
    },
    timestamp: "2026-11-06T11:59:00.000Z",
  };
}

describe("M0.5 API handler", () => {
  it("returns a minimal health response without environment details", async () => {
    const handler = createApiHandler({
      identityProvider: identity,
      credentials: new CredentialFixtureRepository(),
      xapi: new XapiFixtureRepository(),
      securityOrigins: SECURITY_ORIGINS,
      nowMs: () => NOW_MS,
    });
    const response = await handler(new Request("https://api.example.test/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      service: "honorary-homes-api",
      milestone: "M0.5",
    });
    expect(response.headers.get("strict-transport-security")).toContain("preload");
    expect(response.headers.get("content-security-policy")).toContain("wasm-unsafe-eval");
    expect(response.headers.get("content-security-policy")).not.toContain("'unsafe-eval'");
  });

  it("verifies a credential without exposing the opaque subject", async () => {
    const key = generateIssuerKey("FIXTURE-key");
    const definition: CredentialDefinition = {
      id: "FIXTURE-definition",
      kind: "completion_certificate",
      title: "FIXTURE — not real",
      disclaimer: "FIXTURE — course completion only; not a license or government credential.",
      courseId: "FIXTURE-course",
    };
    const evidence: LearnerEvidence = {
      learnerId: "FIXTURE-opaque-subject",
      courseCompleted: () => true,
      passedProveScenarioIds: new Set(),
      verifiedOjtHours: 0,
    };
    const credentialId = randomBytes(18).toString("base64url");
    const issued = issueCredential(definition, evidence, key, credentialId, new Date(NOW_MS));
    if (!issued.ok) throw new Error("fixture should be eligible");
    const records = new Map<string, CredentialLookup>([
      [
        credentialId,
        {
          credential: issued.credential,
          publicKeys: new Map([[key.keyId, key.publicKey]]),
          revokedIds: new Set(),
        },
      ],
    ]);
    const handler = createApiHandler({
      identityProvider: identity,
      credentials: new CredentialFixtureRepository(records),
      xapi: new XapiFixtureRepository(),
      securityOrigins: SECURITY_ORIGINS,
      nowMs: () => NOW_MS,
    });
    const response = await handler(new Request(`https://api.example.test/verify/${credentialId}`));
    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(body.status).toBe("valid");
    expect(body).not.toHaveProperty("subjectId");
  });

  it("uses the same not-found response for malformed and unknown credential ids", async () => {
    const handler = createApiHandler({
      identityProvider: identity,
      credentials: new CredentialFixtureRepository(),
      xapi: new XapiFixtureRepository(),
      securityOrigins: SECURITY_ORIGINS,
      nowMs: () => NOW_MS,
    });
    for (const id of ["bad", "abcdefghijklmnopqrstuvwx", "%E0%A4%A"]) {
      const response = await handler(new Request(`https://api.example.test/verify/${id}`));
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "not found" });
    }
  });

  it("requires an authenticated learner for xAPI ingest", async () => {
    const handler = createApiHandler({
      identityProvider: identity,
      credentials: new CredentialFixtureRepository(),
      xapi: new XapiFixtureRepository(),
      securityOrigins: SECURITY_ORIGINS,
      nowMs: () => NOW_MS,
    });
    const response = await handler(
      new Request("https://api.example.test/v1/xapi/statements", {
        method: "POST",
        body: JSON.stringify(statement()),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("accepts a valid statement once and returns duplicate thereafter", async () => {
    const xapi = new XapiFixtureRepository();
    const handler = createApiHandler({
      identityProvider: identity,
      credentials: new CredentialFixtureRepository(),
      xapi,
      securityOrigins: SECURITY_ORIGINS,
      nowMs: () => NOW_MS,
    });
    const id = randomUUID();
    const submit = () =>
      handler(
        new Request("https://api.example.test/v1/xapi/statements", {
          method: "POST",
          headers: { cookie: "fixture_session=FIXTURE-session" },
          body: JSON.stringify(statement("FIXTURE-learner", id)),
        }),
      );
    expect((await submit()).status).toBe(202);
    expect((await submit()).status).toBe(200);
    expect(xapi.statements).toHaveLength(1);
  });

  it("rejects actor spoofing before storage", async () => {
    const xapi = new XapiFixtureRepository();
    const handler = createApiHandler({
      identityProvider: identity,
      credentials: new CredentialFixtureRepository(),
      xapi,
      securityOrigins: SECURITY_ORIGINS,
      nowMs: () => NOW_MS,
    });
    const response = await handler(
      new Request("https://api.example.test/v1/xapi/statements", {
        method: "POST",
        headers: { cookie: "fixture_session=FIXTURE-session" },
        body: JSON.stringify(statement("FIXTURE-other")),
      }),
    );
    expect(response.status).toBe(403);
    expect(xapi.statements).toHaveLength(0);
  });

  it("rejects an oversized body from its declared length before parsing", async () => {
    const xapi = new XapiFixtureRepository();
    const handler = createApiHandler({
      identityProvider: identity,
      credentials: new CredentialFixtureRepository(),
      xapi,
      securityOrigins: SECURITY_ORIGINS,
      nowMs: () => NOW_MS,
    });
    const response = await handler(
      new Request("https://api.example.test/v1/xapi/statements", {
        method: "POST",
        headers: {
          cookie: "fixture_session=FIXTURE-session",
          "content-length": "20000",
        },
        body: "{}",
      }),
    );
    expect(response.status).toBe(413);
    expect(xapi.statements).toHaveLength(0);
  });
});
