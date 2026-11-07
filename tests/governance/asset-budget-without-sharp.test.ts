import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { checkAssetBudget } from "../../packages/sim-assets/src/index.js";

describe("M0 asset budgets without image tooling", () => {
  it("keeps sharp out of the resolved tree and validates the empty manifest", async () => {
    const lockfile = await readFile("pnpm-lock.yaml", "utf8");
    expect(lockfile).not.toMatch(/(?:^|\s)sharp@/m);
    expect(
      checkAssetBudget({
        id: "FIXTURE-empty-shell",
        initialDownloadMb: 0,
        desktop: { drawCalls: 0, triangles: 0, textureMemoryMb: 0 },
        mobile: { drawCalls: 0, triangles: 0, textureMemoryMb: 0 },
      }),
    ).toEqual([]);
  });
});
