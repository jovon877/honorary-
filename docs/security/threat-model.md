# M0.5 Threat Model

Status: pre-M1 engineering threat model. Owner and counsel review remain TODO(owner). Controls are sourced from Simulation Lab §§16–18 and Academy spec §§17–22; this document does not create new policy.

## Scope and trust boundaries

Protected assets are learner training records, private responses, enrollments, approval records, audit events, credential signing authority, credential evidence, session identity and private simulation assets. Housing/property data is a separate trust zone and is never joined to training data.

The principal boundaries are: browser to API; verified session to server authorization; API to PostgreSQL `app_rw`; commerce and credential-issuer service roles; API to private asset storage; issuer to KMS/HSM; and future administrative access to audit and publication actions.

## STRIDE analysis

| Category | Representative threat | M0.5 control | Residual or deferred work |
|---|---|---|---|
| Spoofing | A client posts xAPI as another learner or supplies its own roles. | Actor must equal the verified session subject; roles come from `IdentityProvider`; request identity is set server-side with parameterized `set_config`. | Auth0, Clerk and WorkOS conformance adapters are M0.6. |
| Spoofing | A fixture session reaches production. | The fixture provider throws for `prod` and `production`; exactly one configured provider is selected. | Deployment configuration and startup wiring are not in M0.5. |
| Tampering | Published course/scenario/objective content or a credential payload is edited. | PostgreSQL immutability triggers; versioned content; Ed25519 signatures; revocation-only credential mutation; exact content hashes in approvals. | Production keys must remain in KMS/HSM. |
| Tampering | Audit events are edited, deleted or reordered. | Append-only database trigger plus application hash-chain verification. | Alerting and external immutable retention are deployment work. |
| Repudiation | A publisher, reviewer or issuer denies a privileged action. | Actor identity, recent MFA, distinct human approvals and audit events are required by the policy surfaces. | M0.6 supplies the administrative action handlers and real identity adapters. |
| Information disclosure | Property/housing staff read learner records. | Explicit authorization deny wins; training RLS denies those roles; `app_rw` has no housing-schema grant. | Real-Postgres CI and penetration testing remain required. |
| Information disclosure | Credential verification exposes learner PII or allows enumeration. | Opaque credential IDs, equal malformed/unknown 404 responses, no email/birthdate/credential number, `no-store` response headers. | Owner review decides whether an opaque subject identifier is displayed by the future page. |
| Information disclosure | Sensitive data leaks to logs, audit metadata or future AI prompts. | Redaction utility; forbidden audit metadata keys; xAPI strict schema excludes free text; generation receives no learner records. | Production log pipeline and AI services are absent. |
| Information disclosure | Draft simulations or private assets are discovered. | Draft and missing simulations both return 404; assets use learner/object-scoped HMAC URLs with 5–15 minute policy and path traversal rejection. | Private bucket and secrets-manager adapters are deferred. |
| Denial of service | Oversized statements, unbounded schema data or request bursts exhaust API resources. | 16 KB xAPI cap, strict Zod schema, clock window, idempotency and token-bucket limits. | Distributed Redis enforcement is required before multi-instance production. |
| Elevation of privilege | An author self-approves or one person satisfies every publication gate. | Author cannot approve/publish own version; exact hash/version approvals; two distinct human approvers; recent MFA for privileged actions. | M0.6 admin handlers must call the same gates. |
| Elevation of privilege | The general app role writes purchases or issues credentials. | Separate `commerce_writer` and `credential_issuer` roles; RLS; app insert grants revoked; issuer requires approved linted definition and active signing key. | Verified commerce webhook and KMS signing implementations are deferred. |

## Verification and open assurance work

- Verified in M0.5: deterministic unit tests, PGlite integration tests, strict type/lint checks, claims/approval/protected-file gates, license checks, secret scan and production dependency audit.
- Not verified: real PostgreSQL container behavior in CI, multi-instance Redis limiting, KMS/HSM signing, production identity-provider MFA/session behavior, private object storage, external penetration test, GPU/device testing and counsel-approved retention/breach procedures.
- TODO(owner): review this model before M1 and assign external penetration testing before public launch, as required by Simulation Lab §17.
