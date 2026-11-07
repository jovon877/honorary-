/**
 * Honorary Homes Academy — authorization policy (reference implementation).
 *
 * Rules:
 *  - Deny by default. Every allow has a named reason.
 *  - Explicit denies always win over allows (e.g. housing/property staff can
 *    never read training records, even if they also hold an instructor role).
 *  - Authorization is decided server-side from the authenticated principal,
 *    never from anything the client sends.
 *  - High-risk actions require step-up authentication (recent MFA).
 *  - Machine principals (AI services) can only create drafts.
 */

export type Role =
  | "learner"
  | "instructor"
  | "curriculum_owner"
  | "instructional_designer"
  | "subject_matter_expert"
  | "trade_safety_reviewer"
  | "compliance_reviewer"
  | "accessibility_reviewer"
  | "media_producer"
  | "final_publisher"
  | "org_admin"
  | "platform_admin"
  | "property_staff"
  | "housing_staff";

export type PrincipalKind = "human" | "service";

export interface Principal {
  id: string;
  kind: PrincipalKind;
  roles: readonly Role[];
  orgId: string | null;
  /** Cohorts this principal teaches (instructors). */
  instructsCohortIds: readonly string[];
  /** Seconds since epoch of the last successful MFA challenge. */
  mfaVerifiedAt: number | null;
}

export type Action =
  | "attempt.read"
  | "attempt.create"
  | "response.read" // private learner free-text answers / action plans
  | "aggregate.read"
  | "scenario.draft.create"
  | "scenario.draft.update"
  | "scenario.review.approve"
  | "scenario.publish"
  | "scenario.retire"
  | "signoff.ready_for_crew"
  | "audit.read"
  | "generation.pause";

export interface TrainingRecordResource {
  type: "training_record";
  learnerId: string;
  orgId: string | null;
  cohortId: string | null;
  /** Org contract + learner notice explicitly allow org admins to see individual responses. */
  orgIndividualAccessAuthorized: boolean;
}

export interface ScenarioResource {
  type: "scenario";
  scenarioId: string;
  authorId: string;
}

export interface OrgResource {
  type: "org";
  orgId: string;
}

export interface SystemResource {
  type: "system";
}

export type Resource = TrainingRecordResource | ScenarioResource | OrgResource | SystemResource;

export interface Decision {
  allow: boolean;
  reason: string;
}

export const STEP_UP_MAX_AGE_SECONDS = 15 * 60;

const STEP_UP_ACTIONS: ReadonlySet<Action> = new Set([
  "scenario.publish",
  "scenario.retire",
  "scenario.review.approve",
  "signoff.ready_for_crew",
  "generation.pause",
  "audit.read",
]);

const REVIEWER_ROLES: ReadonlySet<Role> = new Set([
  "curriculum_owner",
  "instructional_designer",
  "subject_matter_expert",
  "trade_safety_reviewer",
  "compliance_reviewer",
  "accessibility_reviewer",
  "media_producer",
  "final_publisher",
]);

const allow = (reason: string): Decision => ({ allow: true, reason });
const deny = (reason: string): Decision => ({ allow: false, reason });
const has = (p: Principal, r: Role) => p.roles.includes(r);

export function authorize(
  principal: Principal,
  action: Action,
  resource: Resource,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Decision {
  // ---- Explicit denies (evaluated first, always win) ----------------------
  if (
    resource.type === "training_record" &&
    (has(principal, "property_staff") || has(principal, "housing_staff"))
  ) {
    return deny("separation: property and housing staff never access training records");
  }

  if (principal.kind === "service") {
    if (action === "scenario.draft.create" || action === "scenario.draft.update") {
      return allow("service principals may create and update drafts only");
    }
    return deny("service principals cannot read learner data, approve, publish or sign off");
  }

  if (STEP_UP_ACTIONS.has(action)) {
    const ageSeconds =
      principal.mfaVerifiedAt === null ? null : nowSeconds - principal.mfaVerifiedAt;
    const fresh = ageSeconds !== null && ageSeconds >= 0 && ageSeconds <= STEP_UP_MAX_AGE_SECONDS;
    if (!fresh) return deny("step-up: recent MFA required for this action");
  }

  // ---- Allows -------------------------------------------------------------
  switch (action) {
    case "attempt.create":
      if (
        resource.type === "training_record" &&
        resource.learnerId === principal.id &&
        has(principal, "learner")
      ) {
        return allow("learners record their own attempts");
      }
      return deny("attempts can only be created by the learner themself");

    case "attempt.read":
    case "response.read": {
      if (resource.type !== "training_record") return deny("wrong resource type");
      if (resource.learnerId === principal.id) return allow("learners read their own records");
      if (
        has(principal, "instructor") &&
        resource.cohortId !== null &&
        principal.instructsCohortIds.includes(resource.cohortId)
      ) {
        return allow("instructors read records of learners in cohorts they teach");
      }
      if (
        has(principal, "org_admin") &&
        principal.orgId !== null &&
        principal.orgId === resource.orgId &&
        resource.orgIndividualAccessAuthorized
      ) {
        return allow("org admin access authorized by contract and learner notice");
      }
      // platform_admin intentionally has NO read access to private learner data.
      return deny("no relationship to this learner record");
    }

    case "aggregate.read":
      if (
        resource.type === "org" &&
        has(principal, "org_admin") &&
        principal.orgId === resource.orgId
      ) {
        return allow("org admins read aggregate reporting for their own org");
      }
      if (resource.type === "org" && has(principal, "curriculum_owner")) {
        return allow("curriculum owners read aggregate reporting");
      }
      return deny("no aggregate access");

    case "scenario.draft.create":
    case "scenario.draft.update":
      if ([...REVIEWER_ROLES].some((r) => has(principal, r)))
        return allow("curriculum staff edit drafts");
      return deny("only curriculum staff edit drafts");

    case "scenario.review.approve":
      if (resource.type !== "scenario") return deny("wrong resource type");
      if (resource.authorId === principal.id)
        return deny("separation of duties: authors cannot approve their own work");
      if ([...REVIEWER_ROLES].some((r) => has(principal, r)))
        return allow("reviewer role may record an approval");
      return deny("not a reviewer");

    case "scenario.publish":
    case "scenario.retire":
      if (resource.type === "scenario" && resource.authorId === principal.id) {
        return deny("separation of duties: authors cannot publish their own work");
      }
      if (has(principal, "final_publisher")) return allow("final publisher");
      return deny("only the final publisher publishes or retires");

    case "signoff.ready_for_crew":
      if (
        resource.type === "training_record" &&
        has(principal, "instructor") &&
        resource.cohortId !== null &&
        principal.instructsCohortIds.includes(resource.cohortId) &&
        resource.learnerId !== principal.id
      ) {
        return allow("instructor signs off a learner in their cohort");
      }
      return deny("only the learner's instructor can sign off");

    case "audit.read":
      if (has(principal, "platform_admin") || has(principal, "compliance_reviewer")) {
        return allow("audit access for platform admin / compliance");
      }
      return deny("no audit access");

    case "generation.pause":
      if (has(principal, "platform_admin") || has(principal, "curriculum_owner"))
        return allow("kill switch");
      return deny("no kill-switch access");
  }
}
