/**
 * Course + 3D simulation catalog service (back end).
 *  - Public catalog shows only published course versions.
 *  - A simulation loads only if the learner has an active enrollment in the
 *    course that owns it AND the scenario version is published.
 *  - 3D assets (glTF/KTX2) are served through short-lived HMAC-signed URLs,
 *    scoped to one learner and one object key. No public bucket.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface CourseVersionRow {
  courseId: string;
  sku: string;
  slug: string;
  schoolSlug: string;
  title: string;
  version: number;
  status: string;
  priceCents: number;
}

export interface ScenarioVersionRow {
  scenarioId: string;
  version: number;
  status: string;
  courseId: string;
  assetKeys: readonly string[];
}

export function publicCatalog(rows: readonly CourseVersionRow[]): CourseVersionRow[] {
  // Latest published version per course only.
  const latest = new Map<string, CourseVersionRow>();
  for (const r of rows) {
    if (r.status !== "published") continue;
    const cur = latest.get(r.courseId);
    if (!cur || r.version > cur.version) latest.set(r.courseId, r);
  }
  return [...latest.values()].sort(
    (a, b) => a.schoolSlug.localeCompare(b.schoolSlug) || a.priceCents - b.priceCents,
  );
}

export interface Enrollment {
  userId: string;
  courseId: string;
  active: boolean;
}

export type LoadDecision =
  { ok: true; assetUrls: string[] } | { ok: false; status: 403 | 404; reason: string };

export interface SignerConfig {
  secret: Buffer; // >= 32 bytes, from the secrets manager, rotated
  assetOrigin: string;
  ttlSeconds: number; // keep short: 300–900
}

export function signAssetUrl(
  cfg: SignerConfig,
  userId: string,
  objectKey: string,
  nowSeconds: number,
): string {
  validateSignerConfig(cfg);
  if (!/^[A-Za-z0-9._:@-]{1,128}$/.test(userId)) throw new Error("invalid learner id");
  if (!/^[A-Za-z0-9/_.-]+$/.test(objectKey) || objectKey.includes(".."))
    throw new Error("invalid object key");
  const exp = nowSeconds + cfg.ttlSeconds;
  const sig = createHmac("sha256", cfg.secret)
    .update(`${objectKey}\n${userId}\n${exp}`)
    .digest("base64url");
  return `${cfg.assetOrigin}/${objectKey}?u=${encodeURIComponent(userId)}&exp=${exp}&sig=${sig}`;
}

export function verifyAssetUrl(
  cfg: SignerConfig,
  url: string,
  nowSeconds: number,
): { valid: boolean; reason?: string } {
  try {
    validateSignerConfig(cfg);
  } catch {
    return { valid: false, reason: "invalid signer configuration" };
  }
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { valid: false, reason: "invalid URL" };
  }
  if (u.origin !== cfg.assetOrigin) return { valid: false, reason: "wrong origin" };
  const objectKey = u.pathname.replace(/^\//, "");
  const userId = u.searchParams.get("u") ?? "";
  const exp = Number(u.searchParams.get("exp"));
  const sig = u.searchParams.get("sig") ?? "";
  if (!Number.isInteger(exp) || exp < nowSeconds) return { valid: false, reason: "expired" };
  if (exp > nowSeconds + cfg.ttlSeconds) return { valid: false, reason: "expiry exceeds limit" };
  const expected = createHmac("sha256", cfg.secret)
    .update(`${objectKey}\n${userId}\n${exp}`)
    .digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return { valid: false, reason: "bad signature" };
  return { valid: true };
}

function validateSignerConfig(cfg: SignerConfig): void {
  if (cfg.secret.length < 32) throw new Error("signing secret must be at least 32 bytes");
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/.test(cfg.assetOrigin))
    throw new Error("asset origin must be HTTPS and host-only");
  if (!Number.isInteger(cfg.ttlSeconds) || cfg.ttlSeconds < 300 || cfg.ttlSeconds > 900)
    throw new Error("asset URL lifetime must be between 5 and 15 minutes");
}

export function loadSimulation(
  learnerId: string,
  scenario: ScenarioVersionRow | undefined,
  enrollments: readonly Enrollment[],
  cfg: SignerConfig,
  nowSeconds: number,
): LoadDecision {
  // Same 404 for "missing" and "unpublished" so drafts can't be discovered by probing.
  if (!scenario || scenario.status !== "published")
    return { ok: false, status: 404, reason: "not found" };
  const enrolled = enrollments.some(
    (e) => e.userId === learnerId && e.courseId === scenario.courseId && e.active,
  );
  if (!enrolled)
    return {
      ok: false,
      status: 403,
      reason: "not enrolled in the course that contains this simulation",
    };
  return {
    ok: true,
    assetUrls: scenario.assetKeys.map((k) => signAssetUrl(cfg, learnerId, k, nowSeconds)),
  };
}
