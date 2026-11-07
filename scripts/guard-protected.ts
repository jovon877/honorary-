import { execFileSync } from "node:child_process";

const protectedPrefixes = [
  "AGENTS.md",
  "docs/product-specs/",
  "docs/curriculum-standards/",
  "docs/media-standards/",
  "docs/security/",
  "docs/sim-standards/",
  "packages/design-tokens/",
  "packages/authorization/",
  "packages/credentials/",
  "packages/publishing/",
  "packages/security/src/claims-lint.ts",
  "packages/sim-content/src/approvals.ts",
  "db/migrations/",
  "scripts/claims-lint.ts",
  "scripts/guard-protected.ts",
  "docs/security/license-exceptions.md",
];

function refExists(ref: string): boolean {
  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", ref], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const baseCandidates = [
  process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : undefined,
  "main",
  "origin/main",
].filter((ref): ref is string => Boolean(ref));
const baseRef = baseCandidates.find(refExists);
if (!baseRef) throw new Error("guard:protected could not resolve the base branch");

const committed = execFileSync("git", ["diff", "--name-only", `${baseRef}...HEAD`], {
  encoding: "utf8",
});
const working = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" });
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  encoding: "utf8",
});
const changed = [...new Set(`${committed}\n${working}\n${untracked}`.split("\n").filter(Boolean))];
const protectedChanges = changed.filter((path) =>
  protectedPrefixes.some((prefix) => path === prefix || path.startsWith(prefix)),
);
if (protectedChanges.length === 0) {
  console.log("guard:protected passed — no protected files changed.");
  process.exit(0);
}

const labels = (process.env.PR_LABELS ?? "").split(",").map((label) => label.trim());
const commitSubjects = execFileSync("git", ["log", `${baseRef}..HEAD`, "--format=%s"], {
  encoding: "utf8",
});
const approved =
  labels.includes("spec-change-approved") || /^spec-change-approved:/m.test(commitSubjects);
if (!approved) {
  throw new Error(
    `Protected files changed without spec-change-approved:\n${protectedChanges.join("\n")}`,
  );
}
console.log(
  `guard:protected passed — ${protectedChanges.length} protected file(s), approval recorded.`,
);
