import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { endorsement } from "@honorary-homes/config";
import { SimPlayer } from "./SimPlayer.js";
import { fixtureLearner, fixtureLrsClient, SimulationProviders } from "./contexts.js";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("Root element is missing");

root.dataset.endorsement = endorsement;
createRoot(root).render(
  <StrictMode>
    <SimulationProviders learner={fixtureLearner} lrsClient={fixtureLrsClient}>
      <SimPlayer
        scenarioId="FIXTURE-empty-shell"
        courseVersionId="FIXTURE-course-version"
        lessonId="FIXTURE-lesson"
        onEvent={() => undefined}
      />
    </SimulationProviders>
  </StrictMode>,
);
