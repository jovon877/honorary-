import { describe, expect, it } from "vitest";
import { authorize, type Principal } from "./index.js";

const scenario = {
  type: "scenario",
  scenarioId: "FIXTURE-SIM",
  authorId: "FIXTURE-author",
} as const;

function publisher(mfaVerifiedAt: number | null): Principal {
  return {
    id: "FIXTURE-publisher",
    kind: "human",
    roles: ["final_publisher"],
    orgId: null,
    instructsCohortIds: [],
    mfaVerifiedAt,
  };
}

describe("step-up authentication", () => {
  it("rejects missing, stale and future MFA timestamps", () => {
    const now = 2_000;
    expect(authorize(publisher(null), "scenario.publish", scenario, now).allow).toBe(false);
    expect(authorize(publisher(1_099), "scenario.publish", scenario, now).allow).toBe(false);
    expect(authorize(publisher(2_001), "scenario.publish", scenario, now).allow).toBe(false);
  });

  it("accepts an MFA challenge no more than 15 minutes old", () => {
    const now = 2_000;
    expect(authorize(publisher(1_100), "scenario.publish", scenario, now).allow).toBe(true);
    expect(authorize(publisher(2_000), "scenario.publish", scenario, now).allow).toBe(true);
  });
});
