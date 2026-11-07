# Agent Contract

The owner-supplied specifications in `docs/product-specs/` are the source of truth.

> “Scope lock. Codex builds only what the current task names.” — Simulation Lab §10.3

> “Never push directly to `main`.” — Simulation Lab §10.3

> “No generated content reaches learners without the approvals in §9.” — Simulation Lab §10.2

Milestone work belongs on its named branch, never directly on `main`. Protected paths are listed in `CODEOWNERS` and checked by `pnpm guard:protected`.

## Simulation Lab

- Spec: `docs/product-specs/simulation-lab.md`
- Standards: `docs/sim-standards/`
- Scenario data lives in `packages/sim-content`; never hard-code scenarios in scenes.
- `sim-core` stays renderer-free and deterministic (same seed = same result).
- Every sim needs a non-3D accessible path before publication.
- Sims prepare; they never certify. Do not claim licensure or an OSHA card.
- Codex builds greybox geometry only; final art comes through the asset pipeline.
- Report frame rates only when measured on the GPU benchmark job.

## Anti-drift rules

- Build only the named milestone. Put extra ideas in the report, not the diff.
- Plan first for work larger than a bug fix.
- Do not edit protected files without owner-approved task scope.
- Add no dependency outside the milestone allowlist.
- Invent no content, partners, prices, statistics or properties. Fixtures say `FIXTURE — not real`.
- Report only checks actually run; mark unmeasured results `not verified`.
- Stop if a requirement is unclear or a change would weaken safety, privacy or approvals.

## Mandatory checks

Run `pnpm verify`, `pnpm test:e2e`, `pnpm audit --prod` and `pnpm guard:protected` before handoff. The individual simulation, claims, approval, determinism, secret, license and budget gates are defined in `package.json` and Simulation Lab §10.4.
