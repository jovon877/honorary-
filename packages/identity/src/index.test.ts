import { describe, expect, it } from "vitest";
import {
  FixtureIdentityProvider,
  assertProviderAllowed,
  hasRecentMfa,
  selectIdentityProvider,
} from "./index.js";

const identity = {
  subject: "FIXTURE-learner",
  sessionId: "FIXTURE-session",
  roles: ["learner"],
  orgId: null,
  authenticatedAt: 1_800_000_000,
  mfaVerifiedAt: 1_800_000_000,
} as const;

describe("identity provider boundary", () => {
  it("forbids fixture identity in production", () => {
    expect(() => assertProviderAllowed("fixture", "production")).toThrow(/forbidden/);
    expect(() => new FixtureIdentityProvider("prod", [identity])).toThrow(/forbidden/);
  });

  it("returns marked fixture identities from HttpOnly-cookie-shaped input", async () => {
    const provider = new FixtureIdentityProvider("test", [identity]);
    const verified = await provider.verifySession({
      cookieHeader: "fixture_session=FIXTURE-session",
    });
    expect(verified).toMatchObject({
      subject: "FIXTURE-learner",
      fixture: true,
      provider: "fixture",
    });
    expect(await provider.verifySession({ bearerToken: "not-supported" })).toBeNull();
  });

  it("selects exactly one configured provider", () => {
    const provider = new FixtureIdentityProvider("test", [identity]);
    expect(selectIdentityProvider([provider], "fixture", "test")).toBe(provider);
    expect(() => selectIdentityProvider([], "fixture", "test")).toThrow(/exactly one/);
  });

  it("enforces the fifteen-minute step-up window", () => {
    const authenticated = { ...identity, provider: "fixture" as const, fixture: true };
    expect(hasRecentMfa(authenticated, 1_800_000_899)).toBe(true);
    expect(hasRecentMfa(authenticated, 1_800_000_901)).toBe(false);
  });
});
