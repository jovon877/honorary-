-- Credentials, certifications, apprenticeship hours (reference).
CREATE SCHEMA IF NOT EXISTS credentials;

CREATE TABLE credentials.definitions (
  id text PRIMARY KEY CHECK (id ~ '^HH-[A-Z]{2,4}-[A-Z0-9-]{2,40}$'),
  kind text NOT NULL CHECK (kind IN ('completion_certificate','sim_competency_badge','ready_for_crew','ojt_hours_record')),
  title text NOT NULL,
  disclaimer text NOT NULL CHECK (length(disclaimer) >= 20),
  course_id text REFERENCES academy.courses(id),
  scenario_ids text[] NOT NULL DEFAULT '{}',
  valid_days int CHECK (valid_days IS NULL OR valid_days > 0),
  min_ojt_hours int CHECK (min_ojt_hours IS NULL OR min_ojt_hours > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','retired'))
);

CREATE TABLE credentials.issued (
  credential_id text PRIMARY KEY CHECK (length(credential_id) >= 22),
  definition_id text NOT NULL REFERENCES credentials.definitions(id),
  subject_id text NOT NULL REFERENCES academy.users(id),
  payload jsonb NOT NULL,
  signature text NOT NULL,
  key_id text NOT NULL,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  revoked_by text REFERENCES academy.users(id),
  CHECK ((revoked_at IS NULL) = (revoked_reason IS NULL))
);
-- Issued credentials are never edited or deleted; only revocation fields may be set, once.
CREATE OR REPLACE FUNCTION credentials.only_revoke() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'issued credentials cannot be deleted; revoke instead'; END IF;
  IF OLD.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'credential already revoked'; END IF;
  IF NEW.credential_id IS DISTINCT FROM OLD.credential_id
     OR NEW.definition_id IS DISTINCT FROM OLD.definition_id
     OR NEW.payload IS DISTINCT FROM OLD.payload OR NEW.signature IS DISTINCT FROM OLD.signature
     OR NEW.key_id IS DISTINCT FROM OLD.key_id OR NEW.subject_id IS DISTINCT FROM OLD.subject_id
     OR NEW.issued_at IS DISTINCT FROM OLD.issued_at OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'issued credential is immutable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER issued_only_revoke BEFORE UPDATE OR DELETE ON credentials.issued
  FOR EACH ROW EXECUTE FUNCTION credentials.only_revoke();

-- Accreditations Honorary Homes holds (OSHA Outreach, EPA RRP provider, NCCER ATS, RA sponsor ...)
CREATE TABLE credentials.accreditations (
  id bigserial PRIMARY KEY,
  program text NOT NULL,
  credential_type text NOT NULL,
  issuing_body text NOT NULL,
  jurisdiction text NOT NULL,
  accreditation_number text NOT NULL,
  valid_from date NOT NULL,
  valid_until date NOT NULL CHECK (valid_until > valid_from),
  verified_by text NOT NULL REFERENCES academy.users(id),
  evidence_document_key text NOT NULL
);

-- Credentials issued by other bodies (recorded, verified, never re-issued by us)
CREATE TABLE credentials.third_party (
  id bigserial PRIMARY KEY,
  learner_id text NOT NULL REFERENCES academy.users(id),
  credential_type text NOT NULL,
  issuing_body text NOT NULL,
  jurisdiction text NOT NULL,
  credential_number_enc bytea,           -- application-layer encrypted (envelope / KMS)
  earned_at date NOT NULL,
  expires_at date,
  source text NOT NULL CHECK (source IN ('delivered_by_honorary_homes','earned_elsewhere')),
  verification text NOT NULL DEFAULT 'unverified' CHECK (verification IN ('unverified','verified_primary_source','rejected')),
  verified_by text REFERENCES academy.users(id),
  evidence_document_key text,
  CHECK (verification <> 'verified_primary_source' OR (verified_by IS NOT NULL AND evidence_document_key IS NOT NULL))
);

-- Apprenticeship on-the-job hours, mapped to a work-process schedule
CREATE TABLE credentials.ojt_hours (
  id bigserial PRIMARY KEY,
  apprentice_id text NOT NULL REFERENCES academy.users(id),
  work_process text NOT NULL,            -- e.g. 'framing', 'finish_carpentry', 'site_safety'
  project_ref text NOT NULL,             -- Honorary Build / Vacant Bone job number
  work_date date NOT NULL,
  hours numeric(4,2) NOT NULL CHECK (hours > 0 AND hours <= 16),
  supervisor_id text REFERENCES academy.users(id),
  verified_at timestamptz,
  CHECK (supervisor_id IS NULL OR supervisor_id <> apprentice_id),
  CHECK ((verified_at IS NULL) OR (supervisor_id IS NOT NULL))
);

GRANT USAGE ON SCHEMA credentials TO app_rw;
GRANT SELECT ON credentials.definitions, credentials.accreditations TO app_rw;
GRANT SELECT, INSERT, UPDATE ON credentials.issued, credentials.third_party, credentials.ojt_hours TO app_rw;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA credentials TO app_rw;

ALTER TABLE credentials.issued ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials.issued FORCE ROW LEVEL SECURITY;
ALTER TABLE credentials.ojt_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials.ojt_hours FORCE ROW LEVEL SECURITY;
ALTER TABLE credentials.third_party ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials.third_party FORCE ROW LEVEL SECURITY;

-- Issued: learner reads own; issuance runs as a dedicated service role (not app_rw);
-- revocation only by compliance reviewer.
CREATE POLICY issued_read ON credentials.issued FOR SELECT TO app_rw USING (
  subject_id = academy.current_user_id() OR academy.has_role('compliance_reviewer'));
CREATE POLICY issued_revoke ON credentials.issued FOR UPDATE TO app_rw
  USING (academy.has_role('compliance_reviewer'))
  WITH CHECK (revoked_by = academy.current_user_id());

-- OJT hours: apprentice logs own (unverified); only a different supervisor verifies.
CREATE POLICY ojt_read ON credentials.ojt_hours FOR SELECT TO app_rw USING (
  apprentice_id = academy.current_user_id() OR supervisor_id = academy.current_user_id()
  OR academy.has_role('instructor'));
CREATE POLICY ojt_insert ON credentials.ojt_hours FOR INSERT TO app_rw WITH CHECK (
  apprentice_id = academy.current_user_id() AND verified_at IS NULL);
CREATE POLICY ojt_verify ON credentials.ojt_hours FOR UPDATE TO app_rw
  USING (academy.has_role('instructor') AND apprentice_id <> academy.current_user_id())
  WITH CHECK (supervisor_id = academy.current_user_id());

CREATE POLICY tp_read ON credentials.third_party FOR SELECT TO app_rw USING (
  learner_id = academy.current_user_id() OR academy.has_role('compliance_reviewer'));
CREATE POLICY tp_insert ON credentials.third_party FOR INSERT TO app_rw WITH CHECK (
  (learner_id = academy.current_user_id() AND verification = 'unverified')
  OR academy.has_role('compliance_reviewer'));
CREATE POLICY tp_verify ON credentials.third_party FOR UPDATE TO app_rw
  USING (academy.has_role('compliance_reviewer'))
  WITH CHECK (verified_by = academy.current_user_id() AND learner_id <> academy.current_user_id());
