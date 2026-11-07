import { setup } from "xstate";

export type SimulationStage = "idle" | "learn" | "practice" | "prove" | "complete";

export function createSimulationMachine() {
  return setup({
    types: {
      events: {} as { type: "START" } | { type: "ADVANCE" } | { type: "PASS" } | { type: "RESET" },
    },
  }).createMachine({
    id: "simulation",
    initial: "idle",
    states: {
      idle: { on: { START: "learn" } },
      learn: { on: { ADVANCE: "practice", RESET: "idle" } },
      practice: { on: { ADVANCE: "prove", RESET: "idle" } },
      prove: { on: { PASS: "complete", RESET: "idle" } },
      complete: { type: "final" },
    },
  });
}
