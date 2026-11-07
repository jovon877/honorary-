/**
 * HTTP security headers for the Academy apps, including the 3D sim player.
 * The sim player needs:
 *   - 'wasm-unsafe-eval' for Rapier/meshoptimizer WebAssembly (NOT 'unsafe-eval')
 *   - worker-src 'self' blob: for physics/decoder web workers
 *   - img/media/connect to the signed-asset CDN only
 */
import { randomBytes } from "node:crypto";

export interface HeaderOptions {
  assetOrigin: string; // e.g. https://assets.honoraryhomes.org
  lrsOrigin: string; // e.g. https://api.honoraryhomes.org
  nonce: string;
  reportUri?: string;
}

export function createNonce(): string {
  return randomBytes(16).toString("base64");
}

export function buildCsp(o: HeaderOptions): string {
  for (const origin of [o.assetOrigin, o.lrsOrigin]) {
    if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/.test(origin))
      throw new Error(`origin must be https and host-only: ${origin}`);
  }
  if (!/^[A-Za-z0-9+/=]{16,}$/.test(o.nonce)) throw new Error("invalid nonce");

  const directives: Record<string, string> = {
    "default-src": "'none'",
    "script-src": `'self' 'nonce-${o.nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`,
    "style-src": `'self' 'nonce-${o.nonce}'`,
    "img-src": `'self' data: blob: ${o.assetOrigin}`,
    "media-src": `'self' blob: ${o.assetOrigin}`,
    "font-src": "'self'",
    "connect-src": `'self' ${o.lrsOrigin} ${o.assetOrigin}`,
    "worker-src": "'self' blob:",
    "manifest-src": "'self'",
    "frame-src": "'none'",
    "frame-ancestors": "'self'",
    "object-src": "'none'",
    "base-uri": "'none'",
    "form-action": "'self'",
    "upgrade-insecure-requests": "",
  };
  if (o.reportUri) directives["report-uri"] = o.reportUri;
  return Object.entries(directives)
    .map(([k, v]) => (v ? `${k} ${v}` : k))
    .join("; ");
}

export function securityHeaders(o: HeaderOptions): Record<string, string> {
  return {
    "Content-Security-Policy": buildCsp(o),
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), xr-spatial-tracking=(self), fullscreen=(self)",
    "X-Frame-Options": "SAMEORIGIN",
  };
}
