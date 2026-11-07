# Dependency Record — M0, M0.5 and database integration

Resolved from `registry.npmjs.org` on 2026-11-06. The eligibility cutoff was 2026-10-23T06:44:02Z. Versions are exact; TypeScript 6.0.3 is the newest eligible release compatible with `typescript-eslint` 8.72.0. Node release data came from `nodejs.org`.

## Toolchain

| Tool | Version | Release date | Purpose |
|---|---:|---|---|
| Node.js | 26.13.0 | 2026-10-28 | Current Active LTS runtime (`Lithium`) |
| pnpm | 12.15.0 | 2026-10-21 | Workspace package manager |

## Direct development dependencies

| Package | Version | Published (UTC) | License | Purpose | Used by |
|---|---:|---|---|---|---|
| `@axe-core/playwright` | 4.14.0 | 2026-10-15 | MPL-2.0 | Browser accessibility assertions | root tests; dev-only |
| `@electric-sql/pglite` | 0.5.11 | 2026-10-21 | Apache-2.0 | In-process PostgreSQL migration and RLS tests | root database tests; dev-only |
| `@eslint/js` | 10.0.1 | 2026-02-06 | MIT | ESLint base rules | root tooling; dev-only |
| `@playwright/test` | 1.64.1 | 2026-10-14 | Apache-2.0 | Browser and software-WebGL smoke tests | root tests; dev-only |
| `@types/node` | 26.6.5 | 2026-10-09 | MIT | Node type declarations | root tooling; dev-only |
| `@types/react` | 19.3.0 | 2026-09-09 | MIT | React type declarations | root and sim-player; dev-only |
| `@types/react-dom` | 19.3.0 | 2026-09-09 | MIT | React DOM type declarations | root and sim-player; dev-only |
| `@types/three` | 0.186.0 | 2026-09-11 | MIT | Three.js type declarations | root and sim-player; dev-only |
| `@vitejs/plugin-react` | 6.1.2 | 2026-10-05 | MIT | React compilation | root and sim-player; dev-only |
| `@vitest/coverage-v8` | 4.1.12 | 2026-10-15 | MIT | Unit-test coverage | root tooling; dev-only |
| `eslint` | 10.13.0 | 2026-10-16 | MIT | Static analysis | root tooling; dev-only |
| `eslint-plugin-react-hooks` | 7.1.1 | 2026-04-17 | MIT | React Hooks rules | root tooling; dev-only |
| `jsdom` | 30.1.3 | 2026-10-15 | MIT | DOM test environment | root tests; dev-only |
| `prettier` | 3.9.10 | 2026-10-10 | MIT | Deterministic formatting | root tooling; dev-only |
| `tsx` | 4.23.15 | 2026-09-20 | MIT | TypeScript command execution | root tooling; dev-only |
| `typescript` | 6.0.3 | 2026-04-16 | Apache-2.0 | Type checking | root tooling; dev-only |
| `typescript-eslint` | 8.72.0 | 2026-10-19 | MIT | TypeScript lint rules | root tooling; dev-only |
| `vite` | 8.3.5 | 2026-10-21 | MIT | Browser build and preview | root and sim-player; dev-only |
| `vitest` | 4.1.12 | 2026-10-15 | MIT | Unit and integration tests | root tooling; dev-only |

## Direct shipped and worker dependencies

| Package | Version | Published (UTC) | License | Purpose | Used by |
|---|---:|---|---|---|---|
| `react` | 19.1.10 | 2026-10-14 | MIT | Simulation shell UI | sim-player; browser runtime |
| `react-dom` | 19.1.10 | 2026-10-14 | MIT | Browser rendering | sim-player; browser runtime |
| `three` | 0.186.1 | 2026-09-24 | MIT | Empty 3D shell | sim-player; browser runtime |
| `@react-three/fiber` | 9.8.2 | 2026-10-14 | MIT | React renderer for Three.js | sim-player; browser runtime |
| `zod` | 4.6.7 | 2026-10-12 | MIT | Scenario, xAPI and credential-boundary schemas | sim-content, sim-assets, sim-xapi and credentials; runtime |
| `xstate` | 5.33.3 | 2026-10-17 | MIT | Renderer-independent state machine | sim-core; runtime |
| `@gltf-transform/core` | 4.5.1 | 2026-09-28 | MIT | glTF document boundary | asset worker; worker runtime |
| `@gltf-transform/functions` | 4.5.1 | 2026-09-28 | MIT | Approved future glTF transforms | asset worker; worker runtime |
| `meshoptimizer` | 1.3.0 | 2026-09-25 | MIT | Meshopt readiness | asset worker; worker runtime |
| `pg` | 8.23.1 | 2026-09-30 | MIT | PostgreSQL pool behind `DbClient` when `DATABASE_URL` is set | database package; server runtime |

`sharp` is removed with the owner-approved pnpm override required by Simulation Lab §7.6. The M0 worker does not resize or encode images.

## Verification record

- `pnpm deps:licenses:prod`: passed, 50 package versions.
- `pnpm deps:licenses:dev`: passed, 245 package versions.
- `pnpm audit --prod`: passed on 2026-11-07; 0 info, low, moderate, high or critical vulnerabilities across 65 reported production/optional dependencies.
- `docs/security/license-exceptions.md`: empty; no exception was used.
