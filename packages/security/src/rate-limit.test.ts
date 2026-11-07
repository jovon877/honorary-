import { describe, expect, it } from "vitest";
import { InMemoryRateLimitAdapter } from "./rate-limit.js";

describe("rate-limit adapter", () => {
  it("preserves the async Redis-facing contract with an in-memory implementation", async () => {
    const adapter = new InMemoryRateLimitAdapter({ capacity: 1, refillPerSecond: 1 }, () => 0);
    await expect(adapter.take("FIXTURE-key")).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    await expect(adapter.take("FIXTURE-key")).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
  });
});
