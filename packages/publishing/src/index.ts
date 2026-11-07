/**
 * Publication gate for simulation scenarios (spec §9, §10).
 * There is deliberately NO override parameter. A bypass would be a code change,
 * which is protected by CODEOWNERS and the guard:approvals CI check.
 */

export type ReviewType =
  | "trade_safety"
  | "subject_matter"
  | "accessibility"
  | "instructional_design"
  | "compliance"
  | "final_publisher";

export interface ScenarioVersionRef {
  scenarioId: string;
  version: number;
  status: "draft" | "in_review" | "approved" | "published" | "retired";
  authorId: string;
  /** Content hash of the exact version under review. */
  contentHash: string;
  reviewRequirements: readonly ReviewType[];
  hasNonVisualPath: boolean;
  claimsLintPassed: boolean;
}

export interface Approval {
  scenarioId: string;
  version: number;
  contentHash: string;
  reviewType: ReviewType;
  approverId: string;
  approverKind: "human" | "service";
  decision: "approved" | "rejected";
  decidedAt: string;
}

export interface GateResult {
  ok: boolean;
  problems: string[];
}

export function canPublishScenario(
  s: ScenarioVersionRef,
  approvals: readonly Approval[],
): GateResult {
  const problems: string[] = [];

  if (s.status !== "approved") problems.push(`status must be "approved", is "${s.status}"`);
  if (!s.hasNonVisualPath) problems.push("missing non-3D accessible path");
  if (!s.claimsLintPassed) problems.push("claims linter has not passed");

  // Only approvals for THIS exact version and content count.
  const relevant = approvals.filter(
    (a) =>
      a.scenarioId === s.scenarioId && a.version === s.version && a.contentHash === s.contentHash,
  );

  const required: ReviewType[] = [
    ...new Set<ReviewType>([...s.reviewRequirements, "accessibility", "final_publisher"]),
  ];

  for (const type of required) {
    const forType = relevant.filter((a) => a.reviewType === type);
    if (forType.some((a) => a.decision === "rejected")) {
      problems.push(`${type}: has an open rejection`);
      continue;
    }
    const valid = forType.filter(
      (a) => a.decision === "approved" && a.approverKind === "human" && a.approverId !== s.authorId,
    );
    if (valid.length === 0)
      problems.push(`${type}: missing human approval from someone other than the author`);
  }

  // One person cannot satisfy every gate alone: require >= 2 distinct human approvers.
  const distinctApprovers = new Set(
    relevant
      .filter((a) => a.decision === "approved" && a.approverKind === "human")
      .map((a) => a.approverId),
  );
  if (distinctApprovers.size < 2) problems.push("requires at least two distinct human approvers");

  return { ok: problems.length === 0, problems };
}
