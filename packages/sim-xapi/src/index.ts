export interface LearnerContextValue {
  learnerId: string;
  displayName: string;
  fixture: boolean;
}

export interface XapiStatement {
  id: string;
  actor: { account: { homePage: string; name: string }; name: string };
  verb: { id: string; display: { "en-US": string } };
  object: { id: string; definition: { name: { "en-US": string } } };
  context: { extensions: Record<string, string> };
  timestamp: string;
}

export interface LrsClient {
  send(statement: XapiStatement): Promise<void>;
}

export class InMemoryLrsClient implements LrsClient {
  readonly statements: XapiStatement[] = [];

  send(statement: XapiStatement): Promise<void> {
    this.statements.push(structuredClone(statement));
    return Promise.resolve();
  }
}

export interface SimEventInput {
  eventId: string;
  verbId: string;
  verbLabel: string;
  scenarioId: string;
  scenarioLabel: string;
  courseVersionId: string;
  lessonId: string;
  occurredAt: string;
}

export function buildSimStatement(
  learner: LearnerContextValue,
  event: SimEventInput,
): XapiStatement {
  return {
    id: event.eventId,
    actor: {
      account: { homePage: "urn:honorary-homes:academy", name: learner.learnerId },
      name: learner.displayName,
    },
    verb: { id: event.verbId, display: { "en-US": event.verbLabel } },
    object: {
      id: `urn:honorary-homes:simulation:${event.scenarioId}`,
      definition: { name: { "en-US": event.scenarioLabel } },
    },
    context: {
      extensions: {
        "urn:honorary-homes:course-version": event.courseVersionId,
        "urn:honorary-homes:lesson": event.lessonId,
      },
    },
    timestamp: event.occurredAt,
  };
}
