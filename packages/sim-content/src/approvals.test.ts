import { describe, expect, it } from "vitest";
import { canPublishCourse, canPublishScenario, type Approval } from "./approvals.js";
import { scenarioSchema } from "./scenario.js";

const fixtureScenario = scenarioSchema.parse({
  id: "FIXTURE-scenario",
  version: 1,
  courseId: "FIXTURE-course",
  lessonId: "FIXTURE-lesson",
  title: "FIXTURE — not real",
  simType: "exploration",
  environmentId: "FIXTURE-environment",
  environmentCondition: "as_found",
  objectiveIds: ["FIXTURE-objective"],
  stages: {
    learn: { id: "learn", instruction: "FIXTURE — not real" },
    practice: { id: "practice", instruction: "FIXTURE — not real" },
    prove: { id: "prove", instruction: "FIXTURE — not real" },
  },
  randomization: { seedPolicy: "fixed", pools: [] },
  tolerances: {},
  safetyGates: [],
  rubric: [],
  remediation: [],
  estimatedMinutes: 1,
  accessibility: {
    keyboardPath: true,
    screenReaderSummary: "FIXTURE — not real",
    reducedMotionVariant: true,
    non3dSteps: ["FIXTURE — not real"],
  },
  reviewRequirements: ["accessibility", "instructional_design"],
  sourcePackageId: "FIXTURE-source",
  status: "approved",
});

const approval = (role: string): Approval => ({
  role,
  reviewerId: `FIXTURE-${role}`,
  status: "approved",
  artifactVersion: 1,
});

describe("publication gates", () => {
  it("rejects a scenario when any required approval is absent", () => {
    expect(
      canPublishScenario(fixtureScenario, [approval("accessibility"), approval("publisher")]),
    ).toBe(false);
  });

  it("requires every course approval with no bypass", () => {
    const roles = ["curriculum", "subject_matter", "accessibility", "media", "publisher"];
    expect(canPublishCourse(1, roles.map(approval))).toBe(true);
    expect(canPublishCourse(1, roles.slice(0, -1).map(approval))).toBe(false);
  });
});
