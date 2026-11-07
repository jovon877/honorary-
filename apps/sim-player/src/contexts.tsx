import { createContext, useContext, type ReactNode } from "react";
import {
  InMemoryLrsClient,
  type LearnerContextValue,
  type LrsClient,
} from "@honorary-homes/sim-xapi";

const LearnerContext = createContext<LearnerContextValue | null>(null);
const LrsContext = createContext<LrsClient | null>(null);

export function SimulationProviders({
  learner,
  lrsClient,
  children,
}: {
  learner: LearnerContextValue;
  lrsClient: LrsClient;
  children: ReactNode;
}) {
  return (
    <LearnerContext value={learner}>
      <LrsContext value={lrsClient}>{children}</LrsContext>
    </LearnerContext>
  );
}

export function useLearner(): LearnerContextValue {
  const learner = useContext(LearnerContext);
  if (!learner) throw new Error("SimPlayer requires an injected LearnerContext");
  return learner;
}

export function useLrsClient(): LrsClient {
  const client = useContext(LrsContext);
  if (!client) throw new Error("SimPlayer requires an injected LrsClient");
  return client;
}

export const fixtureLearner: LearnerContextValue = {
  learnerId: "FIXTURE-learner",
  displayName: "FIXTURE — not real",
  fixture: true,
};

export const fixtureLrsClient = new InMemoryLrsClient();
