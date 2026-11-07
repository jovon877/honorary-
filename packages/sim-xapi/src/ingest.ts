/**
 * xAPI statement ingestion for simulation attempts.
 *
 * Threats handled:
 *  - actor spoofing (a learner posting statements as someone else)
 *  - oversized / deeply nested payloads (DoS)
 *  - unknown verbs and extension keys (schema drift, data smuggling)
 *  - free-text PII leaking into the analytics/LRS store
 *  - replay / duplicate submission (idempotency by statement id)
 *  - clock manipulation (timestamp skew window)
 */
import { z } from "zod";

export const MAX_BODY_BYTES = 16 * 1024;
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
export const MAX_STATEMENT_AGE_MS = 7 * 24 * 60 * 60 * 1000; // offline queue may hold up to 7 days

export const SIM_VERB_IRIS = {
  experienced: "http://adlnet.gov/expapi/verbs/experienced",
  attempted: "http://adlnet.gov/expapi/verbs/attempted",
  completed: "http://adlnet.gov/expapi/verbs/completed",
  passed: "http://adlnet.gov/expapi/verbs/passed",
  failed: "http://adlnet.gov/expapi/verbs/failed",
  selected: "https://honoraryhomes.org/xapi/verbs/selected",
  measured: "https://honoraryhomes.org/xapi/verbs/measured",
  placed: "https://honoraryhomes.org/xapi/verbs/placed",
  failedSafetyCheck: "https://honoraryhomes.org/xapi/verbs/failed-safety-check",
} as const;

const VERB_SET = new Set<string>(Object.values(SIM_VERB_IRIS));
const EXT = "https://honoraryhomes.org/xapi/ext/";

const idSafe = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9._:-]+$/);

const StatementSchema = z
  .object({
    id: z.uuid(),
    actor: z
      .object({ account: z.object({ homePage: z.string().max(200), name: idSafe }).strict() })
      .strict(),
    verb: z.object({ id: z.string().refine((v) => VERB_SET.has(v), "verb not allowed") }).strict(),
    object: z.object({ id: z.string().url().max(300) }).strict(),
    result: z
      .object({
        success: z.boolean().optional(),
        completion: z.boolean().optional(),
        score: z
          .object({ scaled: z.number().min(0).max(1) })
          .strict()
          .optional(),
        duration: z
          .string()
          .regex(/^PT(\d+H)?(\d+M)?(\d+(\.\d+)?S)?$/)
          .max(32)
          .optional(),
      })
      .strict()
      .optional(),
    context: z
      .object({
        registration: z.uuid(),
        extensions: z
          .object({
            [`${EXT}courseVersionId`]: idSafe,
            [`${EXT}lessonId`]: idSafe,
            [`${EXT}scenarioId`]: idSafe,
            [`${EXT}scenarioVersion`]: z.number().int().positive(),
            [`${EXT}attemptSeed`]: z.number().int().nonnegative(),
            [`${EXT}stage`]: z.enum(["learn", "practice", "prove"]),
            [`${EXT}criterionId`]: idSafe.optional(),
            [`${EXT}measuredValue`]: z.number().finite().optional(),
          })
          .strict(),
      })
      .strict(),
    timestamp: z.iso.datetime({ offset: true }),
  })
  .strict(); // unknown keys anywhere = rejected, never silently dropped

export type SimStatement = z.infer<typeof StatementSchema>;

export interface IngestContext {
  /** Authenticated learner id from the server session — never from the payload. */
  authenticatedLearnerId: string;
  nowMs: number;
  /** Returns true if this statement id was already stored (idempotency). */
  alreadyStored: (statementId: string) => boolean;
}

export type IngestResult =
  | { status: "accepted"; statement: SimStatement }
  | { status: "duplicate"; statementId: string }
  | { status: "rejected"; httpStatus: 400 | 403 | 413; errors: string[] };

export function ingestStatement(rawBody: string, ctx: IngestContext): IngestResult {
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return { status: "rejected", httpStatus: 413, errors: ["payload too large"] };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return { status: "rejected", httpStatus: 400, errors: ["invalid JSON"] };
  }

  const parsed = StatementSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      status: "rejected",
      httpStatus: 400,
      errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    };
  }
  const st = parsed.data;

  if (st.actor.account.name !== ctx.authenticatedLearnerId) {
    return {
      status: "rejected",
      httpStatus: 403,
      errors: ["actor does not match authenticated learner"],
    };
  }

  const ts = Date.parse(st.timestamp);
  if (ts > ctx.nowMs + MAX_CLOCK_SKEW_MS) {
    return { status: "rejected", httpStatus: 400, errors: ["timestamp is in the future"] };
  }
  if (ts < ctx.nowMs - MAX_STATEMENT_AGE_MS) {
    return { status: "rejected", httpStatus: 400, errors: ["timestamp older than offline window"] };
  }

  if (ctx.alreadyStored(st.id)) return { status: "duplicate", statementId: st.id };

  return { status: "accepted", statement: st };
}
