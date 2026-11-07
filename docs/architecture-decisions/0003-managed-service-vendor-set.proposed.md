# ADR 0003: Managed-service vendor set

**Status:** Proposed — owner and engineering-lead approval required  
**Decision owners:** Product owner and engineering lead  
**Source:** `docs/INTEGRATION_GAPS.md` row 17; Simulation Lab §12.1 and §§16–17

## Context

The owner selected Vercel plus managed services, while retaining non-Vercel container execution for Chromium, FFmpeg, media, video, asset-pipeline, and other long-running jobs. The application already depends on database, rate-limit, object-storage, credential-signing, and identity interfaces. This ADR proposes vendors without provisioning or coupling domain packages to vendor SDKs.

## Proposed decision

| Capability | Proposed vendor | Boundary and approval condition |
|---|---|---|
| Web apps and HTTP API routes | Vercel | `apps/web`, `apps/learning`, `apps/admin`, and request/response API routes only. |
| PostgreSQL | Neon, PostgreSQL 17 | Plain managed PostgreSQL with forced RLS. Confirm the production major before launch; CI currently pins PostgreSQL 17 as the proposed baseline. |
| Redis | Upstash Redis | Implement only behind the rate-limit/queue adapter and preserve atomic token-bucket behavior. |
| Private object storage | Cloudflare R2 | Private buckets and short-lived per-user signed URLs through `ObjectStorage`. S3 remains the fallback if engineering rejects R2. |
| Credential signing | Cloud KMS, vendor pending | Approval requires verified non-exportable Ed25519 signing. If the selected KMS cannot provide it, raise a separate ADR for ECDSA P-256; do not export keys or silently change algorithms. |
| Container workers | Google Cloud Run | Proposed for PDF/media/video/asset workers; deny general outbound network and allow only approved internal APIs and managed-service endpoints. |
| Identity | Auth0, Clerk, or WorkOS per environment | Existing `IdentityProvider` conformance boundary remains; exactly one provider is active in each environment. |

## Constraints

- No resource is provisioned by this ADR.
- `DbClient` selects `pg` only when `DATABASE_URL` is present and PGlite otherwise.
- Request identity uses transaction-local configuration only. Session-level `SET app.*` is forbidden.
- Redis, KMS, object storage, and identity vendor clients do not enter domain packages directly.
- Serverless connections must use provider-supported pooling. No connection may retain learner identity after a transaction.
- Production selection requires an engineering-lead check of current features, region availability, pricing, data-processing terms, backup/restore, observability, and incident support.

## Consequences

The proposal matches the serverless shape while keeping expensive or long-running workers outside Vercel functions. Adapter conformance tests can be reused when vendors are implemented. Until both approvers accept this ADR, the repository uses in-memory adapters and the PostgreSQL CI service only.

## Approval record

| Role | Decision | Name | Date |
|---|---|---|---|
| Product owner | TODO(owner) | — | — |
| Engineering lead | TODO(engineering lead) | — | — |
