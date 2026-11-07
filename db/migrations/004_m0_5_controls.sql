-- M0.5 controls added while adopting the owner-supplied reference package.
-- No objective, region, identity, accreditation or learner content is seeded here.

-- ---------- dedicated service principals ------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'commerce_writer') THEN
    CREATE ROLE commerce_writer NOLOGIN NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'credential_issuer') THEN
    CREATE ROLE credential_issuer NOLOGIN NOBYPASSRLS;
  END IF;
END $$;

DROP POLICY IF EXISTS enroll_write ON academy.enrollments;
REVOKE INSERT, UPDATE ON academy.enrollments FROM app_rw;
GRANT USAGE ON SCHEMA academy TO commerce_writer;
GRANT SELECT ON academy.users, academy.courses TO commerce_writer;
GRANT SELECT, INSERT, UPDATE ON academy.enrollments TO commerce_writer;

CREATE POLICY enroll_commerce_read ON academy.enrollments FOR SELECT TO commerce_writer
  USING (true);
CREATE POLICY enroll_commerce_insert ON academy.enrollments FOR INSERT TO commerce_writer
  WITH CHECK (source IN ('purchase','org_license','grant','staff'));
CREATE POLICY enroll_commerce_update ON academy.enrollments FOR UPDATE TO commerce_writer
  USING (true) WITH CHECK (source IN ('purchase','org_license','grant','staff'));

CREATE TABLE credentials.signing_keys (
  key_id text PRIMARY KEY,
  public_key_pem text NOT NULL,
  algorithm text NOT NULL DEFAULT 'Ed25519' CHECK (algorithm = 'Ed25519'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz
);
ALTER TABLE credentials.definitions
  ADD COLUMN claims_lint_passed boolean NOT NULL DEFAULT false;
ALTER TABLE credentials.issued
  ADD CONSTRAINT issued_signing_key_fk FOREIGN KEY (key_id) REFERENCES credentials.signing_keys(key_id);
ALTER TABLE credentials.issued
  ADD CONSTRAINT issued_revocation_complete CHECK (
    (revoked_at IS NULL AND revoked_reason IS NULL AND revoked_by IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_reason IS NOT NULL AND revoked_by IS NOT NULL)
  );

GRANT USAGE ON SCHEMA credentials TO credential_issuer;
GRANT SELECT ON credentials.definitions, credentials.signing_keys TO credential_issuer;
GRANT INSERT ON credentials.issued TO credential_issuer;
REVOKE INSERT ON credentials.issued FROM app_rw;
CREATE POLICY issued_by_dedicated_service ON credentials.issued FOR INSERT TO credential_issuer
  WITH CHECK (
    revoked_at IS NULL AND revoked_reason IS NULL AND revoked_by IS NULL
    AND EXISTS (
      SELECT 1 FROM credentials.definitions d
      WHERE d.id = definition_id AND d.status = 'approved' AND d.claims_lint_passed
    )
    AND EXISTS (
      SELECT 1 FROM credentials.signing_keys k
      WHERE k.key_id = issued.key_id AND k.status = 'active'
    )
  );

-- ---------- request identity helpers ----------------------------------------
CREATE OR REPLACE FUNCTION academy.has_recent_mfa(max_age_seconds int DEFAULT 900) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN nullif(current_setting('app.mfa_verified_at', true), '') IS NULL THEN false
    ELSE extract(epoch FROM now())::bigint - current_setting('app.mfa_verified_at', true)::bigint
         BETWEEN 0 AND max_age_seconds
  END
$$;

-- ---------- audit access -----------------------------------------------------
ALTER TABLE audit.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.events FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_append ON audit.events FOR INSERT TO app_rw
  WITH CHECK (actor_id = academy.current_user_id());
CREATE POLICY audit_privileged_read ON audit.events FOR SELECT TO app_rw USING (
  academy.has_recent_mfa(900)
  AND (academy.has_role('platform_admin') OR academy.has_role('compliance_reviewer'))
);

ALTER TABLE audit.events
  ADD CONSTRAINT audit_prev_hash_format CHECK (prev_hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT audit_hash_format CHECK (hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT audit_outcome_value CHECK (outcome IN ('allowed','denied','succeeded','failed'));

-- ---------- defense-in-depth RLS for directory and draft metadata -----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'academy_rls_helper') THEN
    CREATE ROLE academy_rls_helper NOLOGIN BYPASSRLS;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION academy.is_cohort_instructor(target_cohort_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, academy
AS $$
  SELECT EXISTS (
    SELECT 1 FROM academy.cohort_members
    WHERE cohort_id = target_cohort_id
      AND user_id = academy.current_user_id()
      AND member_role = 'instructor'
  )
$$;
ALTER FUNCTION academy.is_cohort_instructor(text) OWNER TO academy_rls_helper;
GRANT USAGE ON SCHEMA academy TO academy_rls_helper;
GRANT SELECT ON academy.cohort_members TO academy_rls_helper;
REVOKE ALL ON FUNCTION academy.is_cohort_instructor(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION academy.is_cohort_instructor(text) TO app_rw;

ALTER TABLE academy.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.users FORCE ROW LEVEL SECURITY;
CREATE POLICY user_directory_read ON academy.users FOR SELECT TO app_rw USING (
  id = academy.current_user_id()
  OR academy.has_role('compliance_reviewer')
  OR EXISTS (
    SELECT 1 FROM academy.cohort_members cm
    WHERE cm.user_id = users.id AND academy.is_cohort_instructor(cm.cohort_id)
  )
);

ALTER TABLE academy.cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.cohort_members FORCE ROW LEVEL SECURITY;
CREATE POLICY cohort_members_read ON academy.cohort_members FOR SELECT TO app_rw USING (
  user_id = academy.current_user_id() OR academy.is_cohort_instructor(cohort_id)
);

ALTER TABLE academy.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.cohorts FORCE ROW LEVEL SECURITY;
CREATE POLICY cohort_read ON academy.cohorts FOR SELECT TO app_rw USING (
  EXISTS (
    SELECT 1 FROM academy.cohort_members cm
    WHERE cm.cohort_id = cohorts.id
      AND (cm.user_id = academy.current_user_id() OR academy.is_cohort_instructor(cm.cohort_id))
  )
);

ALTER TABLE academy.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.courses FORCE ROW LEVEL SECURITY;
CREATE POLICY course_metadata_read ON academy.courses FOR SELECT TO app_rw USING (
  EXISTS (
    SELECT 1 FROM academy.course_versions cv
    WHERE cv.course_id = courses.id AND cv.status = 'published'
  )
  OR academy.has_role('curriculum_owner') OR academy.has_role('final_publisher')
);

ALTER TABLE academy.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.lessons FORCE ROW LEVEL SECURITY;
CREATE POLICY lesson_read ON academy.lessons FOR SELECT TO app_rw USING (
  EXISTS (
    SELECT 1 FROM academy.course_versions cv
    WHERE cv.id = lessons.course_version_id AND cv.status = 'published'
  )
  OR academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer')
  OR academy.has_role('final_publisher')
);

ALTER TABLE academy.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.scenarios FORCE ROW LEVEL SECURITY;
CREATE POLICY scenario_metadata_read ON academy.scenarios FOR SELECT TO app_rw USING (
  EXISTS (
    SELECT 1 FROM academy.scenario_versions sv
    WHERE sv.scenario_id = scenarios.id AND sv.status = 'published'
  )
  OR academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer')
  OR academy.has_role('subject_matter_expert') OR academy.has_role('trade_safety_reviewer')
  OR academy.has_role('accessibility_reviewer') OR academy.has_role('compliance_reviewer')
  OR academy.has_role('final_publisher')
);

ALTER TABLE academy.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.approvals FORCE ROW LEVEL SECURITY;
CREATE POLICY approval_read ON academy.approvals FOR SELECT TO app_rw USING (
  academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer')
  OR academy.has_role('subject_matter_expert') OR academy.has_role('trade_safety_reviewer')
  OR academy.has_role('accessibility_reviewer') OR academy.has_role('compliance_reviewer')
  OR academy.has_role('final_publisher')
);
CREATE POLICY approval_insert ON academy.approvals FOR INSERT TO app_rw WITH CHECK (
  approver_id = academy.current_user_id()
  AND academy.has_recent_mfa(900)
  AND (
    academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer')
    OR academy.has_role('subject_matter_expert') OR academy.has_role('trade_safety_reviewer')
    OR academy.has_role('accessibility_reviewer') OR academy.has_role('compliance_reviewer')
    OR academy.has_role('final_publisher')
  )
  AND EXISTS (
    SELECT 1 FROM academy.scenario_versions sv
    JOIN academy.scenarios s ON s.id = sv.scenario_id
    WHERE sv.scenario_id = approvals.scenario_id
      AND sv.version = approvals.version
      AND sv.content_hash = approvals.content_hash
      AND s.author_id <> academy.current_user_id()
  )
);

ALTER TABLE credentials.definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials.definitions FORCE ROW LEVEL SECURITY;
CREATE POLICY definition_app_read ON credentials.definitions FOR SELECT TO app_rw USING (
  status = 'approved'
  OR academy.has_role('compliance_reviewer') OR academy.has_role('curriculum_owner')
);
CREATE POLICY definition_issuer_read ON credentials.definitions FOR SELECT TO credential_issuer
  USING (status = 'approved' AND claims_lint_passed);

ALTER TABLE credentials.accreditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials.accreditations FORCE ROW LEVEL SECURITY;
CREATE POLICY accreditation_compliance_read ON credentials.accreditations FOR SELECT TO app_rw
  USING (academy.has_role('compliance_reviewer'));

ALTER TABLE training.xapi_statements
  ADD CONSTRAINT xapi_body_size CHECK (octet_length(body::text) <= 16384),
  ADD CONSTRAINT xapi_verb_allowlist CHECK (verb IN (
    'http://adlnet.gov/expapi/verbs/experienced',
    'http://adlnet.gov/expapi/verbs/attempted',
    'http://adlnet.gov/expapi/verbs/completed',
    'http://adlnet.gov/expapi/verbs/passed',
    'http://adlnet.gov/expapi/verbs/failed',
    'https://honoraryhomes.org/xapi/verbs/selected',
    'https://honoraryhomes.org/xapi/verbs/measured',
    'https://honoraryhomes.org/xapi/verbs/placed',
    'https://honoraryhomes.org/xapi/verbs/failed-safety-check'
  ));

-- ---------- learning objective registry -------------------------------------
CREATE TABLE academy.learning_objectives (
  id text NOT NULL,
  version int NOT NULL CHECK (version > 0),
  course_version_id text NOT NULL REFERENCES academy.course_versions(id),
  statement text NOT NULL CHECK (length(trim(statement)) > 0),
  bloom_level text NOT NULL CHECK (bloom_level IN ('remember','understand','apply','analyze','evaluate','create')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','retired')),
  source_package_id text NOT NULL,
  created_by text NOT NULL REFERENCES academy.users(id),
  approved_by text REFERENCES academy.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, version),
  CHECK (status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK (approved_by IS NULL OR approved_by <> created_by)
);

CREATE OR REPLACE FUNCTION academy.block_approved_objective_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'approved' AND NOT (
    NEW.status = 'retired'
    AND (to_jsonb(NEW) - 'status') = (to_jsonb(OLD) - 'status')
  ) THEN
    RAISE EXCEPTION 'approved objective %.% is immutable; create a new version', OLD.id, OLD.version;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER learning_objectives_immutable BEFORE UPDATE ON academy.learning_objectives
  FOR EACH ROW EXECUTE FUNCTION academy.block_approved_objective_mutation();

GRANT SELECT, INSERT, UPDATE ON academy.learning_objectives TO app_rw;
ALTER TABLE academy.learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy.learning_objectives FORCE ROW LEVEL SECURITY;
CREATE POLICY objective_read ON academy.learning_objectives FOR SELECT TO app_rw USING (
  (status = 'approved' AND EXISTS (
    SELECT 1 FROM academy.course_versions cv
    WHERE cv.id = course_version_id AND cv.status = 'published'
  ))
  OR academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer')
  OR academy.has_role('subject_matter_expert') OR academy.has_role('final_publisher')
);
CREATE POLICY objective_insert ON academy.learning_objectives FOR INSERT TO app_rw WITH CHECK (
  status = 'draft'
  AND created_by = academy.current_user_id()
  AND (academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer'))
);
CREATE POLICY objective_update ON academy.learning_objectives FOR UPDATE TO app_rw
  USING (academy.has_role('curriculum_owner') OR academy.has_role('instructional_designer'))
  WITH CHECK (status <> 'approved' OR (
    approved_by = academy.current_user_id()
    AND approved_by <> created_by
    AND academy.has_role('curriculum_owner')
  ));

-- ---------- region configuration schema -------------------------------------
CREATE TABLE academy.region_configs (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  jurisdiction_code_notes text,
  public_disclaimer text,
  state_apprenticeship_agency text,
  lead_safe_authority text,
  active boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','retired')),
  reviewed_by text REFERENCES academy.users(id),
  reviewed_at timestamptz,
  CHECK (status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
GRANT SELECT ON academy.region_configs TO app_rw;
ALTER TABLE academy.region_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY region_read ON academy.region_configs FOR SELECT TO app_rw USING (
  status = 'approved' OR academy.has_role('platform_admin') OR academy.has_role('curriculum_owner')
);

-- Force RLS on every app-facing table carrying learner, enrollment or content data.
ALTER TABLE academy.enrollments FORCE ROW LEVEL SECURITY;
ALTER TABLE academy.scenario_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE academy.course_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE credentials.issued FORCE ROW LEVEL SECURITY;
ALTER TABLE credentials.ojt_hours FORCE ROW LEVEL SECURITY;
ALTER TABLE credentials.third_party FORCE ROW LEVEL SECURITY;
