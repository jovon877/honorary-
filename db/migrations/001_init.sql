-- Honorary Homes Academy — core schema with row-level security (reference).
-- Principles:
--   * The app connects as role app_rw, which does NOT own tables and does NOT bypass RLS.
--   * Request identity is set per transaction:  SET LOCAL app.user_id = '...'; SET LOCAL app.roles = 'learner,instructor';
--   * training and housing data live in separate schemas with no cross grants.
--   * Published versions and audit rows are immutable (triggers + revoked privileges).

CREATE SCHEMA IF NOT EXISTS academy;
CREATE SCHEMA IF NOT EXISTS training;
CREATE SCHEMA IF NOT EXISTS housing;   -- owned by the property/housing service; never joined to training
CREATE SCHEMA IF NOT EXISTS audit;

-- ---------- helpers ----------------------------------------------------------
CREATE OR REPLACE FUNCTION academy.current_user_id() RETURNS text
LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id', true), '') $$;

CREATE OR REPLACE FUNCTION academy.has_role(r text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT r = ANY (string_to_array(coalesce(current_setting('app.roles', true), ''), ','))
$$;

-- ---------- organizations, people, cohorts -----------------------------------
CREATE TABLE academy.orgs (
  id text PRIMARY KEY,
  name text NOT NULL,
  org_type text NOT NULL CHECK (org_type IN ('college','trade_school','municipality','housing_authority','nonprofit','employer','workforce_board','corporate','internal')),
  individual_response_access boolean NOT NULL DEFAULT false
);

CREATE TABLE academy.users (
  id text PRIMARY KEY,
  org_id text REFERENCES academy.orgs(id),
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE academy.cohorts (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES academy.orgs(id),
  name text NOT NULL
);

CREATE TABLE academy.cohort_members (
  cohort_id text NOT NULL REFERENCES academy.cohorts(id),
  user_id text NOT NULL REFERENCES academy.users(id),
  member_role text NOT NULL CHECK (member_role IN ('learner','instructor')),
  PRIMARY KEY (cohort_id, user_id, member_role)
);

-- ---------- course catalog ---------------------------------------------------
CREATE TABLE academy.schools (
  slug text PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE academy.courses (
  id text PRIMARY KEY,
  sku text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  school_slug text NOT NULL REFERENCES academy.schools(slug),
  title text NOT NULL,
  level text NOT NULL CHECK (level IN ('foundation','professional','advanced','executive'))
);

CREATE TABLE academy.course_versions (
  id text PRIMARY KEY,
  course_id text NOT NULL REFERENCES academy.courses(id),
  version int NOT NULL CHECK (version > 0),
  status text NOT NULL CHECK (status IN ('concept','draft','subject_matter_review','legal_review','media_production','quality_assurance','approved','published','retired')),
  price_cents int NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  estimated_minutes int,
  published_at timestamptz,
  UNIQUE (course_id, version)
);

CREATE TABLE academy.lessons (
  id text PRIMARY KEY,
  course_version_id text NOT NULL REFERENCES academy.course_versions(id),
  position int NOT NULL,
  title text NOT NULL,
  lesson_kind text NOT NULL CHECK (lesson_kind IN ('lesson','exercise','field_application','assessment','simulation')),
  UNIQUE (course_version_id, position)
);

-- ---------- 3D simulation scenarios ------------------------------------------
CREATE TABLE academy.scenarios (
  id text PRIMARY KEY CHECK (id ~ '^SIM-[0-9]{3}$'),
  title text NOT NULL,
  sim_type text NOT NULL CHECK (sim_type IN ('exploration','hazard_recognition','procedural_build','diagnostic','inspection','branching_dialogue','planning')),
  author_id text NOT NULL REFERENCES academy.users(id)
);

CREATE TABLE academy.scenario_versions (
  scenario_id text NOT NULL REFERENCES academy.scenarios(id),
  version int NOT NULL CHECK (version > 0),
  status text NOT NULL CHECK (status IN ('draft','in_review','approved','published','retired')),
  lesson_id text REFERENCES academy.lessons(id),
  environment_id text NOT NULL CHECK (environment_id ~ '^ENV-[A-Z]{2,4}-[0-9]{2}$'),
  content jsonb NOT NULL,                     -- validated SimulationScenario (spec §7.4)
  content_hash text NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  asset_manifest jsonb NOT NULL DEFAULT '[]', -- object keys for glTF/KTX2 files, never public URLs
  has_non_visual_path boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  PRIMARY KEY (scenario_id, version),
  CHECK (status <> 'published' OR (has_non_visual_path AND published_at IS NOT NULL))
);

CREATE TABLE academy.approvals (
  id bigserial PRIMARY KEY,
  scenario_id text NOT NULL,
  version int NOT NULL,
  content_hash text NOT NULL,
  review_type text NOT NULL CHECK (review_type IN ('trade_safety','subject_matter','accessibility','instructional_design','compliance','final_publisher')),
  approver_id text NOT NULL REFERENCES academy.users(id),
  decision text NOT NULL CHECK (decision IN ('approved','rejected')),
  decided_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (scenario_id, version) REFERENCES academy.scenario_versions(scenario_id, version)
);

-- Published course and scenario versions are immutable; changes create a new version.
CREATE OR REPLACE FUNCTION academy.block_published_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'published' AND NOT (
    NEW.status = 'retired'
    AND (to_jsonb(NEW) - 'status') = (to_jsonb(OLD) - 'status')
  ) THEN
    RAISE EXCEPTION 'published version % is immutable; create a new version', OLD.version;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER scenario_versions_immutable BEFORE UPDATE ON academy.scenario_versions
  FOR EACH ROW EXECUTE FUNCTION academy.block_published_mutation();

CREATE OR REPLACE FUNCTION academy.block_published_course_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'published' AND NOT (
    NEW.status = 'retired'
    AND (to_jsonb(NEW) - 'status') = (to_jsonb(OLD) - 'status')
  ) THEN
    RAISE EXCEPTION 'published course version % is immutable; create a new version', OLD.version;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER course_versions_immutable BEFORE UPDATE ON academy.course_versions
  FOR EACH ROW EXECUTE FUNCTION academy.block_published_course_mutation();

-- ---------- enrollment & training records ------------------------------------
CREATE TABLE academy.enrollments (
  user_id text NOT NULL REFERENCES academy.users(id),
  course_id text NOT NULL REFERENCES academy.courses(id),
  source text NOT NULL CHECK (source IN ('purchase','org_license','grant','staff')),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE training.sim_attempts (
  id uuid PRIMARY KEY,
  learner_id text NOT NULL REFERENCES academy.users(id),
  cohort_id text REFERENCES academy.cohorts(id),
  scenario_id text NOT NULL,
  scenario_version int NOT NULL,
  stage text NOT NULL CHECK (stage IN ('learn','practice','prove')),
  seed bigint NOT NULL,
  score_scaled numeric(5,4) CHECK (score_scaled BETWEEN 0 AND 1),
  passed boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (scenario_id, scenario_version) REFERENCES academy.scenario_versions(scenario_id, version)
);

CREATE TABLE training.xapi_statements (
  id uuid PRIMARY KEY,                       -- statement id = idempotency key
  learner_id text NOT NULL REFERENCES academy.users(id),
  attempt_id uuid REFERENCES training.sim_attempts(id),
  verb text NOT NULL,
  body jsonb NOT NULL,
  stored_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- audit (append-only, hash chained) --------------------------------
CREATE TABLE audit.events (
  seq bigint PRIMARY KEY,
  prev_hash text NOT NULL,
  hash text NOT NULL UNIQUE,
  actor_id text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  outcome text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION audit.block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit log is append-only'; END $$;
CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON audit.events
  FOR EACH ROW EXECUTE FUNCTION audit.block_mutation();

-- ---------- application role & grants ----------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_rw') THEN
    CREATE ROLE app_rw NOLOGIN NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA academy, training, audit TO app_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA academy TO app_rw;
GRANT INSERT, UPDATE ON academy.scenario_versions, academy.course_versions, academy.enrollments TO app_rw;
GRANT INSERT ON academy.approvals TO app_rw;
GRANT USAGE ON SEQUENCE academy.approvals_id_seq TO app_rw;
GRANT SELECT, INSERT ON training.sim_attempts, training.xapi_statements TO app_rw;
GRANT INSERT, SELECT ON audit.events TO app_rw;
-- Deliberately no grants on schema housing to app_rw: separate service, separate role.
REVOKE ALL ON SCHEMA housing FROM PUBLIC;

-- ---------- row-level security -----------------------------------------------
ALTER TABLE training.sim_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training.sim_attempts FORCE ROW LEVEL SECURITY;
ALTER TABLE training.xapi_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE training.xapi_statements FORCE ROW LEVEL SECURITY;
ALTER TABLE academy.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.scenario_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.course_versions ENABLE ROW LEVEL SECURITY;

-- Training data: learner sees own; instructor sees cohorts they teach. Property/housing roles: nothing.
CREATE POLICY attempts_read ON training.sim_attempts FOR SELECT TO app_rw USING (
  NOT academy.has_role('property_staff') AND NOT academy.has_role('housing_staff') AND (
    learner_id = academy.current_user_id()
    OR (academy.has_role('instructor') AND cohort_id IN (
          SELECT cohort_id FROM academy.cohort_members
          WHERE user_id = academy.current_user_id() AND member_role = 'instructor'))
  )
);
CREATE POLICY attempts_insert ON training.sim_attempts FOR INSERT TO app_rw WITH CHECK (
  learner_id = academy.current_user_id()
  AND EXISTS (                                   -- must be enrolled in the course that owns the scenario
    SELECT 1 FROM academy.scenario_versions sv
    JOIN academy.lessons l ON l.id = sv.lesson_id
    JOIN academy.course_versions cv ON cv.id = l.course_version_id
    JOIN academy.enrollments e ON e.course_id = cv.course_id AND e.user_id = academy.current_user_id() AND e.active
    WHERE sv.scenario_id = sim_attempts.scenario_id AND sv.version = sim_attempts.scenario_version
      AND sv.status = 'published')
);

CREATE POLICY xapi_read ON training.xapi_statements FOR SELECT TO app_rw USING (
  learner_id = academy.current_user_id()
  AND NOT academy.has_role('property_staff') AND NOT academy.has_role('housing_staff'));
CREATE POLICY xapi_insert ON training.xapi_statements FOR INSERT TO app_rw WITH CHECK (
  learner_id = academy.current_user_id());

CREATE POLICY enroll_read ON academy.enrollments FOR SELECT TO app_rw USING (
  user_id = academy.current_user_id() OR academy.has_role('platform_admin'));
CREATE POLICY enroll_write ON academy.enrollments FOR INSERT TO app_rw WITH CHECK (
  academy.has_role('platform_admin'));  -- purchases are written by the commerce service role, not by users

-- Catalog: everyone sees published; curriculum staff also see drafts.
CREATE POLICY scen_read ON academy.scenario_versions FOR SELECT TO app_rw USING (
  status = 'published'
  OR academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer')
  OR academy.has_role('subject_matter_expert') OR academy.has_role('trade_safety_reviewer')
  OR academy.has_role('accessibility_reviewer') OR academy.has_role('compliance_reviewer')
  OR academy.has_role('final_publisher'));
CREATE POLICY scen_write ON academy.scenario_versions FOR INSERT TO app_rw WITH CHECK (
  status IN ('draft','in_review')
  AND (academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer')));
-- Only the final publisher can move a version to published; the app ALSO runs canPublishScenario().
CREATE POLICY scen_update ON academy.scenario_versions FOR UPDATE TO app_rw
  USING (academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer') OR academy.has_role('final_publisher'))
  WITH CHECK (status <> 'published' OR academy.has_role('final_publisher'));

CREATE POLICY course_read ON academy.course_versions FOR SELECT TO app_rw USING (
  status = 'published' OR academy.has_role('curriculum_owner') OR academy.has_role('final_publisher'));
CREATE POLICY course_write ON academy.course_versions FOR INSERT TO app_rw WITH CHECK (
  status NOT IN ('approved','published') AND academy.has_role('curriculum_owner'));
CREATE POLICY course_update ON academy.course_versions FOR UPDATE TO app_rw
  USING (academy.has_role('curriculum_owner') OR academy.has_role('final_publisher'))
  WITH CHECK (status <> 'published' OR academy.has_role('final_publisher'));
