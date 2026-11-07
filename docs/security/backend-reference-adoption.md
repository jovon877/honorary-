# Owner Back-End Reference Adoption

## Provenance

- Source: `honorary-homes-backend-reference.zip`, supplied by the owner on 2026-11-06
- SHA-256: `48c53de84550e368608d41a21331c64f31e2f3bdd15c26559d26968debdab6c0`
- Acceptance target: 31 unit tests plus 14 PostgreSQL tests, exactly 45 reference tests (Simulation Lab §13, M0.5)

## Mapping

| Reference area | Monorepo destination |
|---|---|
| authorization policy | `packages/authorization` |
| scenario publication gate | `packages/publishing` and the `packages/sim-content` public export |
| xAPI ingestion | `packages/sim-xapi` |
| audit, headers, limiting, claims and redaction | `packages/security` |
| catalog, entitlements and asset signing | `packages/catalog` |
| credential engine | `packages/credentials` |
| PostgreSQL schema and test seed | `db/migrations/001_init.sql` through `003_seed_catalog.sql` |
| 31 reference unit tests | `tests/backend/reference.unit.test.ts` |
| 14 reference database tests | `tests/backend/reference-db.integration.test.ts` |

## M0.5 integration additions

- `004_m0_5_controls.sql` adds dedicated commerce and credential-issuer roles, signing-key state, recent-MFA audit access, an empty objective registry and an empty region-config registry.
- `packages/identity` adds the provider-neutral contract and production-blocked fixture implementation required by the owner decisions in `docs/INTEGRATION_GAPS.md`.
- `apps/api` adds only the allowed health, public verification and authenticated xAPI boundaries.
- Credential issuance now requires an approved definition, a passed claims-lint flag and an active signing key at the database policy boundary.
- Database credential payloads are schema-validated before public verification.
- Published and approved records were tightened so retirement may change only status; credential identity, definition and signing-key fields are immutable.
- Defense-in-depth RLS was added for user/cohort directories, draft catalog metadata, approvals, credential definitions and accreditation records.

## Deliberate deviations

- The reference package used `@electric-sql/pglite` 0.5.15. M0.5 pins 0.5.11 because 0.5.15 was younger than the 14-day dependency floor when resolved; 0.5.11 was published 2026-10-21.
- Reference imports were changed to workspace package names. Fixture setup was extended for the new signing-key policy. Test intent and the 31 + 14 test count remain unchanged.
- No production identity, Redis, KMS, object-store, database-driver or deployment adapter was copied or invented.
