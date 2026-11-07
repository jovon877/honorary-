import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const ignored = new Set([
  ".git",
  ".cache",
  "node_modules",
  "dist",
  "coverage",
  "playwright-report",
  "test-results",
]);

export async function walkFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  async function visit(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files.push(path);
    }
  }
  await visit(root);
  return files.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
}
