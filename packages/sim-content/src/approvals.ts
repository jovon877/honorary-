import { z } from "zod";
import type { SimulationScenario } from "./scenario.js";

export const approvalSchema = z.object({
  role: z.string().min(1),
  reviewerId: z.string().min(1),
  status: z.literal("approved"),
  artifactVersion: z.number().int().positive(),
});

export type Approval = z.infer<typeof approvalSchema>;
export type ScenarioApprovalRole =
  | "trade_safety"
  | "subject_matter"
  | "accessibility"
  | "instructional_design"
  | "compliance"
  | "publisher";
export type CourseApprovalRole =
  "curriculum" | "subject_matter" | "accessibility" | "media" | "publisher";

function hasEveryApproval(
  roles: readonly string[],
  approvals: readonly Approval[],
  artifactVersion: number,
): boolean {
  return roles.every((role) =>
    approvals.some(
      (approval) =>
        approval.role === role &&
        approval.status === "approved" &&
        approval.artifactVersion === artifactVersion,
    ),
  );
}

export function canPublishScenario(
  scenario: SimulationScenario,
  approvals: readonly Approval[],
): boolean {
  const roles: ScenarioApprovalRole[] = [
    ...new Set([...scenario.reviewRequirements, "publisher"]),
  ] as ScenarioApprovalRole[];
  return (
    scenario.status === "approved" &&
    scenario.accessibility.keyboardPath &&
    scenario.accessibility.non3dSteps.length > 0 &&
    hasEveryApproval(roles, approvals, scenario.version)
  );
}

export function canPublishCourse(version: number, approvals: readonly Approval[]): boolean {
  const required: CourseApprovalRole[] = [
    "curriculum",
    "subject_matter",
    "accessibility",
    "media",
    "publisher",
  ];
  return hasEveryApproval(required, approvals, version);
}
