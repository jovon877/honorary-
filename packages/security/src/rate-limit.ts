/**
 * Token-bucket rate limiter with an injectable clock (deterministic in tests).
 * In production, back this with Redis (atomic Lua script) so limits hold across
 * instances; this in-memory version is the reference behavior and test oracle.
 */

export interface RateLimitPolicy {
  capacity: number;
  refillPerSecond: number;
}

/** Defaults per route class. Tune with real traffic data, never loosen silently. */
export const POLICIES = {
  login: { capacity: 5, refillPerSecond: 5 / 60 }, // 5/min per IP+account
  xapiIngest: { capacity: 120, refillPerSecond: 2 }, // bursty sim events per learner
  generation: { capacity: 10, refillPerSecond: 10 / 3600 }, // AI drafting per user
  publicRead: { capacity: 60, refillPerSecond: 1 },
} satisfies Record<string, RateLimitPolicy>;

interface Bucket {
  tokens: number;
  updatedAtMs: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(
    private readonly policy: RateLimitPolicy,
    private readonly now: () => number = () => Date.now(),
    private readonly maxKeys = 100_000,
  ) {}

  /** Returns whether the request is allowed and, if not, seconds until a token is available. */
  take(key: string, cost = 1): { allowed: boolean; retryAfterSeconds: number } {
    const nowMs = this.now();
    let b = this.buckets.get(key);
    if (!b) {
      if (this.buckets.size >= this.maxKeys) this.evictOldest();
      b = { tokens: this.policy.capacity, updatedAtMs: nowMs };
      this.buckets.set(key, b);
    }
    const elapsed = Math.max(0, (nowMs - b.updatedAtMs) / 1000);
    b.tokens = Math.min(this.policy.capacity, b.tokens + elapsed * this.policy.refillPerSecond);
    b.updatedAtMs = nowMs;

    if (b.tokens >= cost) {
      b.tokens -= cost;
      return { allowed: true, retryAfterSeconds: 0 };
    }
    const retry = Math.ceil((cost - b.tokens) / this.policy.refillPerSecond);
    return { allowed: false, retryAfterSeconds: retry };
  }

  private evictOldest(): void {
    const first = this.buckets.keys().next();
    if (!first.done) this.buckets.delete(first.value);
  }
}
