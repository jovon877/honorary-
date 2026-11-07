import { access, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { lintClaims } from "@honorary-homes/security";
import { walkFiles } from "./walk.js";

const targets = [
  { root: "apps", extensions: new Set([".css", ".html", ".json", ".md", ".ts", ".tsx"]) },
  {
    root: "packages/sim-content",
    extensions: new Set([".json", ".md", ".ts", ".yaml", ".yml"]),
  },
  {
    root: "content",
    extensions: new Set([".html", ".json", ".md", ".ts", ".tsx", ".txt", ".yaml", ".yml"]),
  },
  {
    root: "certificates",
    extensions: new Set([".html", ".json", ".md", ".txt", ".yaml", ".yml"]),
  },
  {
    root: "generated-drafts",
    extensions: new Set([".html", ".json", ".md", ".txt", ".yaml", ".yml"]),
  },
] as const;
const findings: string[] = [];
for (const target of targets) {
  const rootPath = resolve(target.root);
  try {
    await access(rootPath);
  } catch {
    continue;
  }
  for (const file of await walkFiles(rootPath)) {
    const path = relative(resolve("."), file);
    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(path)) continue;
    const extension = path.slice(path.lastIndexOf("."));
    if (!target.extensions.has(extension)) continue;
    const text = await readFile(file, "utf8");
    for (const finding of lintClaims(text)) {
      findings.push(
        `${path}:${finding.index}: ${finding.ruleId}: banned claim “${finding.match}” — ${finding.message}`,
      );
    }
  }
}
if (findings.length > 0) throw new Error(findings.join("\n"));
console.log("claims:lint passed.");
