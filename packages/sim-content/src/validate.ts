import type { SimulationScenario } from "./scenario.js";

export function validateObjectiveMapping(
  scenario: Pick<SimulationScenario, "objectiveIds">,
  courseObjectiveIds: ReadonlySet<string>,
): string[] {
  return scenario.objectiveIds
    .filter((objectiveId) => !courseObjectiveIds.has(objectiveId))
    .map((objectiveId) => `Unknown course objective: ${objectiveId}`);
}
