/**
 * Deterministic claims linter (spec §9, §10.2). Runs on scenario data, UI copy,
 * certificates and every AI draft. Rule list is a protected file in the real repo.
 */

export interface ClaimRule {
  id: string;
  pattern: RegExp;
  message: string;
}

export const CLAIM_RULES: readonly ClaimRule[] = [
  {
    id: "certified",
    pattern: /\b(certif(y|ied|ication)|accredited)\b/i,
    message: "Sims prepare; they never certify. Use 'prepares you for'.",
  },
  {
    id: "licensed",
    pattern: /\b(licen[cs]ed|licen[cs]ure)\b/i,
    message: "Digital practice does not grant a license.",
  },
  {
    id: "osha-card",
    pattern: /\bosha[\s-]?(10|30)\b(?!\s*(prep|preparation|training|course|outreach))/i,
    message: "Do not imply an OSHA card. Say 'prepares for OSHA 10 training'.",
  },
  {
    id: "rrp",
    pattern: /\b(epa\s*)?rrp\b(?!\s*(prep|preparation|training))/i,
    message: "Do not imply EPA RRP certification.",
  },
  {
    id: "job-guarantee",
    pattern:
      /\b(guarantee[ds]?|guaranteed)\b.{0,30}\b(job|employment|hire|placement|housing|home)\b/i,
    message: "No job, housing or placement guarantees.",
  },
  {
    id: "registered-apprenticeship",
    pattern: /\bregistered apprenticeship\b/i,
    message: "Only with a verified sponsor record; requires compliance review.",
  },
  {
    id: "injury-imagery",
    pattern: /\b(blood|gore|severed|amputat\w*|electrocut\w*|you (would have )?died)\b/i,
    message: "No injury or death language; use calm 'what would have happened' framing.",
  },
  {
    id: "shaming",
    pattern: /\b(wrong!|you failed|stupid|idiot|lazy)\b/i,
    message: "Feedback says what happened and what to try next.",
  },
] as const;

export interface LintFinding {
  ruleId: string;
  message: string;
  match: string;
  index: number;
}

export function lintClaims(text: string, rules: readonly ClaimRule[] = CLAIM_RULES): LintFinding[] {
  const findings: LintFinding[] = [];
  for (const rule of rules) {
    const re = new RegExp(
      rule.pattern.source,
      rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g",
    );
    for (const m of text.matchAll(re)) {
      findings.push({ ruleId: rule.id, message: rule.message, match: m[0], index: m.index ?? 0 });
    }
  }
  return findings.sort((a, b) => a.index - b.index);
}
