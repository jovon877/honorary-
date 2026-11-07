import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InMemoryKmsClient, signCredentialWithKms, verifyCredential } from "./index.js";

describe("credential signing adapter", () => {
  it("signs through the KMS interface without exposing a vendor client", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const kms = new InMemoryKmsClient(new Map([["FIXTURE-key", privateKey]]));
    const payload = {
      credentialId: "FIXTUREcredential00000002",
      definitionId: "FIXTURE-definition",
      kind: "completion_certificate" as const,
      title: "FIXTURE — not real",
      disclaimer: "FIXTURE — training completion only.",
      issuer: "Honorary Homes Academy" as const,
      subjectId: "FIXTURE-subject",
      issuedAt: "2026-11-06T00:00:00.000Z",
      keyId: "FIXTURE-key",
    };
    const credential = await signCredentialWithKms(payload, kms);
    expect(
      verifyCredential(
        credential,
        new Map([["FIXTURE-key", publicKey]]),
        new Set(),
        new Date("2026-11-06T00:00:01.000Z"),
      ),
    ).toBe("valid");
  });
});
