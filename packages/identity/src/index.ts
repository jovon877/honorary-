export type IdentityProviderKind = "auth0" | "clerk" | "workos" | "fixture";

export interface SessionInput {
  cookieHeader?: string;
  bearerToken?: string;
}

export interface AuthenticatedIdentity {
  subject: string;
  sessionId: string;
  provider: IdentityProviderKind;
  roles: readonly string[];
  orgId: string | null;
  authenticatedAt: number;
  mfaVerifiedAt: number | null;
  fixture: boolean;
}

export interface IdentityProvider {
  readonly kind: IdentityProviderKind;
  verifySession(input: SessionInput): Promise<AuthenticatedIdentity | null>;
  revokeSession(sessionId: string): Promise<void>;
}

const PRODUCTION_ENVIRONMENTS = new Set(["prod", "production"]);

export function assertProviderAllowed(kind: IdentityProviderKind, environment: string): void {
  if (kind === "fixture" && PRODUCTION_ENVIRONMENTS.has(environment.toLowerCase())) {
    throw new Error("fixture identity provider is forbidden in production");
  }
}

export function selectIdentityProvider(
  providers: readonly IdentityProvider[],
  configuredKind: IdentityProviderKind,
  environment: string,
): IdentityProvider {
  assertProviderAllowed(configuredKind, environment);
  const matches = providers.filter((provider) => provider.kind === configuredKind);
  if (matches.length !== 1) {
    throw new Error(`exactly one ${configuredKind} identity provider must be configured`);
  }
  return matches[0]!;
}

export function hasRecentMfa(
  identity: AuthenticatedIdentity,
  nowSeconds: number,
  maxAgeSeconds = 15 * 60,
): boolean {
  return (
    identity.mfaVerifiedAt !== null &&
    identity.mfaVerifiedAt <= nowSeconds &&
    nowSeconds - identity.mfaVerifiedAt <= maxAgeSeconds
  );
}

/** Test/local development only. Every identity remains visibly marked as a fixture. */
export class FixtureIdentityProvider implements IdentityProvider {
  readonly kind = "fixture" as const;
  private readonly sessions = new Map<string, AuthenticatedIdentity>();

  constructor(
    environment: string,
    identities: readonly Omit<AuthenticatedIdentity, "provider" | "fixture">[],
  ) {
    assertProviderAllowed(this.kind, environment);
    for (const identity of identities) {
      this.sessions.set(identity.sessionId, { ...identity, provider: this.kind, fixture: true });
    }
  }

  verifySession(input: SessionInput): Promise<AuthenticatedIdentity | null> {
    const sessionId = parseFixtureSession(input.cookieHeader);
    const identity = sessionId ? this.sessions.get(sessionId) : undefined;
    return Promise.resolve(identity ? structuredClone(identity) : null);
  }

  revokeSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    return Promise.resolve();
  }
}

function parseFixtureSession(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const item of cookieHeader.split(";")) {
    const [name, ...rest] = item.trim().split("=");
    if (name === "fixture_session") return decodeURIComponent(rest.join("="));
  }
  return null;
}
