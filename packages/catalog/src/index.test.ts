import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InMemoryObjectStorage, signAssetUrl, verifyAssetUrl, type SignerConfig } from "./index.js";

const config: SignerConfig = {
  secret: randomBytes(32),
  assetOrigin: "https://assets.example.test",
  ttlSeconds: 600,
};

describe("asset URL boundary", () => {
  it("keeps private objects behind a copy-safe in-memory adapter", async () => {
    const storage = new InMemoryObjectStorage();
    const source = new Uint8Array([1, 2, 3]);
    await storage.put("sims/FIXTURE.glb", source);
    source[0] = 9;
    expect(await storage.get("sims/FIXTURE.glb")).toEqual(new Uint8Array([1, 2, 3]));
    await storage.delete("sims/FIXTURE.glb");
    expect(await storage.get("sims/FIXTURE.glb")).toBeNull();
    expect(() => storage.put("../secret", source)).toThrow(/invalid object key/);
  });

  it("requires a private-asset-safe HTTPS origin and a 5–15 minute lifetime", () => {
    expect(() =>
      signAssetUrl(
        { ...config, assetOrigin: "http://assets.example.test" },
        "FIXTURE-user",
        "x.glb",
        1,
      ),
    ).toThrow(/HTTPS/);
    expect(() => signAssetUrl({ ...config, ttlSeconds: 901 }, "FIXTURE-user", "x.glb", 1)).toThrow(
      /5 and 15/,
    );
  });

  it("rejects malformed URLs and signed query strings moved to another origin", () => {
    const signed = signAssetUrl(config, "FIXTURE-user", "sims/FIXTURE.glb", 1_000);
    expect(verifyAssetUrl(config, "not a URL", 1_001)).toMatchObject({ valid: false });
    expect(
      verifyAssetUrl(config, signed.replace(config.assetOrigin, "https://attacker.example"), 1_001),
    ).toEqual({ valid: false, reason: "wrong origin" });
  });
});
