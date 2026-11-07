import { access, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { walkFiles } from "./walk.js";

const textExtensions = new Set([".css", ".html", ".json", ".md", ".ts", ".tsx", ".yaml", ".yml"]);
const forbidden = [
  /\bcertified\b/gi,
  /\blicensed\b/gi,
  /\bOSHA\s*10(?:\s+card)?\b/gi,
  /\bguaranteed job\b/gi,
  /\bRegistered Apprenticeship\b/gi,
  /\b(?:gore|graphic injury|you would have died)\b/gi,
];
const findings: string[] = [];
const roots = ["apps", "packages", "workers", "content", "certificates", "generated-drafts"];
for (const root of roots) {
  const rootPath = resolve(root);
  try {
    await access(rootPath);
  } catch {
    continue;
  }
  for (const file of await walkFiles(rootPath)) {
    const path = relative(resolve("."), file);
    const extension = path.slice(path.lastIndexOf("."));
    if (!textExtensions.has(extension)) continue;
    const text = await readFile(file, "utf8");
    for (const pattern of forbidden) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) findings.push(`${path}: banned claim “${match[0]}”`);
    }
  }
}
if (findings.length > 0) throw new Error(findings.join("\n"));
console.log("claims:lint passed.");
