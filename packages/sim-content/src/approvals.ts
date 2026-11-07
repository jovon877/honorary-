import { z } from "zod";
import {
  canPublishScenario,
  type Approval as ScenarioApproval,
  type ReviewType as ScenarioApprovalRole,
  type ScenarioVersionRef,
} from "@honorary-homes/publishing";

export const approvalSchema = z.object({
  role: z.string().min(1),
  reviewerId: z.string().min(1),
  status: z.literal("approved"),
  artifactVersion: z.number().int().positive(),
});

export type Approval = z.infer<typeof approvalSchema>;
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

export {
  canPublishScenario,
  type ScenarioApproval,
  type ScenarioApprovalRole,
  type ScenarioVersionRef,
};
