import { describe, expect, it } from "vitest";
import { buildSimStatement, InMemoryLrsClient } from "./index.js";

describe("xAPI boundary", () => {
  it("stores a statement without a network endpoint", async () => {
    const client = new InMemoryLrsClient();
    const statement = buildSimStatement(
      { learnerId: "FIXTURE-learner", displayName: "FIXTURE — not real", fixture: true },
      {
        eventId: "FIXTURE-event",
        verbId: "http://adlnet.gov/expapi/verbs/initialized",
        verbLabel: "initialized",
        scenarioId: "FIXTURE-scenario",
        scenarioLabel: "FIXTURE — not real",
        courseVersionId: "FIXTURE-course-version",
        lessonId: "FIXTURE-lesson",
        occurredAt: "2026-01-01T00:00:00.000Z",
      },
    );
    await client.send(statement);
    expect(client.statements).toEqual([statement]);
  });
});
