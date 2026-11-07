/**
 * Redaction before any text is sent to an AI provider or written to logs
 * (Academy spec §22.2). Defense in depth: the primary control is never putting
 * learner records into generation prompts at all.
 */

const PATTERNS: ReadonlyArray<[label: string, re: RegExp]> = [
  ["EMAIL", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],
  ["SSN", /\b\d{3}-\d{2}-\d{4}\b/g],
  ["CARD", /\b(?:\d[ -]?){13,19}\b/g],
  ["PHONE", /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g],
  ["BEARER", /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/g],
  ["API_KEY", /\b(sk|pk|rk)[-_][A-Za-z0-9_-]{16,}\b/g],
  ["JWT", /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g],
];

export function redact(text: string): { text: string; redactions: Record<string, number> } {
  const redactions: Record<string, number> = {};
  let out = text;
  for (const [label, re] of PATTERNS) {
    out = out.replace(re, () => {
      redactions[label] = (redactions[label] ?? 0) + 1;
      return `[REDACTED_${label}]`;
    });
  }
  return { text: out, redactions };
}
