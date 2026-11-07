import { describe, expect, it } from "vitest";
import { scoreAttempt, type AttemptRecord } from "./scoring.js";

const attempt: AttemptRecord = {
  attemptId: "FIXTURE-attempt",
  scenarioId: "FIXTURE-scenario",
  seed: 42,
  criteria: [
    { criterionId: "process", passed: true, safetyGate: false, weight: 20 },
    { criterionId: "safety", passed: true, safetyGate: true, weight: 80 },
  ],
};

describe("scoreAttempt", () => {
  it("returns the same score for the same recorded attempt", () => {
    expect(scoreAttempt(attempt)).toEqual(scoreAttempt(structuredClone(attempt)));
  });

  it("cannot pass when a safety gate fails", () => {
    const unsafe = { ...attempt, criteria: [{ ...attempt.criteria[1]!, passed: false }] };
    expect(scoreAttempt(unsafe).passed).toBe(false);
  });
});
