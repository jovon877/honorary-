import { verifyCredential } from "@honorary-homes/credentials";
import type { IdentityProvider } from "@honorary-homes/identity";
import { createNonce, POLICIES, RateLimiter, securityHeaders } from "@honorary-homes/security";
import { ingestStatement, MAX_BODY_BYTES } from "@honorary-homes/sim-xapi";
import type { CredentialRepository, XapiRepository } from "./repositories.js";

export interface ApiDependencies {
  identityProvider: IdentityProvider;
  credentials: CredentialRepository;
  xapi: XapiRepository;
  securityOrigins: {
    assetOrigin: string;
    lrsOrigin: string;
  };
  nowMs?: () => number;
  xapiRateLimiter?: RateLimiter;
}

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
} as const;

export function createApiHandler(
  dependencies: ApiDependencies,
): (request: Request) => Promise<Response> {
  const nowMs = dependencies.nowMs ?? (() => Date.now());
  const limiter = dependencies.xapiRateLimiter ?? new RateLimiter(POLICIES.xapiIngest, nowMs);

  return async (request: Request): Promise<Response> => {
    const respond = (
      status: number,
      body: unknown,
      extraHeaders: Record<string, string> = {},
    ): Response =>
      json(status, body, {
        ...securityHeaders({ ...dependencies.securityOrigins, nonce: createNonce() }),
        ...extraHeaders,
      });
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return respond(200, { status: "ok", service: "honorary-homes-api", milestone: "M0.5" });
    }

    if (request.method === "GET" && url.pathname.startsWith("/verify/")) {
      const rawCredentialId = url.pathname.slice("/verify/".length);
      let credentialId: string;
      try {
        credentialId = decodeURIComponent(rawCredentialId);
      } catch {
        return notFound(respond);
      }
      if (!/^[A-Za-z0-9_-]{22,128}$/.test(credentialId)) return notFound(respond);
      const found = await dependencies.credentials.findPublicCredential(credentialId);
      if (!found) return notFound(respond);
      const status = verifyCredential(
        found.credential,
        found.publicKeys,
        found.revokedIds,
        new Date(nowMs()),
      );
      const { payload } = found.credential;
      return respond(200, {
        credentialId: payload.credentialId,
        definitionId: payload.definitionId,
        kind: payload.kind,
        title: payload.title,
        disclaimer: payload.disclaimer,
        issuer: payload.issuer,
        issuedAt: payload.issuedAt,
        expiresAt: payload.expiresAt ?? null,
        status,
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/xapi/statements") {
      const cookieHeader = request.headers.get("cookie");
      const identity = await dependencies.identityProvider.verifySession(
        cookieHeader === null ? {} : { cookieHeader },
      );
      if (!identity) return respond(401, { error: "authentication required" });
      if (!identity.roles.includes("learner"))
        return respond(403, { error: "learner role required" });
      const rate = limiter.take(`xapi:${identity.subject}`);
      if (!rate.allowed) {
        return respond(
          429,
          { error: "rate limit exceeded" },
          { "Retry-After": rate.retryAfterSeconds.toString() },
        );
      }

      const contentLength = request.headers.get("content-length");
      if (contentLength !== null && Number(contentLength) > MAX_BODY_BYTES) {
        return respond(413, { error: "statement rejected", details: ["payload too large"] });
      }
      const rawBody = await request.text();
      const statementId = readStatementId(rawBody);
      const duplicate = statementId ? await dependencies.xapi.hasStatement(statementId) : false;
      const result = ingestStatement(rawBody, {
        authenticatedLearnerId: identity.subject,
        nowMs: nowMs(),
        alreadyStored: (id) => duplicate && id === statementId,
      });
      if (result.status === "rejected") {
        return respond(result.httpStatus, {
          error: "statement rejected",
          details: result.errors,
        });
      }
      if (result.status === "duplicate") {
        return respond(200, { status: "duplicate", statementId: result.statementId });
      }
      const storageResult = await dependencies.xapi.insertStatement(
        identity.subject,
        result.statement,
      );
      if (storageResult === "duplicate") {
        return respond(200, { status: "duplicate", statementId: result.statement.id });
      }
      return respond(202, { status: "accepted", statementId: result.statement.id });
    }

    return notFound(respond);
  };
}

function readStatementId(rawBody: string): string | null {
  try {
    const value = JSON.parse(rawBody) as { id?: unknown };
    return typeof value.id === "string" ? value.id : null;
  } catch {
    return null;
  }
}

function notFound(
  respond: (status: number, body: unknown, extraHeaders?: Record<string, string>) => Response,
): Response {
  return respond(404, { error: "not found" });
}

function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}
