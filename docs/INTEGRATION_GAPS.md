# Integration Gaps

Bootstrap inventory required by Simulation Lab §0A.
**Owner review: 2026-11-06.** Every row now has a decision (owner answers on regions, login and reviewer recorded 2026-11-06), a sequencing call, or a named open question. Rows marked **OWNER DECISION** stay open until the owner answers; Codex keeps those items provisional.

| # | Item | Status | Decision / direction | Who decides | Blocks | What unblocks it |
|---|---|---|---|---|---|---|
| 1 | `apps/learning` | missing (scheduled) | **Build it, don't wait for it.** Add milestone **M0.6: Learning host MVP**, covering course dashboard, lesson page, embedded `<SimPlayer>`, progress and completion per Academy spec §32. The standalone sim-player is enough for M0–M0.5. | Engineering lead | M1 sign-off only | M0.6 |
| 2 | `apps/admin` | missing (scheduled) | **Build a minimal admin** in **M0.6**: review queue, approval recording (calls `canPublishScenario`), publish with step-up MFA, audit viewer. The full console from Academy spec §33 comes later. | Engineering lead | Publishing any real scenario | M0.6 |
| 3 | LRS | resolved | **In-house LRS of record.** `training.xapi_statements` in Postgres, behind the M0.5 ingest endpoint (strict schema, RLS, idempotency). An external LRS is optional later, as an export target for institutional clients. Swap the in-memory adapter for the Postgres adapter in M0.5. | Data engineer (approved by owner) | — | M0.5 |
| 4 | Authentication | resolved (owner 2026-11-06: "all") | **Multi-provider by design.** Codex builds one `IdentityProvider` interface (OIDC) with three adapters: **Auth0, Clerk and WorkOS**. The provider is selected per environment by config, and **only one is active per environment**. Each adapter must pass the same conformance tests: MFA enforced, passkey/TOTP, step-up within 15 minutes, HttpOnly session cookies, role claims mapped server-side only, logout and revocation. WorkOS is intended for institutional SSO (colleges, employers, workforce boards). The fixture provider stays for tests only and must not be enabled in production. | Owner (approved) | — | M0.5 interface; adapters in M0.6 |
| 5 | Design palette | resolved | **`academy-light` is the default.** It comes from the official logo supplied 2026-11-06 (spec §19). Approved values are in the table below. `living-ledger` stays non-default and provisional. | Owner (approved via logo) | — | Apply tokens + contrast test |
| 6 | Master Build §7 source | resolved | Supplied with this update: `HONORARY_HOMES_CLAUDE_CODE_MASTER_BUILD.md`. Copy it verbatim into `docs/product-specs/`. Its §7 palette now only feeds the non-default `living-ledger` file. | Owner | — | File attached |
| 7 | Endorsement wording | **OWNER DECISION** (legal) | Keep `SISTER TO GRIEFYARD WORKS` as the configured value. It depends on the sister-structure choice (Option A/B/C in the Oct 2026 redesign), which needs counsel. Not approved for public launch yet. | Owner + counsel | Public launch only | Structure chosen with counsel |
| 8 | Active regions | resolved (owner 2026-11-06: all six) | **Active in the Academy: Vermont, Maine, Baltimore (MD), St. Louis (MO), Cleveland (OH), Detroit (MI).** Each gets a region config: jurisdiction code notes, disclaimers, state apprenticeship agency, and lead-safe/RRP authority (EPA or authorized state program). Environments: ENV-NE-01 (VT/ME), ENV-RH-01 (Baltimore), and **ENV-MW-01 (STL/CLE/DET) is now in scope** for M5. **Guardrail (blueprint):** "active" means learners in that region can take courses and see region-specific content. It does **not** let the site claim an office, staff, license or partner there. Per the blueprint, a location is presented as a partnership hub until staffing, licenses, insurance and agreements are verified, and partner names appear only after signed agreements. | Owner (approved) | — | Region configs (M0.5 schema, content per milestone) |
| 9 | Real 3D assets | missing (expected) | Greybox is approved through M2. Final art for ENV-NE-01 and ENV-SHOP-01 is needed before M1 learner testing. Source it from a contracted technical artist, a licensed asset library (license check per §7.6 applies to assets too), or both. Asset license metadata goes into the asset manifest. | Owner (budget) + technical art | M1 usability test | Artist or library chosen |
| 10 | GPU benchmark runner | missing (expected) | Static budgets plus the software-WebGL smoke test are enough through M1. Before M2, add a GPU CI runner or device-lab service, with one integrated-GPU laptop profile and one mid-range Android profile. | Engineering lead (budget: owner) | Frame-rate claims | Runner provisioned |
| 11 | Course objective registry | missing (scheduled) | Codex builds the **registry schema** (`academy.learning_objectives`, versioned, Bloom level, linked to `course_versions`) in M0.5. Objectives themselves are **drafted by curriculum staff**. AI drafts are allowed only through the generation pipeline, marked draft, and approved by the curriculum owner. Codex must not write objective text. First set needed: Construction Safety (for SIM-110). | Curriculum owner | M1 publish | Objectives drafted and approved |
| 12 | Human reviewer identities | open (owner is recruiting) | Owner holds every seat until it is filled (spec §15). **Publishing needs at least two distinct human approvers, and authors can't approve their own work, so a single person cannot publish.** The owner is recruiting the second reviewer, who must be a **qualified trade/safety reviewer** (licensed contractor or safety professional, employee or contracted). Until then, all scenarios stay draft or in_review. Development and greybox work continue unaffected. Reviewer accounts are created through the identity provider with MFA. | Owner | Publishing any real scenario | Second qualified reviewer named |
| 13 | Retention periods | **OWNER DECISION** (legal) | Proposed in spec §16: xAPI 3 years, attempts life of account + 3 years, credentials permanent (with revocation record), audit 7 years. Confirm with counsel. | Owner + counsel | Public launch | Counsel review |
| 14 | Accreditations (OSHA Outreach, EPA RRP, NCCER, RA sponsor) | missing (expected) | System blocks delivery claims until verified records exist (spec §18). Pursue in order of program need: EPA RRP (lead-safe work on pre-1978 Vacant Bone housing), then Registered Apprenticeship sponsor per active state, then OSHA Outreach trainers, then NCCER. | Owner + compliance lead | "Delivered by Honorary Homes" credentials only | Records verified by compliance |
| 15 | Certificate wording | provisional | Draft disclaimers are seeded in `credentials.definitions` (status `draft`). Compliance and counsel approve before any credential is issued. | Compliance lead + counsel | Issuing credentials | Wording approved |

## Approved `academy-light` token values (from the official logo)

| Token | Value | Contrast on white / ivory | Allowed use |
|---|---|---|---|
| `color.canvas` | `#FFFFFF` | — | Page background |
| `color.surface.ivory` | `#FAF7F0` | — | Section fields, cards |
| `color.text.primary` (obsidian) | `#141414` | 18.4 / 17.2 | All body and heading text |
| `color.text.secondary` | `#5F5F5F` | 6.4 / 6.0 | Metadata, captions |
| `color.gold.mark` | `#BCAC84` | 2.2 / 2.1 | Logo, thin rules, decorative lines **only**. Never for text or meaningful UI |
| `color.gold.ui` | `#A38D59` | 3.2 / 3.0 | Non-text indicators (progress fill, selected rule), always paired with a non-color cue |
| `color.gold.text` | `#806F46` | 4.9 / 4.6 | Gold text when needed (labels, course codes) |
| `color.focus` | `#141414` 2px outline + 2px white offset | 18.4 | Focus rings. Gold is never the only focus cue |

`#BCAC84` was sampled from the supplied logo. `#A38D59` and `#806F46` are the same hue, darkened to meet WCAG 3:1 and 4.5:1. CI contrast test: fail if any `text.*` token is below 4.5:1, or `gold.ui` below 3:1, on both `canvas` and `surface.ivory`.

## Milestone sequence after this review

M0 (finish) → **M0.5** (back end, security, credentials, LRS, objective registry schema) → **M0.6** (learning host + minimal admin) → M1 (SIM-110 end to end, greybox → final art) → M2 …
