# ADR 0001: M0 Bootstrap Boundaries

- Status: Accepted for M0
- Date: 2026-11-06

## Context

The Academy host, identity provider and LRS do not exist in this repository.

## Decision

Apply the boundaries required by Simulation Lab §0A: the sim player runs standalone, receives learner identity through context, and writes xAPI through an injected in-memory `LrsClient`. No production endpoint is present.

## Consequences

M0 can verify deterministic integration contracts without implying that production integrations exist. The missing services remain listed in `docs/INTEGRATION_GAPS.md`.
