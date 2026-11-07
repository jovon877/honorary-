# ADR 0002: M0.5 Back-End Boundaries

- Status: accepted for M0.5
- Date: 2026-11-06
- Sources: Simulation Lab §§13, 16–18; Academy spec §§3, 17–22, 25–27

## Context

The owner reference archive supplies working authorization, publication, catalog, credential, security, xAPI and PostgreSQL controls. M0.5 must adopt those controls without choosing a production web framework, identity vendor, database driver, Redis service, KMS or deployment target.

## Decision

Keep the reference domains as private `@honorary-homes/*` workspace packages. `apps/api` is a framework-neutral `Request`/`Response` handler with injected identity and repository contracts. PostgreSQL behavior is expressed in forward-only SQL migrations and tested locally with PGlite. Production infrastructure adapters remain outside M0.5.

The identity contract supports one configured provider per environment. Only the fixture implementation exists in M0.5, and it rejects production environments. Auth0, Clerk and WorkOS adapters remain M0.6 work.

## Consequences

- Domain controls can be tested without cloud credentials or outbound calls.
- A future HTTP framework and PostgreSQL driver can adapt to stable boundaries without changing domain policy.
- PGlite provides local PostgreSQL semantics but does not replace the required real-Postgres CI job.
- In-memory rate limiting and generated signing keys are test or single-process reference behavior only; production requires Redis and KMS/HSM per Simulation Lab §17.
