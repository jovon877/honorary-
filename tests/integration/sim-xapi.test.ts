import { describe, expect, it } from "vitest";
import { buildSimStatement, InMemoryLrsClient } from "../../packages/sim-xapi/src/index.js";

describe("simulation event integration", () => {
  it("crosses the swappable LRS boundary without network access", async () => {
    const client = new InMemoryLrsClient();
    await client.send(
      buildSimStatement(
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
      ),
    );
    expect(client.statements).toHaveLength(1);
  });
});
