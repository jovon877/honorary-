import { Canvas } from "@react-three/fiber";
import { buildSimStatement, type XapiStatement } from "@honorary-homes/sim-xapi";
import { useLearner, useLrsClient } from "./contexts.js";

export interface SimPlayerProps {
  scenarioId: string;
  courseVersionId: string;
  lessonId: string;
  onEvent: (statement: XapiStatement) => void;
}

function EmptyScene() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#d6d3cd" wireframe />
      </mesh>
    </>
  );
}

export function SimPlayer({ scenarioId, courseVersionId, lessonId, onEvent }: SimPlayerProps) {
  const learner = useLearner();
  const lrsClient = useLrsClient();

  const initialize = async () => {
    const statement = buildSimStatement(learner, {
      eventId: crypto.randomUUID(),
      verbId: "http://adlnet.gov/expapi/verbs/initialized",
      verbLabel: "initialized",
      scenarioId,
      scenarioLabel: "Empty simulation shell",
      courseVersionId,
      lessonId,
      occurredAt: new Date().toISOString(),
    });
    await lrsClient.send(statement);
    onEvent(statement);
  };

  return (
    <main>
      <header className="masthead">
        <div>
          <p className="eyebrow">Honorary Homes Academy · Simulation Lab</p>
          <h1>M0 simulation foundations</h1>
        </div>
        <span className="status">Standalone diagnostic</span>
      </header>

      <section className="workspace" aria-labelledby="viewport-title">
        <div className="viewport-panel">
          <div className="panel-heading">
            <div>
              <p className="label">WebGL shell</p>
              <h2 id="viewport-title">Empty scene ready</h2>
            </div>
            <span aria-label="Scene status: ready" className="ready-dot" />
          </div>
          <div className="viewport" data-testid="webgl-shell">
            <Canvas camera={{ position: [3, 3, 3], fov: 42 }}>
              <EmptyScene />
            </Canvas>
            <p className="viewport-note">Greybox geometry · no course content</p>
          </div>
        </div>

        <aside className="diagnostics" aria-label="Integration diagnostics">
          <p className="label">Integration seams</p>
          <h2>Ready for its host</h2>
          <dl>
            <div>
              <dt>Scenario</dt>
              <dd>{scenarioId}</dd>
            </div>
            <div>
              <dt>Course version</dt>
              <dd>{courseVersionId}</dd>
            </div>
            <div>
              <dt>Lesson</dt>
              <dd>{lessonId}</dd>
            </div>
            <div>
              <dt>Learner</dt>
              <dd>{learner.displayName}</dd>
            </div>
          </dl>
          <button type="button" onClick={() => void initialize()}>
            Initialize shell
          </button>
          <p className="notice">
            Practice environment only. Hands-on verification happens separately.
          </p>
        </aside>
      </section>

      <section className="non3d" aria-labelledby="non3d-title">
        <p className="label">Equivalent non-3D route</p>
        <h2 id="non3d-title">Structured scene summary</h2>
        <p>The M0 scene is empty. No actions or learning objectives are assigned.</p>
      </section>
    </main>
  );
}
