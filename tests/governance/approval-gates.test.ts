import { describe, expect, it } from "vitest";
import { canPublishCourse } from "../../packages/sim-content/src/index.js";

describe("approval gate bypass resistance", () => {
  it("rejects wrong artifact versions even when every role is present", () => {
    const approvals = ["curriculum", "subject_matter", "accessibility", "media", "publisher"].map(
      (role) => ({
        role,
        reviewerId: `FIXTURE-${role}`,
        status: "approved" as const,
        artifactVersion: 1,
      }),
    );
    expect(canPublishCourse(2, approvals)).toBe(false);
  });
});
