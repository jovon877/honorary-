import { describe, expect, it } from "vitest";
import {
  canPublishCourse,
  canPublishScenario,
  type Approval,
  type ScenarioApproval,
  type ScenarioVersionRef,
} from "./approvals.js";

const fixtureScenario: ScenarioVersionRef = {
  scenarioId: "FIXTURE-scenario",
  version: 1,
  status: "approved",
  authorId: "FIXTURE-author",
  contentHash: "a".repeat(64),
  reviewRequirements: ["accessibility", "instructional_design"],
  hasNonVisualPath: true,
  claimsLintPassed: true,
};

const approval = (role: string): Approval => ({
  role,
  reviewerId: `FIXTURE-${role}`,
  status: "approved",
  artifactVersion: 1,
});

const scenarioApproval = (reviewType: ScenarioApproval["reviewType"]): ScenarioApproval => ({
  scenarioId: fixtureScenario.scenarioId,
  version: fixtureScenario.version,
  contentHash: fixtureScenario.contentHash,
  reviewType,
  approverId: `FIXTURE-${reviewType}`,
  approverKind: "human",
  decision: "approved",
  decidedAt: "2026-11-06T00:00:00Z",
});

describe("publication gates", () => {
  it("rejects a scenario when any required approval is absent", () => {
    expect(
      canPublishScenario(fixtureScenario, [
        scenarioApproval("accessibility"),
        scenarioApproval("final_publisher"),
      ]).ok,
    ).toBe(false);
  });

  it("requires every course approval with no bypass", () => {
    const roles = ["curriculum", "subject_matter", "accessibility", "media", "publisher"];
    expect(canPublishCourse(1, roles.map(approval))).toBe(true);
    expect(canPublishCourse(1, roles.slice(0, -1).map(approval))).toBe(false);
  });
});
