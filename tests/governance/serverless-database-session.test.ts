import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { walkFiles } from "../../scripts/walk.js";

const SOURCE_ROOTS = ["apps", "packages", "workers", "db"] as const;
const TEXT_FILE = /\.(?:ts|tsx|js|mjs|cjs|sql)$/i;

describe("serverless database session guard", () => {
  it("forbids session-level app identity; SET LOCAL or set_config(..., true) is required", async () => {
    const root = resolve(".");
    const violations: string[] = [];

    for (const sourceRoot of SOURCE_ROOTS) {
      for (const file of await walkFiles(resolve(sourceRoot))) {
        if (!TEXT_FILE.test(file)) continue;
        const contents = await readFile(file, "utf8");
        const lines = contents.split("\n");
        lines.forEach((line, index) => {
          if (/\bSET\s+(?!LOCAL\b)app\./i.test(line)) {
            violations.push(`${relative(root, file)}:${index + 1}: session-level SET app.*`);
          }
          if (/set_config\(\s*['"]app\.[^'"]+['"]\s*,[^;\n]*,\s*false\s*\)/i.test(line)) {
            violations.push(`${relative(root, file)}:${index + 1}: set_config app.* is not local`);
          }
        });
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
