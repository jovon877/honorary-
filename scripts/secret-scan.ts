import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { walkFiles } from "./walk.js";

const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[ps]_[A-Za-z0-9]{30,}\b/,
];
const findings: string[] = [];
for (const file of await walkFiles(resolve("."))) {
  const path = relative(resolve("."), file);
  if (/\.(?:docx|pdf|png|jpe?g|woff2?)$/i.test(path)) continue;
  const text = await readFile(file, "utf8");
  if (patterns.some((pattern) => pattern.test(text))) findings.push(path);
}
if (findings.length > 0) throw new Error(`Potential secrets found:\n${findings.join("\n")}`);
console.log("secrets:scan passed.");
