# Architecture

This bootstrap uses the Academy monorepo layout (Academy spec §3; Simulation Lab §0A and §7.1).

- `apps/sim-player`: standalone empty web simulation shell and future learning-player embed.
- `packages/sim-core`: renderer-independent state, deterministic randomization, scoring and replay.
- `packages/sim-content`: scenario schemas, objective mapping and publication gates.
- `packages/sim-xapi`: xAPI builders and swappable LRS boundary.
- `packages/sim-assets`: asset-manifest budgets.
- `packages/sim-ui`: shared simulation UI contracts.
- `workers/sim-asset-pipeline`: glTF validation and optimization boundary.

Missing upstream applications and services remain explicit in `docs/INTEGRATION_GAPS.md`.
