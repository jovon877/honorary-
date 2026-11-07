import { z } from "zod";

const stageSchema = z.object({
  id: z.string().min(1),
  instruction: z.string().min(1),
});

const rubricCriterionSchema = z.object({
  id: z.string().min(1),
  weight: z.number().positive(),
  safetyGate: z.boolean(),
});

export const scenarioSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  title: z.string().min(1),
  simType: z.enum([
    "exploration",
    "hazard_recognition",
    "procedural_build",
    "diagnostic",
    "inspection",
    "branching_dialogue",
    "planning",
  ]),
  environmentId: z.string().min(1),
  environmentCondition: z.enum(["as_found", "mid_work", "complete"]),
  regionConfigId: z.string().min(1).optional(),
  objectiveIds: z.array(z.string().min(1)).min(1),
  stages: z.object({ learn: stageSchema, practice: stageSchema, prove: stageSchema }),
  randomization: z.object({
    seedPolicy: z.enum(["per_attempt", "fixed"]),
    pools: z.array(z.string()),
  }),
  tolerances: z.record(
    z.string(),
    z.object({ unit: z.enum(["in", "deg", "mm"]), max: z.number().nonnegative() }),
  ),
  safetyGates: z.array(z.string()),
  rubric: z.array(rubricCriterionSchema),
  remediation: z.array(z.object({ criterionId: z.string(), lessonId: z.string() })),
  estimatedMinutes: z.number().int().positive(),
  accessibility: z.object({
    keyboardPath: z.literal(true),
    screenReaderSummary: z.string().min(1),
    reducedMotionVariant: z.boolean(),
    non3dSteps: z.array(z.string().min(1)).min(1),
  }),
  reviewRequirements: z.array(
    z.enum([
      "trade_safety",
      "subject_matter",
      "accessibility",
      "instructional_design",
      "compliance",
    ]),
  ),
  sourcePackageId: z.string().min(1),
  status: z.enum(["draft", "in_review", "approved", "published", "retired"]),
});

export type SimulationScenario = z.infer<typeof scenarioSchema>;
