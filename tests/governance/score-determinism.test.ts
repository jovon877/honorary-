import { describe, expect, it } from "vitest";
import { scoreAttempt, type AttemptRecord } from "../../packages/sim-core/src/index.js";

describe("recorded attempt replay", () => {
  it("is stable across repeated and reordered replays", () => {
    const record: AttemptRecord = {
      attemptId: "FIXTURE-attempt",
      scenarioId: "FIXTURE-scenario",
      seed: 2026,
      criteria: [
        { criterionId: "b", passed: true, safetyGate: false, weight: 30 },
        { criterionId: "a", passed: true, safetyGate: true, weight: 70 },
      ],
    };
    const reordered = { ...record, criteria: [...record.criteria].reverse() };
    expect(scoreAttempt(record)).toEqual(scoreAttempt(reordered));
  });
});
