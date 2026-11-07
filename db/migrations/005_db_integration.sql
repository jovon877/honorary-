-- Real PostgreSQL integration role. The workflow creates this login with a
-- fixture password before migrations; PGlite creates the same role locally.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_login') THEN
    CREATE ROLE app_login LOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;

ALTER ROLE app_login NOSUPERUSER NOBYPASSRLS;
GRANT app_rw TO app_login;
