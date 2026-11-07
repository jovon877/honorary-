# Architecture

This bootstrap uses the Academy monorepo layout (Academy spec §3; Simulation Lab §0A and §7.1).

- `apps/sim-player`: standalone empty web simulation shell and future learning-player embed.
- `apps/api`: framework-neutral M0.5 HTTP boundary for health, credential verification and authenticated xAPI ingest.
- `packages/authorization`: server-side, deny-by-default action policy.
- `packages/catalog`: published catalog, entitlement checks and learner-scoped asset URL signing.
- `packages/credentials`: eligibility, Ed25519 signing, verification and accreditation checks.
- `packages/database`: forward-only migration loader and request-identity transaction contract.
- `packages/identity`: provider-neutral session contract plus a production-blocked fixture provider.
- `packages/publishing`: exact-version scenario publication gate.
- `packages/security`: audit-chain, claims-lint, redaction, rate-limit and HTTP-header controls.
- `packages/sim-core`: renderer-independent state, deterministic randomization, scoring and replay.
- `packages/sim-content`: scenario schemas, objective mapping and publication gates.
- `packages/sim-xapi`: xAPI builders and swappable LRS boundary.
- `packages/sim-assets`: asset-manifest budgets.
- `packages/sim-ui`: shared simulation UI contracts.
- `workers/sim-asset-pipeline`: glTF validation and optimization boundary.
- `db/migrations`: PostgreSQL schemas, RLS, immutable records, dedicated service roles and empty owner-managed registries.

The API depends on injected repositories and identity providers. Production Auth0, Clerk or WorkOS adapters, Redis, KMS/HSM, object storage, commerce-webhook verification and deployment wiring are intentionally deferred. Missing upstream applications and services remain explicit in `docs/INTEGRATION_GAPS.md`.
