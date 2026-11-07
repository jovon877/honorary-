import { describe, expect, it } from "vitest";
import { checkAssetBudget } from "./index.js";

describe("asset budgets", () => {
  it("accepts an empty M0 greybox manifest", () => {
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
