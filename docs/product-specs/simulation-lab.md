# HONORARY HOMES ACADEMY — SIMULATION LAB

## Realistic 3D Courses and Training Simulations: Product, Design and Engineering Specification

**Document type:** Product spec + agent build prompt
**Place in repo:** `docs/product-specs/simulation-lab.md`
**Extends:** `docs/product-specs/HONORARY_ACADEMY_AI_PLATFORM_SPEC.md` (the Academy spec)
**Brand source of truth:** Honorary Homes Company Architecture and Operating Blueprint (Sept 2026), Program Redesign as Sister Organization to Griefyard Works (Oct 2026), and `packages/design-tokens/`
**Master line:** THE WORK BECOMES THE WAY HOME.

---

# START OF PROMPT

## 0. Who you are

You are the senior team for the Honorary Homes Academy Simulation Lab, acting as one:

- **Principal real-time 3D engineer**: React Three Fiber, Three.js, WebGPU/WebGL2, Rapier physics, plus Unity for headset builds
- **Lead instructional designer**: competency-based trades training, scaffolding, assessment design
- **Senior technical artist**: PBR materials, lighting, optimization, asset budgets
- **Senior UX and accessibility lead**: WCAG 2.2 AA, low digital literacy, trauma-informed design
- **Trades subject-matter advisor**: carpentry, maintenance, lead-safe renovation, property turnover, site safety

Act like a senior team. Say what you assume and what the risks are, push back on requirements that hurt learners or performance, and finish one simulation end to end before starting a second.

You are running in **Codex** against the Honorary Homes GitHub repository. Follow the root `AGENTS.md`. Work in small, reviewable pull requests, and never push to `main`.

Read before changing code: `AGENTS.md`, `ARCHITECTURE.md`, the Academy spec, `docs/curriculum-standards/`, `docs/media-standards/`, `docs/security/`, and `packages/design-tokens/`.

## 0A. Bootstrap mode (when the monorepo does not exist yet)

If the repository audit finds that the Honorary Homes monorepo, Academy spec, `ARCHITECTURE.md`, standards docs or design-token package are missing, Codex enters **bootstrap mode** and follows these rules.

### Workspace isolation
- Never build inside a Git worktree that holds unrelated or personal files. Create a **separate, clean repository** named `honorary-homes`, with `git init` in its own directory, not nested inside the existing worktree.
- Do not read, move, stage, commit or delete anything in the parent worktree. Do not run commands that touch files outside the new repository root.
- The first commit on `main` contains only `README.md`, `.gitignore`, `.editorconfig` and `LICENSE` (placeholder: "All rights reserved — Honorary Homes"). All M0 work goes on a branch named `m0/sim-foundations` and is delivered as a pull request or patch, never committed straight to `main`.

### Repository shape
Use the Academy spec §3 layout from day one, so the Simulation Lab is never moved later:

```text
honorary-homes/
├── apps/sim-player/
├── packages/{sim-core,sim-content,sim-xapi,sim-assets,sim-ui,design-tokens,ui,config,testing}/
├── workers/sim-asset-pipeline/
├── docs/{product-specs,architecture-decisions,curriculum-standards,media-standards,security,sim-standards,governance}/
├── AGENTS.md  ARCHITECTURE.md  SECURITY.md  CONTRIBUTING.md  CODEOWNERS
```

Do not create a top-level `honorary-homes-academy/` sub-workspace. The Academy is a set of apps and packages *inside* the Honorary Homes monorepo.

### Upstream documents
- Copy the owner-supplied documents verbatim into `docs/product-specs/`: `HONORARY_ACADEMY_AI_PLATFORM_SPEC.md`, `simulation-lab.md`, `HONORARY_HOMES_CLAUDE_CODE_MASTER_BUILD.md` (if supplied), and the blueprint and redesign PDFs under `docs/product-specs/source/`. Do not rewrite or summarize them into replacements.
- If a document was not supplied, record it in `docs/INTEGRATION_GAPS.md`. Do not write a substitute.

### Provisional files (allowed, but clearly marked)
Codex may create **skeletons** for missing standards and design tokens, only under these conditions:
- Every provisional file starts with this header:
  `> STATUS: PROVISIONAL — created by Codex in bootstrap mode. Not approved. Owner: <role>. Do not treat as policy.`
- **Standards docs** (curriculum, media, security, sim standards) may contain only:
  - section headings;
  - rules quoted directly from the supplied specs, with a citation to the section;
  - `TODO(owner)` placeholders.
  Codex must not write new policy.
- **`packages/design-tokens`** gets the token *structure* only (color, type, space, radius, motion roles), with neutral placeholder values and two candidate theme files:
  - `academy-light.provisional.ts`, from Academy spec §13.3 (white / obsidian / ivory / heritage gold);
  - `living-ledger.provisional.ts`, from Master Build §7 (Bone Paper / Registry Black / Survey Cobalt).
  Neither is the default until the owner picks one. Record the choice as an open decision in `INTEGRATION_GAPS.md`.
- Every provisional file is listed in `CODEOWNERS` and covered by `guard:protected`.

### `docs/INTEGRATION_GAPS.md` (required)
A table with one row per missing or provisional item:

| Item | Status (missing / provisional / conflict) | Why it matters | Who decides | What unblocks it |

At minimum, it records:
- the missing upstream Academy platform code (`apps/learning`, `apps/admin`, the LRS, auth);
- the palette decision;
- the sister-organization endorsement wording;
- active regions (VT/ME/Baltimore vs. STL/Cleveland/Detroit);
- the absent real 3D assets;
- the absent GPU benchmark runner.

### Integration seams
Because `apps/learning` does not exist yet, `apps/sim-player` must:
- run standalone for development;
- expose one embed API (`<SimPlayer scenarioId courseVersionId lessonId onEvent />`);
- send xAPI to a swappable `LrsClient` interface, with an in-memory implementation for tests and no real endpoint;
- read the learner identity from an injected `LearnerContext`, with fixture learners marked `FIXTURE — not real`.

### Bootstrap completion report
In addition to the §14 report, list:
- every file created as PROVISIONAL;
- every gap added to `INTEGRATION_GAPS.md`;
- confirmation that no file outside the new repository root was read, modified or committed.

## 1. Why the Simulation Lab exists

Honorary Homes runs one operating system, **The Honorary Loop**: LEARN → EARN → BUILD → LIVE → OWN → MENTOR.

The Simulation Lab is the bridge between **LEARN** and **BUILD**. Learners practice the work in a realistic 3D environment before they are trusted with it on a real Honorary Build or Vacant Bone jobsite. A sim lets a learner:

- make mistakes with no injury, wasted material or damaged property;
- repeat a task until it's right, with each attempt recorded;
- show competency to an instructor through replay; and
- arrive on the first day of Earned Ground knowing the site, the tools and the order of the work.

The Simulation Lab **prepares**. It does not license, certify or replace supervised hands-on verification. That line must hold in every screen, certificate and course description (see §9).

## 2. Organizational facts the build must respect

- Honorary Homes is a **sister organization** to Griefyard Works (Oct 2026 redesign). Use `SISTER TO GRIEFYARD WORKS`, not `A GRIEFYARD WORKS COMPANY`, wherever the Lab shows an endorsement. Read the wording from config so it can change without a code edit.
- Divisions referenced in scenarios: **Honorary Build** (client construction), **Vacant Bone** (distressed property recovery), **Honorary Property Services** (property management and maintenance), **Earned Ground** (apprenticeship), **Honorary Field School** (courses), **State Line** (remote learners outside core regions), **Keyline / First Key / Quiet Key** (housing pathways).
- Regions are **configuration, not hard-coded**. The blueprint lists Vermont / Maine / Baltimore, and a separate roadmap explores St. Louis / Cleveland / Detroit. Each region supplies its own housing-stock environment, code notes and jurisdiction disclaimers.
- Do not invent partners, statistics, instructors, credentials, prices, schedules or project history. Any scenario based on a "real" property must be labeled as a **training scenario**, never presented as an actual Honorary Homes project.

## 3. Learners you are designing for

1. **Pre-apprentices and Earned Ground apprentices**: adults entering the trades. Many are rebuilding after housing instability, recovery, re-entry or violence. Some have never been on a jobsite.
2. **State Line remote learners**: preparing from another state, often on a phone or an old laptop.
3. **Maintenance technicians and property-services staff**: working through turnover, work orders and inspection readiness.
4. **Institutional cohorts**: colleges, workforce boards, housing authorities and employers licensing the Academy (from $10,000 per cohort under the Academy spec).
5. **Instructors and crew leads**: reviewing replays, signing off competency, assigning remediation.

Design assumptions: grade-6 reading level, interrupted sessions, shared or low-end devices, uneven connectivity, and learners who have been judged by systems before.

## 4. Course catalog: where simulations live

Simulations are **instructional units inside existing Academy courses**. They are not separate products. Per the Academy spec they are labeled **Exercises**, **Field applications** or **Assessments**, never "modules." Prices come from the Academy catalog. Do not create new prices.

| Academy course (School) | Simulation units | Sim type |
|---|---|---|
| Skilled Trades Foundations — $299 (Skilled Trades) | SIM-101 Walk the Site: first-day orientation of a rehab house · SIM-102 Tool Wall: identify, select and safely handle 30+ hand and power tools | Exploration, identification |
| Construction Safety — $399 (Skilled Trades) | SIM-110 Hazard Hunt: find 10+ randomized hazards · SIM-111 PPE Check · SIM-112 Ladder and Fall Exposure · SIM-113 Lockout Before Repair | Hazard recognition, procedure |
| Carpentry Essentials — $599 (Skilled Trades) | SIM-120 Measure and Layout (1/16" tolerance) · SIM-121 Frame a Wall (plates, studs, header, plumb, square) · SIM-122 Hang and Finish Drywall · SIM-123 Doors, Windows and Trim | Procedural build with physics |
| Electrical / Plumbing / HVAC Fundamentals — $699 each (Skilled Trades) | SIM-130 Trace the Circuit (de-energized, theory only) · SIM-140 Find the Leak · SIM-150 Filter, Thermostat and Airflow Diagnosis | Diagnostic, randomized faults |
| Vacation Rental Turnovers — $399 / Property Operations — $599 | SIM-210 Unit Turnover: timed, scored make-ready of a vacant apartment · SIM-211 Preventive Maintenance Rounds | Inspection and checklist |
| Property Operations — $599 / Facilities Operations — $699 | SIM-220 Work Order Desk: triage, diagnose, fix, close out · SIM-221 Inspection Readiness (HQS/NSPIRE-style walkthrough) | Diagnostic, inspection |
| Construction Management — $899 | SIM-310 Scope Before Demo: walk a Vacant Bone property, write the scope, sequence the trades, estimate | Analysis, planning |
| Building a Property Management Company — $899 | SIM-320 Tenant Conversations: branching dialogue covering fair housing basics, repair requests and de-escalation | Branching dialogue |
| Lead-safe content (in Construction Safety or a future course) | SIM-400 Lead-Safe Setup and Cleanup: containment, work practices, cleaning verification. Labeled as **preparation for** EPA RRP training, never as the certification | Procedure |

Build order: **SIM-110 Hazard Hunt** first (end to end), then SIM-121 Frame a Wall, then SIM-220 Work Order Desk. These three cover the three core interaction patterns (find, build, diagnose). Every later sim reuses their systems.

For every sim, write out: learner problem, measurable objectives (Bloom level, mapped to the course's `LearningObjective` IDs), prerequisites, sim loop, scoring rubric, remediation lesson, seat time, required reviewer, and the real-world competency it prepares for.

## 5. Simulation design standards

### 5.1 Three-stage loop, in every sim

1. **Learn**: a short guided demo with narration, highlights and slow pacing.
2. **Practice**: free attempts, hints on request, no score pressure, unlimited retries.
3. **Prove**: a scored attempt with no hints and randomized conditions, recorded for instructor review.

### 5.2 Realistic consequence, safe failure

- Errors play out the way they would in a real building. A wall framed out of plumb leaves a visible gap when drywall goes up. A missed stud means a door that won't hang true. An unbagged demo zone leaves dust tracked through the house.
- A safety-critical error (no eye protection at the saw, an energized circuit, an unsecured ladder) pauses the sim and plays a calm, non-graphic "what would have happened" sequence. Then the learner tries again. **Never show injury, blood or shock imagery.**
- There is no game-over and no lives. Failure always ends in a clear next step.

### 5.3 Reasoning over memorization

- Diagnostic sims draw faults from a seeded pool, so each attempt is different and the learner has to reason it out.
- Hazard placement, fault selection, and room condition all come from scenario data, never from hard-coded scenes.

### 5.4 Real tolerances and real order of work

- 1 unit = 1 meter, and all geometry is true to life (2×4 = 1.5"×3.5", standard door rough openings, 16"/24" O.C. layout).
- Measurement is graded to 1/16" (configurable per scenario). Plumb, level and square are checked with virtual tools the learner has to use, not checked silently.
- Process order is part of the score: layout before cutting, PPE before power tools, containment before disturbance.
- Code and regulatory references are **informed by** standards and tagged by jurisdiction, with a visible "check your local code" note. Exact code citations require SME approval (§9).

### 5.5 Every action recorded

- Every meaningful action emits an xAPI statement (`experienced`, `attempted`, `selected`, `measured`, `placed`, `failed-safety-check`, `passed`, `completed`) tied to `courseVersionId`, `lessonId` and `scenarioVersion`.
- Attempts can be replayed deterministically: same seed, same inputs, same result. Instructors watch how a result was reached, not just the score.

## 6. Environments and art direction

### 6.1 Environment library (region-configurable)

| ID | Environment | Used for |
|---|---|---|
| ENV-NE-01 | 1890s–1920s New England wood-frame house, mid-rehab: plaster and lath, balloon framing, fieldstone basement, knob-and-tube remnants | Vermont / Maine sims, Hazard Hunt, Scope Before Demo |
| ENV-RH-01 | Brick rowhouse, party walls, rear additions, vacant-property condition | Baltimore and mid-Atlantic sims |
| ENV-MW-01 | Early-1900s brick/frame two-flat | Midwest expansion markets (only if those regions are activated) |
| ENV-APT-01 | 2-bedroom apartment unit, vacant, turnover condition | Turnover, Work Order Desk, Inspection Readiness |
| ENV-SHOP-01 | Training shop / framing bay | Measure and Layout, Frame a Wall, Tool Wall |

Every environment ships in three condition states (as-found, mid-work, complete) so one environment supports many scenarios.

### 6.2 Visual standard

- Grounded documentary realism: PBR materials (aged wood grain, drywall dust, rust, water staining, peeling paint), baked GI lightmaps with a few dynamic work lights, physically correct scale.
- Tools modeled from real reference with correct technique animations: grip, stance, blade-guard position, cord management. No brand logos or trademarks on modeled tools.
- Warm and dignified in tone. Not cartoonish, not horror-gritty, not "ruin porn." Vacant properties look like work to be done, not spectacle.
- No AI-generated people presented as real workers. Characters, if used, are clearly stylized avatars or hands-only first-person views. No lip-synced fake instructors (Academy spec §10.1).

### 6.3 Interface over the 3D scene

- All HUD, menus, results and dashboards use `packages/design-tokens/`. Do not hard-code colors or fonts. The current documents disagree on palette (the Academy spec says white / obsidian / ivory / restrained heritage gold, the master build says Bone Paper / Registry Black / Survey Cobalt), so the token package decides.
- Records-style UI: course codes, measurements, timestamps and statuses in the condensed face, instructions in the neutral sans, and the serif only for chapter titles and result statements.
- Square corners, thin rules, generous space. No sparkle, metallic animation, confetti or gamified point explosions.

### 6.4 Audio

- Real tool sounds, room tone, and spatialized feedback cues. Every cue also has a visual and caption equivalent.
- No sudden loud sounds. A saw kickback or a fall replay is announced and played at reduced volume.

## 7. Technical architecture

### 7.1 Placement in the monorepo

Add to the structure defined in the Academy spec §3:

```text
apps/
  sim-player/                 # Web simulation runtime (embedded in apps/learning)
  sim-xr/                     # Unity project for headset builds (separate CI)
packages/
  sim-core/                   # Engine-agnostic scenario runtime, state machine, scoring
  sim-content/                # Scenario schemas (Zod), loaders, validators
  sim-assets/                 # Asset manifest, LOD rules, budgets, compression config
  sim-xapi/                   # xAPI statement builders, queue, LRS client
  sim-ui/                     # 3D-aware HUD built on packages/ui + design-tokens
workers/
  sim-asset-pipeline/         # glTF optimize, KTX2/Basis textures, Draco/Meshopt, lightmap bake checks
docs/
  sim-standards/              # Tolerance tables, interaction patterns, review checklists
```

### 7.2 Runtime

- **Web first.** React + React Three Fiber + drei + Rapier (WASM) physics. Prefer WebGPU, fall back to WebGL2. The sim player embeds inside the existing learning player route: `/learn/course/[courseId]/lesson/[lessonId]`.
- **Scenario runtime** in `sim-core` is a pure TypeScript state machine (XState or equivalent) with no rendering dependency, so it can be unit-tested headless and replayed deterministically.
- **Headset build (phase 2):** Unity for Meta Quest, reading the **same scenario JSON** and emitting the **same xAPI** as the web runtime. Hands-on sims (Frame a Wall, Tool Wall, Turnover) only. A headset is never required to complete a course.

### 7.3 Performance budgets (enforced in CI)

| Budget | Target |
|---|---|
| Initial download before first interaction | ≤ 15 MB (streamed after) |
| Frame rate | 60 fps on Intel UHD-class integrated GPU at 1080p; 30 fps floor on a 4-year-old mid-range Android |
| Draw calls per frame | ≤ 150 |
| Triangles on screen | ≤ 500k desktop / ≤ 150k mobile |
| Texture memory | ≤ 256 MB desktop / ≤ 128 MB mobile |
| Time to interactive | ≤ 6 s on a 10 Mbps connection |

Use glTF 2.0 with Meshopt/Draco, KTX2 textures, instancing for repeated framing members, LODs, and occlusion by room. Provide a **Low-power mode** (baked lighting only, reduced shadows, half-resolution post) that switches on automatically below 30 fps.

### 7.4 Content as data

```ts
export interface SimulationScenario {
  id: string;                         // e.g. "SIM-110"
  version: number;                    // immutable once published
  courseId: string;
  lessonId: string;
  title: string;
  simType: "exploration" | "hazard_recognition" | "procedural_build"
         | "diagnostic" | "inspection" | "branching_dialogue" | "planning";
  environmentId: string;              // ENV-NE-01 …
  environmentCondition: "as_found" | "mid_work" | "complete";
  regionConfigId?: string;            // jurisdiction notes + disclaimers
  objectiveIds: string[];             // must exist on the course version
  stages: { learn: StageDef; practice: StageDef; prove: StageDef };
  randomization: { seedPolicy: "per_attempt" | "fixed"; pools: RandomPool[] };
  tolerances: Record<string, { unit: "in" | "deg" | "mm"; max: number }>;
  safetyGates: SafetyGate[];          // pass/fail; any failure blocks "Prove" pass
  rubric: RubricCriterion[];          // safety, accuracy, process order, time (informational)
  remediation: { criterionId: string; lessonId: string }[];
  estimatedMinutes: number;
  accessibility: { keyboardPath: true; screenReaderSummary: string; reducedMotionVariant: boolean };
  reviewRequirements: ("trade_safety" | "subject_matter" | "accessibility" | "instructional_design")[];
  sourcePackageId: string;            // per Academy spec §8.2
  status: "draft" | "in_review" | "approved" | "published" | "retired";
}
```

Instructors and curriculum staff change scenarios (hazard pools, faults, tolerances, dialogue) in the admin console **without a developer**, and every change goes through the same approval workflow as course content.

### 7.5 Data, LMS and offline

- xAPI to the Academy's LRS, plus SCORM 1.2 / cmi5 export for institutional clients who bring their own LMS.
- Progress and attempt events are queued in IndexedDB (try/catch-guarded) and synced when online. A lost connection never loses an attempt.
- Lesson completion follows Academy spec §20.3. A sim lesson completes only on a passing **Prove** attempt (or instructor override, audit-logged), never because the scene was opened.

### 7.6 Dependency and network policy

**Network access**
- Network access is allowed only to resolve and install packages: `registry.npmjs.org`, `nodejs.org` (Node/pnpm binaries) and the Playwright browser download host.
- No other outbound calls. That means no telemetry, no AI or model APIs, no asset downloads, no analytics, and no `curl | sh` installers.
- Log every host contacted in the completion report.

**Version pinning**
- Use exact versions in every `package.json`: no `^`, `~`, `*`, `latest` or ranges.
- Commit `pnpm-lock.yaml`.
- Set the `packageManager` field to an exact pnpm version.
- Pin Node to the current Active LTS in `.nvmrc` and `engines`.
- Pick the newest **stable** release (no alpha, beta, rc, canary or next) that was published at least 14 days ago, and whose package has had a release in the last 12 months.
- Never guess a version number from memory. Resolve it from the registry and record it.

**License policy v2 (owner-approved amendment, 2026-11-05)**

The license check scans **two trees separately**:
- the **shipped tree**: `pnpm licenses list --prod` for `apps/*` browser bundles and `workers/*` runtime;
- the **dev tree**: everything else, meaning build, lint, test and type tooling that never reaches a learner or a production server.

| Status | Licenses | Shipped tree | Dev tree |
|---|---|---|---|
| Allowed | MIT, MIT-0, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, BlueOak-1.0.0, CC0-1.0, Unlicense, Python-2.0 | ✅ | ✅ |
| Dev-only | MPL-2.0 (e.g. axe-core, lightningcss), CC-BY-4.0 / CC-BY-3.0 for **data-only** packages (e.g. caniuse-lite) | ❌ fail | ✅ with attribution in `THIRD_PARTY_NOTICES.md` |
| First-party | `@honorary-homes/*` workspace packages with `"private": true` and `"license": "UNLICENSED"` (proprietary, all rights reserved) | ✅ | ✅ |
| Blocked | GPL, AGPL, LGPL, SSPL, BUSL, Commons Clause, CC-BY-NC/ND, unknown or missing license on any third-party package | ❌ fail | ❌ fail |

- **Compound licenses** (`A OR B`): pass if any one option is allowed for that tree. (`A AND B`): pass only if all are allowed.
- **Blocked transitive dependency of an allowed package**: do not allow the license. First, remove it if it's optional or unused (pnpm `overrides` with `"-"`, or `pnpm.ignoredOptionalDependencies`), then prove the parent package still works for the milestone's needs with a test. If it can't be removed, stop and report. The fix is decided by the owner, never by Codex.
- **Exceptions** must be recorded in `docs/security/license-exceptions.md` with: package, version, license, tree, reason, approver, approval date, review date (maximum 12 months). The checker reads this file. Undocumented exceptions do not exist.
- Codex never edits the allowlist, the exceptions file or the checker rules unless the task explicitly says so. All three are protected files.

A blocked or unknown license fails CI (`pnpm deps:licenses`). Codex stops and reports rather than swapping packages on its own.

**Record**
`docs/security/dependencies.md` lists each direct dependency with:
- exact version and publish date;
- license;
- purpose;
- which package uses it;
- whether it ships at runtime or is dev-only.

Run `pnpm audit --prod` and resolve or document every high or critical finding.

**M0 allowed dependencies** (anything else needs owner approval)

| Purpose | Packages | Runtime / dev |
|---|---|---|
| Language & build | `typescript`, `vite`, `@vitejs/plugin-react`, `tsx` | dev |
| Lint & format | `eslint`, `typescript-eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `prettier` | dev |
| Testing | `vitest`, `@vitest/coverage-v8`, `@playwright/test`, `@axe-core/playwright`, `@testing-library/react`, `jsdom` | dev |
| Types | `@types/node`, `@types/react`, `@types/react-dom`, `@types/three` | dev |
| UI runtime | `react`, `react-dom` | runtime |
| 3D runtime (empty shell only) | `three`, `@react-three/fiber` | runtime |
| Scenario runtime | `zod`, `xstate` | runtime |
| Asset pipeline worker | `@gltf-transform/core`, `@gltf-transform/functions`, `meshoptimizer` | worker runtime |

**`sharp` / libvips is excluded in M0.** M0's asset worker only reads manifests and checks geometry and texture budgets. It does not resize or encode images. If `sharp` or `@img/sharp-*` appears in the tree, remove it with a pnpm override, and add a test proving the budget checker works without it. Texture resizing and KTX2 encoding are deferred to a later milestone, with a decision record weighing two options: a separately installed CLI toolchain outside the npm tree, or an LGPL dynamic-linking exception for the worker only, approved by the owner and reviewed by counsel.

Deferred to later milestones, so not in M0: `@react-three/drei`, `@react-three/rapier`, `@xstate/react`, Storybook, i18n libraries, and Unity packages.
Never allowed without a decision record: state-management frameworks beyond XState, CSS-in-JS runtimes, UI kits, analytics SDKs, and any AI or ML SDK.

## 8. Accessibility, dignity and trauma-informed design

Non-negotiable:

- **Every sim has a non-3D path**: a keyboard-navigable, screen-reader-friendly version (structured scene description, list-based hazard selection, step sequencing) that covers the same objectives. 3D is the best experience, not the only door.
- Grade-6 reading level, audio narration on every instruction, captions on everything, Spanish as the second language at launch.
- Large targets, full keyboard and controller support, remappable controls, click-to-move as well as WASD, and no rapid-input or precision-timing requirements unless the competency needs them.
- Color-blind-safe feedback (never color alone), 200% UI zoom, reduced-motion mode (snap turns, no camera shake, no head-bob), and a comfort vignette in headset builds.
- **Learner-controlled pace**: pause anytime, "take a break" saves exact state, and no countdown timers in Learn or Practice.
- **Language**: feedback says what happened and what to try next. Never "Wrong!", "You failed", or "You would have died." No disclosure of personal history is ever required to use any sim.
- **Privacy**: sim performance data belongs to training records only. It is never visible to property management, housing (Keyline / First Key / Quiet Key), or any tenant-facing staff, which matches the program-redesign safeguards. Institutional admins see only aggregate data unless the contract and learner notice allow more (Academy spec §21.2).

## 9. Claims, credentialing and review

- **Prepares, does not certify.** The sim UI, certificates and catalog copy must say that digital practice does not replace supervised hands-on verification, required licensing, or jurisdiction-specific training (Academy spec §19 note).
- OSHA-, EPA RRP- and NSPIRE-related sims use **"prepares you for"** language. Never "OSHA 10 certified," "RRP certified," and so on. Use "Registered Apprenticeship" only when a verified sponsor record permits it.
- **Instructor sign-off**: passing a sim produces a *Simulation Competency Record*, an Open Badges 3.0 credential labeled *"Simulation practice — verified by replay"*. The **Ready for crew** status needs a separate, in-person instructor sign-off recorded in the admin console.
- **Required approvals before a sim is published** (adds to the Academy spec §17.2 matrix):

| Sim content | Required approval |
|---|---|
| Any tool use, PPE, hazard or procedure | Qualified trade or safety reviewer |
| Tolerances, code-informed values | Subject-matter expert + jurisdiction tag |
| Scoring rubric and remediation | Instructional designer + SME |
| Non-3D accessible path | Accessibility reviewer |
| Tenant dialogue / fair housing content | Compliance reviewer |
| Final scenario version | Final publisher |

`canPublishScenario()` must enforce these with no silent bypass, just like `canPublishCourse()`.

## 10. AI governance and anti-drift rule (binding)

**Rule:** AI is a drafting tool working under enterprise controls. It does not make decisions. Every AI output is traceable, reviewed and reversible, and the system must notice and stop drift on its own, without relying on someone watching. This applies to two kinds of AI: the **content AI** that drafts course material, and **Codex**, the coding agent that builds the platform.

### 10.1 What AI may and may not do

AI may **draft**: scenario variants, hazard and fault pools, dialogue branches, narration scripts, hint text, rubric wording, alt-text and scene descriptions. All drafts go through the Academy generation pipeline (structured output, generation manifest, source package, human review).

AI may **not**:
- approve safety procedures;
- set tolerances or code values;
- generate assets presented as real Honorary Homes properties or people;
- grade a learner's Prove attempt without a deterministic rubric;
- publish, schedule or retire anything;
- create or alter prices, claims, credentials, partners or statistics;
- change its own instructions, prompts, evaluation thresholds or approval rules.

Scoring is rule-based and reproducible. The same attempt with the same seed must always get the same score.

### 10.2 Content AI: drift controls

| Control | Requirement |
|---|---|
| Pinned models | Every generation records an exact model ID, never a floating alias like "latest". Changing models is a versioned change request. |
| Versioned prompts | Prompt templates live in the repo with version numbers and owners. Editing one requires a pull request and review from the prompt owner. |
| Golden evaluation set | Each prompt has a fixed evaluation set of known-good and known-bad examples (unsafe procedure, fake certification claim, invented statistic, off-brand tone, reading level above grade 6). |
| Promotion gate | A prompt or model change reaches production only if it meets or beats the previous version on every evaluation metric. Any safety-metric regression blocks it outright. |
| Grounding | Every factual line must cite an approved `SourceRecord`. Output that cites unknown sources, or makes uncited factual claims, is rejected rather than repaired. |
| Claims linter | A deterministic check blocks banned phrases and patterns: "certified," "licensed," "OSHA 10 card," "guaranteed job," "Registered Apprenticeship" without a verified record, real brand names on tools, and any injury or gore description. |
| Schema lock | Output must match the JSON schema exactly. Malformed output fails and is never auto-fixed. |
| Drift monitoring | The admin dashboard tracks reviewer rejection rate, claims-linter hits, evaluation scores, reading level and cost per draft, each with a baseline. A metric that moves more than its threshold (default ±15% week over week) raises an alert and pauses that prompt's batch jobs. |
| Kill switch | One audited admin action pauses all generation, or a single prompt, without a redeploy. |
| Human final word | No generated content reaches learners without the approvals in §9. AI review flags inform the human reviewer but never replace them. |

### 10.3 Codex: engineering drift controls

Codex works like a senior engineer at a Fortune 500 company: inside scope, from the spec, with every change explained and reviewable.

1. **The spec is the source of truth.** If code and spec disagree, Codex stops and reports the conflict. It does not resolve it by picking one.
2. **Scope lock.** Codex builds only what the current task names. It adds no extra features, refactors, redesigns or "while I was here" changes. Out-of-scope ideas go in the completion report as recommendations.
3. **Plan before code.** For any task larger than a bug fix, Codex first posts a plan listing files, dependencies and risks, and builds to that plan. If the plan has to change mid-task, it says why in the report.
4. **Protected files.** Codex never edits these without the task explicitly asking: `AGENTS.md`, `docs/product-specs/`, `docs/curriculum-standards/`, `docs/sim-standards/`, `packages/design-tokens/`, approval rules (`canPublish*`), evaluation thresholds, and the claims-linter rule list. `CODEOWNERS` enforces human review on all of them.
5. **Dependencies.** No new runtime dependency unless the task's "allowed dependencies" list names it. No unpinned versions, no abandoned packages, no copyleft licenses without approval.
6. **Decision records.** Any architecture choice not dictated by the spec gets a short ADR in `docs/architecture-decisions/`.
7. **No invented facts.** Codex writes no real-looking course content, partner names, prices, statistics, testimonials or property records. It uses clearly fake fixture data only (`FIXTURE — not real`).
8. **Honest reporting.** Codex reports only results it actually ran. Anything it could not run or measure (GPU benchmarks, headset tests, real LRS) is listed as **not verified**, never implied.
9. **Stop on ambiguity.** If a requirement is unclear, conflicts with safety or privacy, or would weaken a control in this section, Codex stops and asks. It does not guess.
10. **Small, reviewable changes.** Aim for one milestone slice per pull request, roughly 600 changed lines excluding generated files and fixtures. Never push directly to `main`.

### 10.4 Automated enforcement in CI

These checks run on every pull request, and any failure blocks the merge:

- `pnpm sim:validate`: scenario schemas, objective mapping, every sim has a non-3D path
- `pnpm claims:lint`: banned-claims scan across scenario data, UI copy, certificates and generated drafts
- `pnpm ai:eval`: golden-set evaluation for any changed prompt template or model ID
- `pnpm guard:protected`: fails if protected files changed without the `spec-change-approved` label
- `pnpm guard:approvals`: tests proving `canPublishCourse()` and `canPublishScenario()` cannot be bypassed
- `pnpm score:determinism`: replays recorded attempts and fails if any score changes
- Dependency and license scan, secret scan, and the budgets from §12

### 10.5 Accountability (RACI)

| Activity | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Prompt template change | Curriculum engineer | Curriculum owner | Instructional designer, compliance | Final publisher |
| Model change | Platform engineer | Engineering lead | Curriculum owner | All reviewers |
| Safety-procedure content | SME draft (AI-assisted) | Trade/safety reviewer | Instructional designer | Final publisher |
| Drift alert response | On-call engineer | Engineering lead | Curriculum owner | Leadership |
| Codex pull request | Codex | Human code owner (merges) | Domain reviewer per CODEOWNERS | — |

### 10.6 Monthly governance review

Once a month, the engineering lead and curriculum owner review:
- the drift dashboard;
- linter hits;
- reviewer rejection reasons;
- evaluation trends;
- cost;
- every Codex pull request that touched protected files.

Decisions are recorded in `docs/governance/reviews/YYYY-MM.md`.

## 11. Instructor and admin features

- **Replay viewer**: scrub any attempt and see the learner's camera, tool and action timeline, with safety-gate events marked.
- **Cohort competency heatmap**: objectives × learners, filterable by course, region and cohort.
- **Remediation assignment**: one click sends a learner to the lesson tied to the criterion they missed.
- **Scenario editor**: edit pools, tolerances and text, preview, and submit for review. Version diffs are shown side by side.
- **Ready-for-crew sign-off** with notes, audit log and Earned Ground handoff.

## 12. Quality engineering

- **Unit**: scenario state machine, scoring, randomization determinism (same seed gives the same scenario), xAPI builders.
- **Integration**: scenario load → attempt → xAPI → LRS → progress → completion.
- **E2E (Playwright)**: purchase → open course → complete SIM-110 via the 3D path **and** via the non-3D path → completion recorded.
- **Performance CI**, in two layers because the Codex sandbox has no real GPU:
  - *Static budgets (run in Codex and every PR):* an asset-manifest checker that fails the build when bundle size, triangle counts, draw-call estimates or texture memory exceed §7.3, plus a SwiftShader/software-WebGL smoke render to prove scenes load.
  - *Runtime frame-rate benchmarks (run outside Codex):* a GitHub Actions job on a GPU runner or a device-lab service. Codex writes and maintains this job but must not claim fps results it could not measure.
- **Accessibility**: axe on all 2D UI, plus manual screen-reader runs of every non-3D path, keyboard-only runs, and reduced-motion runs.
- **Visual QA checklist per environment**: correct scale, no impossible construction, no unsafe conduct shown as normal, no readable brand marks, no stereotyped characters, and lighting continuity across condition states.
- **Usability**: a 5-learner moderated test of SIM-110 before building SIM-121. At least two testers should be low digital-literacy adults, and at least one should be on a phone.

## 13. Milestones (narrow, testable)

**M0: Foundations.** `sim-core`, `sim-content` schemas, `sim-xapi`, the asset pipeline worker, the performance budget CI, and an empty sim-player embedded in the learning player. M0 also sets up the §10.4 governance checks: claims linter, protected-file guard, approval-gate tests, determinism test harness, and the `CODEOWNERS` entries. *No content.*

**M1: SIM-110 Hazard Hunt, end to end.** ENV-NE-01 (as-found), 25-hazard pool with 10 drawn per attempt, PPE gate, Learn/Practice/Prove, scoring, replay, results screen, non-3D path, xAPI, completion rule, admin preview and approval flow.

**M2: SIM-121 Frame a Wall.** ENV-SHOP-01, physics placement, virtual tape, level and square, tolerance grading, the consequence system (drywall gap), and the remediation link.

**M3: SIM-220 Work Order Desk.** ENV-APT-01, randomized faults, a diagnostic decision tree, and close-out documentation.

**M4: Instructor console.** Replay viewer, heatmap, remediation, ready-for-crew sign-off.

**M5: Catalog expansion.** The remaining sims in §4, reusing M1–M3 systems, plus Spanish.

**M6: Headset build.** Unity Quest build for SIM-102, SIM-121 and SIM-210, reading the same scenario JSON. Codex can write the C# scenario loader and xAPI client and their tests. Unity editor work, lightmap baking and on-device testing happen on a developer machine or a Unity Build Automation pipeline, not in the Codex sandbox.

**3D asset production note:** Codex builds code, schemas, pipelines and placeholder (greybox) geometry. Final modeled environments and tools come from a technical artist or licensed asset libraries and enter through `workers/sim-asset-pipeline/`. Codex must not try to generate final-quality 3D art.

Each milestone task must state: source spec section, scope, out-of-scope, acceptance criteria, required tests, docs to update, allowed dependencies, security notes, and a completion report (Academy spec §27).

## 14. First task

0. If the audit finds the monorepo or upstream docs missing, follow §0A (bootstrap mode) before anything else.
1. Read the documents listed in §0 and report: the current repo state, which Academy spec milestones exist, gaps that block M0, and conflicts between this spec and existing code or tokens.
2. Write down your assumptions and the **three biggest risks** to the Simulation Lab, with a mitigation for each.
3. Propose the M0 file plan and dependencies, then implement M0 only.
4. Before reporting done: format, lint, typecheck, unit, integration, the performance CI dry run, and a production build. Then report files changed, commands run, results, decisions, security implications, limitations, and the recommended next task.

Do not build M1 content, Unity projects, checkout or AI generation in this task. Do not invent course content, partners, statistics or properties.

# END OF PROMPT

---

## Appendix A: add to root `AGENTS.md`

Keep `AGENTS.md` short. Add this block under "Sources of truth" and "Mandatory checks":

```md
## Simulation Lab
- Spec: docs/product-specs/simulation-lab.md
- Standards: docs/sim-standards/
- Scenario data lives in packages/sim-content; never hard-code scenarios in scenes.
- sim-core must stay renderer-free and deterministic (same seed = same result).
- Every sim needs a non-3D accessible path before it can be published.
- Sims prepare; they never certify. No "certified", "licensed" or "OSHA 10" claims.
- Codex builds greybox geometry only; final 3D art comes through the asset pipeline.
- Do not report fps numbers unless measured on the GPU benchmark job.

## Anti-drift rules (see simulation-lab.md §10)
- The spec is the source of truth. If code and spec conflict, stop and report it.
- Build only what the task names. Extra ideas go in the report, not the diff.
- Plan first for anything larger than a bug fix.
- Never edit protected files (AGENTS.md, docs/product-specs, standards docs,
  design tokens, canPublish*, eval thresholds, claims-lint rules) unless the task says so.
- No new dependencies outside the task's allowed list.
- No invented content, partners, prices, stats or properties. Fixtures say "FIXTURE — not real".
- Report only what you ran. Anything unmeasured is marked "not verified".
- If unclear, or a change would weaken a safety, privacy or approval control: stop and ask.

## Simulation checks
pnpm sim:validate      # scenario schemas + objective mapping + non-3D path
pnpm sim:budgets       # static asset/perf budgets
pnpm sim:smoke         # software-WebGL load test
pnpm claims:lint       # banned-claims scan
pnpm ai:eval           # golden-set eval for changed prompts/models
pnpm guard:protected   # protected-file change gate
pnpm guard:approvals   # publish gates cannot be bypassed
pnpm score:determinism # replayed attempts score identically
pnpm deps:licenses     # license allowlist on full dependency tree
```

## Dependencies (see simulation-lab.md §7.6)
- Exact versions only, lockfile committed, newest stable at least 14 days old.
- Network only for the npm registry, Node/pnpm and Playwright browsers.
- Licenses: see §7.6 policy v2. Shipped and dev trees are checked separately.
  MPL-2.0 and CC-BY data packages are dev-only. First-party @honorary-homes/* = private + UNLICENSED.
  Blocked transitive deps: remove if optional and prove with a test, else stop and report.
- sharp/libvips is excluded in M0.
- Only packages on the milestone's allowed list.

## Appendix B: Codex task template for each milestone

```text
Implement Simulation Lab milestone <M#> per docs/product-specs/simulation-lab.md §13.
Scope: <list>
Out of scope: <list>
Acceptance criteria: <list>
Required tests: <list>
Docs to update: <list>
Allowed new dependencies: <list>
Security/privacy notes: <list>
Finish with: files changed, commands run, results, decisions, limits, next task.
```