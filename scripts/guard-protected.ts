import { execFileSync } from "node:child_process";

const protectedPrefixes = [
  "AGENTS.md",
  "docs/product-specs/",
  "docs/curriculum-standards/",
  "docs/media-standards/",
  "docs/security/",
  "docs/sim-standards/",
  "packages/design-tokens/",
  "packages/sim-content/src/approvals.ts",
  "scripts/claims-lint.ts",
  "scripts/guard-protected.ts",
];

const committed = execFileSync("git", ["diff", "--name-only", "main...HEAD"], { encoding: "utf8" });
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
const commitSubjects = execFileSync("git", ["log", "main..HEAD", "--format=%s"], {
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
