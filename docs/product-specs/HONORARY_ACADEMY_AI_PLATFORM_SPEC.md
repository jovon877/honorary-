Below is the revised **enterprise engineering specification** for building Honorary Homes Academy in Codex. It converts every former module into a separately priced course and adds an AI-assisted curriculum and video-production system with human approval gates.

Codex should operate as the software-engineering layer—not as an unsupervised publisher. It can inspect the repository, implement features, run tests, and prepare changes for review. OpenAI recommends guiding Codex through repository instructions such as `AGENTS.md`, reliable test environments, and structured documentation rather than placing the entire operating manual in one prompt. ([OpenAI][1])

# HONORARY HOMES ACADEMY

## Enterprise Course Platform, AI Content Factory and Video Production System

**Document type:** Principal Engineering and DevSecOps Specification
**Target implementation environment:** Codex with GitHub repository access
**Application class:** Enterprise education-commerce platform
**Operating standard:** Fortune 500-quality product engineering
**Primary delivery model:** Guided, self-paced professional courses
**Course pricing:** $299 to $2,500+
**Institutional licensing:** Starting at $10,000 per cohort
**Public visual identity:** White, black, warm ivory and restrained heritage gold

---

# 1. Product Mandate

Build Honorary Homes Academy as a premium professional education platform operating within the larger Honorary Homes digital ecosystem.

The Academy must support education across:

* Homeownership
* Property management
* Property services
* Skilled trades
* Community development
* Real estate entrepreneurship
* Executive leadership
* Institutional workforce training

Every former “module” becomes an independently purchasable course.

A course may contain internal instructional units, but those units must be labeled:

* Chapters
* Lessons
* Workshops
* Exercises
* Field applications
* Assessments

Do not publicly describe a paid product as a “module.”

## 1.1 Product positioning

The experience must feel comparable in quality and discipline to:

* Executive education
* Corporate learning and development
* Professional certification
* Institutional workforce training
* Premium continuing education

It must not resemble:

* A generic video-course marketplace
* A low-cost learning-management template
* A collection of AI-generated talking-head videos
* A playlist of disconnected lessons
* A creator-influencer course
* A basic WordPress membership website

## 1.2 Core principle

AI assists with research organization, course drafting, storyboarding, narration, assessments, visual generation and production automation.

AI does not receive autonomous authority to:

* Publish a course
* Make legal claims
* Provide individualized financial advice
* Approve construction or safety instruction
* Issue regulatory guidance
* Certify technical competence
* Invent statistics, programs, grants or partners
* Represent generated content as a live instructor
* Create a digital replica of a person without documented authorization

All publishable educational content requires human review.

---

# 2. Target Operating Model

The Academy operates through five connected systems.

```text
Curriculum Management System
        ↓
AI Content Production Pipeline
        ↓
Media Rendering and Assembly Pipeline
        ↓
Learning Experience Platform
        ↓
Commerce, Reporting and Institutional Licensing
```

## 2.1 Curriculum Management System

Controls:

* Course definitions
* Course versions
* Learning objectives
* Lesson structures
* Source materials
* Subject-matter reviews
* Assessments
* Downloads
* Publication approvals
* Revision history

## 2.2 AI Content Production Pipeline

Produces structured drafts for:

* Course outlines
* Lesson manuscripts
* Narration scripts
* Visual treatments
* Knowledge checks
* Worksheets
* Action plans
* Course descriptions
* Metadata
* Captions
* Transcripts

## 2.3 Media Pipeline

Produces:

* Narration audio
* Motion graphics
* Generated illustrative video clips
* Property and architectural B-roll
* On-screen typography
* Diagrams
* Chapter introductions
* Closed captions
* Audio descriptions
* Final encoded lesson videos

## 2.4 Learning Experience Platform

Delivers:

* Course access
* Progress tracking
* Guided exercises
* Saved answers
* Assessments
* Downloads
* Personal action plans
* Certificates of completion
* Learning pathways

## 2.5 Enterprise Administration

Supports:

* Course approval
* Enrollment management
* Cohort licensing
* Organization accounts
* Reporting
* Content governance
* Audit trails
* Financial reconciliation
* Support operations

---

# 3. Repository Architecture

Use a monorepo with explicit bounded contexts.

```text
honorary-homes/
├── apps/
│   ├── web/                     # Public corporate and Academy website
│   ├── learning/                # Authenticated learner experience
│   ├── admin/                   # Internal content and operations console
│   ├── render-worker/           # Video/audio rendering workers
│   └── docs/                    # Engineering documentation portal
│
├── packages/
│   ├── ui/                      # Shared accessible interface components
│   ├── design-tokens/           # White/black/gold design system
│   ├── curriculum-domain/       # Course and lesson business logic
│   ├── content-generation/      # AI generation adapters
│   ├── media-pipeline/          # Rendering and assembly logic
│   ├── assessments/             # Assessment engine
│   ├── certificates/            # Certificate generation
│   ├── commerce/                # Pricing, checkout and orders
│   ├── organizations/           # Institutional accounts and cohorts
│   ├── database/                # Schemas, migrations and repositories
│   ├── validation/              # Shared Zod schemas
│   ├── authorization/           # RBAC and policy enforcement
│   ├── analytics/               # Product and learning events
│   ├── observability/           # Logging, tracing and metrics
│   ├── email/                   # Transactional communications
│   ├── storage/                 # Asset storage abstractions
│   ├── testing/                 # Test fixtures and utilities
│   └── config/                  # Shared project configuration
│
├── workers/
│   ├── content-generation/
│   ├── speech-generation/
│   ├── video-generation/
│   ├── media-composition/
│   ├── transcription/
│   └── quality-control/
│
├── infrastructure/
│   ├── terraform/
│   ├── environments/
│   ├── monitoring/
│   └── runbooks/
│
├── docs/
│   ├── product-specs/
│   ├── design-docs/
│   ├── architecture-decisions/
│   ├── exec-plans/
│   ├── curriculum-standards/
│   ├── media-standards/
│   ├── security/
│   └── compliance/
│
├── AGENTS.md
├── ARCHITECTURE.md
├── SECURITY.md
├── CONTRIBUTING.md
└── CODEOWNERS
```

---

# 4. Recommended Technical Stack

## 4.1 Applications

Use:

* Next.js with App Router
* React
* TypeScript in strict mode
* Server Components by default
* PostgreSQL
* Prisma or Drizzle
* Redis-compatible queue and cache
* Object storage for media
* Stripe for commerce
* A headless CMS for editorial content
* OpenAI API for approved generation workloads
* FFmpeg for deterministic media assembly
* Playwright for end-to-end testing
* Storybook for interface development
* OpenTelemetry-compatible observability
* Sentry or an equivalent error platform

## 4.2 Background processing

Use durable job execution for:

* Course generation
* Speech generation
* Video generation
* Caption generation
* Media composition
* Thumbnail production
* Batch exports
* Certificate rendering
* Institutional reporting

Do not execute long-running generation operations inside web request handlers.

## 4.3 Queue behavior

Every media job must support:

* Idempotency
* Retry policy
* Dead-letter state
* Cancellation
* Progress reporting
* Timeout policy
* Cost attribution
* Failure diagnostics
* Manual restart
* Asset cleanup

---

# 5. Codex Repository Governance

Keep the root `AGENTS.md` concise. It should act as a map to authoritative documents rather than contain the entire product specification.

```md
# AGENTS.md

## Mission

Build and maintain the Honorary Homes corporate, commerce and professional
education platform.

## Sources of truth

- Architecture: ARCHITECTURE.md
- Product specifications: docs/product-specs/
- Active execution plans: docs/exec-plans/active/
- Curriculum rules: docs/curriculum-standards/
- Media rules: docs/media-standards/
- Security rules: docs/security/
- Design system: packages/design-tokens/

## Mandatory checks

pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build

## Engineering rules

- TypeScript strict mode is mandatory.
- Prefer Server Components for public pages.
- Validate untrusted input at system boundaries.
- Keep domain logic out of React components.
- Never expose secrets or personal data.
- Do not publish generated course content automatically.
- Do not fabricate claims, citations, partners or statistics.
- Preserve accessibility and reduced-motion support.
- Add tests for material behavior.
- Update architecture documentation when boundaries change.

## AI-content rules

- All generated content remains draft until human approval.
- Every generation must record model, prompt version and source package.
- Every factual lesson must include approved source references.
- Safety-sensitive content requires designated expert review.
- AI-generated media must be labeled internally.
- External disclosure must follow the approved content policy.
- Never imitate a real person’s voice without documented consent.

## Definition of done

A task is complete only after:

- Acceptance criteria pass.
- Tests and builds pass.
- Security implications are reviewed.
- Accessibility is validated.
- Observability is included.
- Documentation is updated.
- No unrelated files are modified.
```

---

# 6. Course Domain Model

A course is a versioned commercial and educational object.

```ts
export type CourseStatus =
  | "concept"
  | "draft"
  | "subject_matter_review"
  | "legal_review"
  | "media_production"
  | "quality_assurance"
  | "approved"
  | "published"
  | "retired";

export type CourseLevel =
  | "foundation"
  | "professional"
  | "advanced"
  | "executive";

export interface Course {
  id: string;
  slug: string;
  sku: string;
  title: string;
  subtitle?: string;
  schoolId: string;
  version: number;

  status: CourseStatus;
  level: CourseLevel;
  deliveryMode: "self_paced" | "guided" | "cohort";
  priceCents: number;
  currency: "USD";

  summary: string;
  description: RichTextDocument;
  audience: string[];
  prerequisites: string[];
  learningObjectives: LearningObjective[];
  chapters: CourseChapter[];
  assessments: AssessmentDefinition[];
  resources: CourseResource[];

  estimatedMinutes: number;
  certificateAvailable: boolean;
  continuingEducationEligible: boolean;

  subjectMatterOwnerId: string;
  contentOwnerId: string;
  approvalRecordId?: string;

  sourcePackageId: string;
  generationManifestId?: string;

  effectiveAt?: string;
  reviewAt?: string;
  publishedAt?: string;
  retiredAt?: string;

  createdAt: string;
  updatedAt: string;
}
```

## 6.1 Course hierarchy

```text
School
  └── Course
       ├── Chapter
       │    ├── Lesson
       │    ├── Video
       │    ├── Transcript
       │    ├── Knowledge Check
       │    └── Exercise
       ├── Practical Application
       ├── Final Assessment
       ├── Action Plan
       └── Certificate
```

## 6.2 Learning objective structure

```ts
export interface LearningObjective {
  id: string;
  statement: string;
  bloomLevel:
    | "remember"
    | "understand"
    | "apply"
    | "analyze"
    | "evaluate"
    | "create";
  assessmentIds: string[];
}
```

Each assessment must trace back to at least one learning objective.

---

# 7. Converting Existing Modules into Courses

Codex must execute module conversion through a controlled migration pipeline.

## 7.1 Input

Accepted source formats:

* Existing master curriculum documents
* Word documents
* PDFs
* Markdown
* Structured JSON
* Spreadsheets
* Approved internal notes
* Licensed source materials

## 7.2 Migration stages

```text
Ingest source material
        ↓
Extract source units
        ↓
Classify each former module
        ↓
Identify course boundaries
        ↓
Assign school and level
        ↓
Define learning objectives
        ↓
Build independent course outline
        ↓
Assign commercial price
        ↓
Generate lesson drafts
        ↓
Generate production package
        ↓
Human review
        ↓
Publish
```

## 7.3 Course-boundary rules

A former module becomes its own course when it:

* Solves a distinct learner problem
* Has measurable learning objectives
* Can be purchased independently
* Can be completed without an unrelated prerequisite
* Produces a practical outcome
* Supports at least one assessment or applied exercise
* Has sufficient depth to justify its price

Do not convert thin modules into overpriced courses.

When a source module lacks sufficient depth:

* Merge it with a closely related topic, or
* Expand it through approved expert content, or
* Publish it as a free resource instead of a paid course

## 7.4 Required migration output

```ts
export interface ModuleConversionResult {
  sourceModuleId: string;
  proposedCourse: {
    title: string;
    schoolSlug: string;
    level: CourseLevel;
    proposedPriceCents: number;
    commercialRationale: string;
    learnerProblem: string;
    practicalOutcome: string;
    learningObjectives: string[];
    chapterOutline: string[];
    estimatedMinutes: number;
  };
  sourceCoverage: {
    retainedSections: string[];
    expandedSections: string[];
    excludedSections: string[];
    unsupportedClaims: string[];
  };
  reviewFlags: ReviewFlag[];
}
```

Use strict structured output for this conversion. The generation service must reject malformed responses rather than attempt to infer missing fields.

---

# 8. AI Course Production Pipeline

## 8.1 Pipeline states

```text
COURSE_CONCEPT_CREATED
SOURCE_PACKAGE_VALIDATED
OUTLINE_GENERATED
OUTLINE_REVIEWED
LESSONS_GENERATED
LESSONS_REVIEWED
ASSESSMENTS_GENERATED
ASSESSMENTS_VALIDATED
MEDIA_PLAN_GENERATED
MEDIA_ASSETS_RENDERED
COURSE_ASSEMBLED
ACCESSIBILITY_VALIDATED
QUALITY_ASSURANCE_APPROVED
COURSE_PUBLISHED
```

No state may be skipped without an authorized override recorded in the audit log.

## 8.2 Source package

Every generated course begins with an approved source package.

```ts
export interface SourcePackage {
  id: string;
  courseId: string;
  jurisdiction?: string;
  effectiveDate?: string;
  sources: SourceRecord[];
  prohibitedClaims: string[];
  requiredDisclaimers: string[];
  approvedBy: string;
  approvedAt: string;
}
```

## 8.3 Source record

```ts
export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  sourceType:
    | "government"
    | "regulator"
    | "academic"
    | "industry_standard"
    | "internal_policy"
    | "licensed_material";
  location: string;
  publicationDate?: string;
  retrievedAt: string;
  jurisdiction?: string;
  approvedForGeneration: boolean;
}
```

## 8.4 Generation manifest

Record every material generation event.

```ts
export interface GenerationManifest {
  id: string;
  courseId: string;
  courseVersion: number;
  pipelineVersion: string;
  promptTemplateVersion: string;
  model: string;
  sourcePackageId: string;
  requestedBy: string;
  startedAt: string;
  completedAt?: string;
  status: "queued" | "running" | "completed" | "failed";
  inputHash: string;
  outputHash?: string;
  estimatedCostCents?: number;
  actualCostCents?: number;
}
```

## 8.5 Generation roles

Separate responsibilities rather than using one universal prompt.

### Curriculum architect

Produces:

* Learner profile
* Course scope
* Learning objectives
* Course sequence
* Completion outcome

### Instructional designer

Produces:

* Lesson structure
* Activities
* Scaffolding
* Knowledge checks
* Assessment map

### Scriptwriter

Produces:

* Narration
* On-screen text
* Scene direction
* Demonstration instructions
* Recap language

### Assessment designer

Produces:

* Questions
* Applied exercises
* Rubrics
* Answer rationales
* Remediation paths

### Compliance reviewer

Flags:

* Unsupported factual claims
* Misleading guarantees
* Legal or financial advice
* Safety concerns
* Jurisdiction-specific language
* Missing disclaimers

### Editorial reviewer

Checks:

* Tone
* Repetition
* Clarity
* Brand consistency
* Reading level
* Human quality

These roles may be separate prompt configurations within one service. They must not share hidden mutable state.

---

# 9. Course Generation API

## 9.1 Generation request

```ts
export interface GenerateCourseRequest {
  courseId: string;
  sourcePackageId: string;
  generationScope:
    | "outline"
    | "lesson"
    | "assessment"
    | "media_plan"
    | "complete_draft";
  targetLessonId?: string;
  promptTemplateVersion: string;
  requestedBy: string;
}
```

## 9.2 Response contract

```ts
export interface GeneratedCourseDraft {
  courseId: string;
  sourcePackageId: string;
  title: string;
  promise: string;
  audience: string[];
  objectives: LearningObjectiveDraft[];
  chapters: GeneratedChapter[];
  assessments: GeneratedAssessment[];
  requiredDisclaimers: string[];
  sourceAttributions: SourceAttribution[];
  reviewFlags: ReviewFlag[];
}
```

## 9.3 Required generation controls

* Use JSON Schema-based structured output.
* Reject output containing unknown source identifiers.
* Require source attribution for factual claims.
* Add deterministic validation after generation.
* Store prompt-template versions.
* Hash inputs and outputs.
* Apply per-course cost ceilings.
* Apply concurrency controls.
* Retry only on transient failures.
* Never retry policy or validation failures automatically.

OpenAI’s Structured Outputs capability can enforce a supplied JSON schema, which is preferable to relying on loosely formatted JSON for production data contracts. ([OpenAI Platform][2])

---

# 10. AI-Generated Lesson Video Architecture

## 10.1 Video philosophy

Videos should feel like premium corporate education—not synthetic social media content.

Preferred visual treatments:

* Architectural documentary footage
* Property details
* Maps
* Diagrams
* Animated process models
* Editorial typography
* Hands-on demonstrations
* Screen recordings
* Document walkthroughs
* Restrained motion graphics
* Professionally narrated case examples

Avoid:

* Fake instructors standing in artificial offices
* Uncanny digital presenters
* Continuous lip-synced avatars
* Hyperactive transitions
* Generic corporate stock montages
* Decorative footage unrelated to instruction
* Unrealistic construction demonstrations
* Generated footage presented as evidence of a real property or project

## 10.2 Video composition model

A lesson video is assembled from deterministic scene objects.

```ts
export interface LessonVideoPlan {
  lessonId: string;
  targetDurationSeconds: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  narrationScript: NarrationSegment[];
  scenes: VideoScene[];
  captionTrack: CaptionCue[];
  audioDescriptionTrack?: AudioDescriptionCue[];
  musicPolicy: "none" | "intro_outro" | "low_bed";
  disclosureRequired: boolean;
}
```

## 10.3 Scene types

```ts
export type VideoScene =
  | GeneratedVideoScene
  | LicensedFootageScene
  | MotionGraphicScene
  | DiagramScene
  | ScreenCaptureScene
  | TypographyScene
  | StillImageScene
  | DemonstrationScene;
```

## 10.4 Generated video scenes

Generated video should be treated as short illustrative B-roll.

```ts
export interface GeneratedVideoScene {
  type: "generated_video";
  sceneId: string;
  educationalPurpose: string;
  prompt: string;
  referenceAssetIds: string[];
  durationSeconds: 4 | 8 | 12;
  orientation: "landscape" | "portrait";
  authenticityRisk: "low" | "medium" | "high";
  prohibitedRepresentations: string[];
}
```

The OpenAI video endpoint currently supports generation jobs using prompts and optional reference assets, with supported clip lengths of 4, 8 or 12 seconds. Therefore, full course lessons must be assembled from multiple approved clips, motion graphics, stills, narration and deterministic editing rather than attempting to generate one long lesson in a single call. ([OpenAI Platform][3])

## 10.5 Video generation workflow

```text
Approve lesson manuscript
        ↓
Generate scene plan
        ↓
Classify scenes by production method
        ↓
Generate reference frames
        ↓
Submit short video jobs
        ↓
Poll job status
        ↓
Run visual QA
        ↓
Reject or approve clips
        ↓
Generate narration
        ↓
Assemble with FFmpeg
        ↓
Generate captions
        ↓
Render accessibility versions
        ↓
Human final review
        ↓
Publish media asset
```

## 10.6 Video job entity

```ts
export interface VideoGenerationJob {
  id: string;
  lessonId: string;
  sceneId: string;
  providerJobId?: string;
  promptVersion: string;
  status:
    | "queued"
    | "submitted"
    | "processing"
    | "completed"
    | "rejected"
    | "failed";
  attempt: number;
  outputAssetId?: string;
  moderationResultId?: string;
  qualityReviewId?: string;
  costCents?: number;
  createdAt: string;
  updatedAt: string;
}
```

## 10.7 Visual quality checks

Each clip must be checked for:

* Anatomical errors
* Distorted hands
* Unreadable signage
* Impossible construction practices
* Unsafe conduct
* False uniforms or credentials
* Brand infringement
* Property misrepresentation
* Unstable architecture
* Inconsistent tools
* Unrealistic materials
* Lighting discontinuity
* Scene-to-scene continuity
* Generated text artifacts
* Demographic stereotyping

High-risk clips must be rejected automatically from publication until manual approval.

---

# 11. Narration and Voice System

## 11.1 Narration options

The platform may use:

* Approved built-in synthetic voices
* Licensed professional voice actors
* Authorized custom voices with documented consent

Never create or use a custom voice that imitates a person without explicit authorization.

OpenAI’s speech endpoint supports generated audio in formats such as MP3, WAV, AAC, FLAC, Opus and PCM. Current requests have an input-length constraint, so long lesson scripts must be segmented and reassembled while preserving pronunciation and cadence. Custom voice workflows require a voice sample and a consent recording and are limited to eligible customers. ([OpenAI Platform][4])

## 11.2 Narration segment

```ts
export interface NarrationSegment {
  id: string;
  order: number;
  text: string;
  pronunciationHints: Record<string, string>;
  tone:
    | "calm"
    | "authoritative"
    | "instructional"
    | "reflective"
    | "executive";
  pauseAfterMs: number;
}
```

## 11.3 Audio production rules

* Normalize volume.
* Remove unintended silence.
* Apply consistent room tone only when necessary.
* Do not over-compress.
* Use approved pronunciation dictionaries.
* Maintain one primary voice per course.
* Generate alternate narration only through explicit versioning.
* Retain the original script associated with every audio file.
* Generate transcripts from the authoritative script, then verify timing.

---

# 12. Script-to-Video Compiler

Create a service that converts an approved lesson into a renderable timeline.

## 12.1 Input

```ts
export interface CompileLessonInput {
  lessonVersionId: string;
  approvedScriptId: string;
  approvedMediaPlanId: string;
  brandThemeId: "honorary-academy-light" | "honorary-academy-dark";
  outputProfiles: OutputProfile[];
}
```

## 12.2 Output profiles

```ts
export interface OutputProfile {
  name:
    | "course_hd"
    | "course_mobile"
    | "preview"
    | "social_vertical"
    | "audio_only";
  width: number;
  height: number;
  frameRate: 24 | 25 | 30;
  videoCodec?: "h264" | "h265";
  audioCodec?: "aac";
  bitrateKbps?: number;
}
```

## 12.3 Render timeline

```ts
export interface RenderTimeline {
  durationMs: number;
  tracks: {
    narration: TimelineAsset[];
    visuals: TimelineAsset[];
    typography: TimelineAsset[];
    captions: TimelineAsset[];
    music: TimelineAsset[];
  };
  transitions: TimelineTransition[];
  brand: BrandRenderSettings;
}
```

## 12.4 FFmpeg responsibilities

Use deterministic media tooling to:

* Concatenate clips
* Crop and scale
* Normalize audio
* Add approved transitions
* Burn preview watermarks
* Package caption tracks
* Generate thumbnails
* Generate HLS streaming outputs
* Generate MP4 fallbacks
* Produce audio-only files
* Validate duration and codec properties

Do not delegate final timeline assembly to a generative model.

---

# 13. Course Video Template System

Build reusable branded templates.

## 13.1 Standard lesson template

```text
00:00–00:08  Honorary Homes Academy title
00:08–00:25  Lesson promise
00:25–01:00  Context and relevance
01:00–06:00  Core instruction
06:00–08:00  Example or case application
08:00–09:00  Guided reflection
09:00–09:30  Summary
09:30–10:00  Next action
```

Actual duration may vary according to instructional need.

## 13.2 Required template components

* Course identifier
* School identifier
* Lesson title
* Chapter number
* Learning objective
* Lower-third label
* Diagram frame
* Case-study frame
* Quote frame
* Calculation frame
* Key-term frame
* Warning frame
* Recap frame
* Action-step frame
* End card

## 13.3 Brand controls

Use:

* White backgrounds
* Obsidian text
* Ivory section fields
* Heritage gold as a restrained indicator
* Editorial serif for major titles
* Neutral sans serif for instruction
* Thin rules
* Spacious layouts
* Slow, purposeful transitions

Do not use:

* Gold gradients
* Metallic animation
* Loud logo reveals
* Sparkle effects
* Excessive rounded cards
* Generic blue educational graphics

---

# 14. Course Content Structure

Every paid course must include:

1. Executive overview
2. Course orientation
3. Learning objectives
4. Core instructional chapters
5. Guided exercises
6. Applied scenario
7. Knowledge checks
8. Downloadable tools
9. Final action plan
10. Assessment
11. Completion summary
12. Certificate eligibility
13. Sources and disclaimers
14. Support and escalation information

## 14.1 Minimum content threshold

A $299 course should normally include:

* 90 to 150 minutes of structured learning
* Three or more chapters
* At least one applied exercise
* Downloadable resource
* Knowledge checks
* Completion action plan

A course priced at $800 or above should normally include:

* 4 to 8 hours of structured learning
* Applied casework
* Multiple templates
* Assessment
* Operational toolkit
* Detailed implementation plan
* Certificate of completion

Executive courses should include:

* Strategic frameworks
* Financial or operational models
* Leadership decision scenarios
* Institutional case analysis
* Board-level implementation tools

Price must reflect instructional depth and business value—not merely video length.

---

# 15. Assessment Architecture

## 15.1 Assessment types

Support:

* Multiple choice
* Multiple response
* Scenario analysis
* Short response
* Long response
* Calculation
* Sequencing
* Document review
* Action-plan submission
* Rubric-based practical assignment

## 15.2 Assessment validation

AI may draft questions, but the system must validate:

* Every question maps to an objective.
* Every correct answer has a rationale.
* Distractors are plausible but not deceptive.
* The answer is supported by approved course material.
* The question is not discriminatory.
* The question does not require unstated assumptions.
* Safety-critical items receive expert approval.
* Questions are not duplicated.

## 15.3 Assessment data model

```ts
export interface AssessmentItem {
  id: string;
  courseVersionId: string;
  objectiveIds: string[];
  type: AssessmentType;
  prompt: string;
  options?: AssessmentOption[];
  correctAnswer?: unknown;
  rationale: string;
  remediationLessonId?: string;
  status: "draft" | "reviewed" | "approved" | "retired";
}
```

---

# 16. Guided Action-Plan System

The Academy is not a passive video library.

The learning experience must follow:

```text
Instruction
   ↓
Prompt
   ↓
Learner response
   ↓
Save
   ↓
Validate
   ↓
Reflection
   ↓
Personalized synthesis
   ↓
Action-plan document
```

## 16.1 Action-plan generation

AI-generated action plans must:

* Use only learner-provided information and approved course frameworks.
* Avoid legal, financial or medical conclusions.
* Distinguish facts from recommendations.
* Include editable assumptions.
* Include a disclaimer.
* Permit the learner to regenerate selected sections.
* Never send sensitive answers to product analytics.
* Support deletion and export.

---

# 17. Human Review Workflow

## 17.1 Review roles

* Curriculum owner
* Instructional designer
* Subject-matter expert
* Legal or compliance reviewer
* Accessibility reviewer
* Media producer
* Brand editor
* Final publisher

## 17.2 Approval matrix

| Content type                | Required approval                       |
| --------------------------- | --------------------------------------- |
| Course outline              | Curriculum owner                        |
| Lesson manuscript           | Subject-matter expert                   |
| Financial content           | Qualified financial-content reviewer    |
| Legal or regulatory content | Legal/compliance reviewer               |
| Trade safety content        | Qualified trade or safety reviewer      |
| Assessment                  | Instructional designer + subject expert |
| Generated video             | Media producer                          |
| Custom voice                | Rights and consent approval             |
| Final course                | Final publisher                         |

## 17.3 Publication constraint

```ts
function canPublishCourse(course: Course, approvals: Approval[]): boolean {
  return (
    course.status === "approved" &&
    hasApproval(approvals, "curriculum") &&
    hasApproval(approvals, "subject_matter") &&
    hasApproval(approvals, "accessibility") &&
    hasApproval(approvals, "media") &&
    hasApproval(approvals, "publisher")
  );
}
```

Never provide an administrative bypass that silently suppresses required approvals.

---

# 18. Enterprise Content Governance

## 18.1 Versioning

Every published course version is immutable.

Updates create a new version.

```text
Course v1.0 — Published
Course v1.1 — Draft revision
Course v1.1 — Approved
Course v1.1 — Published
Course v1.0 — Retained for audit
```

## 18.2 Required records

Retain:

* Source packages
* Generated drafts
* Reviewer comments
* Approval decisions
* Prompt-template versions
* Model identifiers
* Media manifests
* Accessibility reports
* Publication records
* Retirement records

## 18.3 Review cadence

Suggested:

* Financial and regulatory courses: review at least annually
* Safety-sensitive trade content: review at least annually
* Operational courses: every 12 to 18 months
* Foundational evergreen content: every 18 to 24 months
* Immediate review when an authoritative standard changes

---

# 19. Course Catalog and Pricing

## School of Homeownership

* Becoming a Homeowner — $299
* Understanding Credit — $299
* Budgeting for Ownership — $299
* Mortgage Fundamentals — $399
* Down Payment Strategies — $399
* Reading a Home Inspection — $399
* Closing on Your Home — $499
* Protecting Your Investment — $499

## School of Property Management

* Guest Experience Systems — $399
* Owner Reporting — $399
* Vacation Rental Management — $499
* Revenue Optimization — $599
* Property Operations — $599
* Building a Property Management Company — $899

## School of Property Services

* Professional Cleaning Systems — $299
* Vacation Rental Turnovers — $399
* Construction Cleanup — $399
* Commercial Cleaning Operations — $499
* Facilities Operations — $699

## School of Skilled Trades

* Skilled Trades Foundations — $299
* Construction Safety — $399
* Carpentry Essentials — $599
* Electrical Fundamentals — $699
* Plumbing Fundamentals — $699
* HVAC Systems — $699
* Construction Management — $899

Theory-based digital courses do not replace required licensing, supervised practical training or jurisdiction-specific trade qualifications.

## School of Community Development

* Community Revitalization — $599
* Housing Development Fundamentals — $699
* Property Acquisition — $699
* Workforce Development — $699
* Affordable Housing — $799
* Real Estate Finance — $899
* Neighborhood Investment — $899

## School of Entrepreneurship

* Hiring Your First Team — $599
* Starting a Cleaning Company — $599
* Building a Service Business — $699
* Business Finance — $699
* Operations and Systems — $799
* Starting a Property Management Company — $899
* Scaling to Multiple Markets — $1,299

## Executive Education

* Building a Housing Organization — $1,299
* Leading Community Development — $1,299
* Public–Private Partnerships — $1,499
* Real Estate Leadership — $1,499
* Executive Development Program — $2,500

## Institutional Programs

Starting at $10,000 per licensed cohort.

Institutional pricing must be quote-based and support:

* Seat count
* Organization type
* Course package
* Facilitation level
* Reporting requirements
* Customization
* Term length
* Renewal terms

---

# 20. Learner Application Architecture

## 20.1 Core routes

```text
/academy
/academy/courses
/academy/schools/[school]
/academy/course/[slug]
/learn
/learn/course/[courseId]
/learn/course/[courseId]/chapter/[chapterId]
/learn/course/[courseId]/lesson/[lessonId]
/learn/action-plans
/learn/certificates
/account
/account/orders
/account/profile
```

## 20.2 Learning player layout

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Course title                                  Progress 42%   │
├───────────────────┬─────────────────────────────────────────┤
│ Chapter outline   │ Lesson video                            │
│                   │ Transcript                              │
│ Lesson status     │ Guided exercise                         │
│ Downloads         │ Knowledge check                         │
└───────────────────┴─────────────────────────────────────────┘
```

Mobile:

* Collapsible course outline
* Full-width media
* Persistent progress indicator
* Large touch targets
* Download controls
* Resume position
* Mobile action bar

## 20.3 Progress model

Track:

* Course started
* Lesson opened
* Video progress
* Transcript viewed
* Exercise completed
* Assessment attempted
* Assessment passed
* Action plan generated
* Course completed
* Certificate issued

Do not mark a lesson complete based only on video playback.

---

# 21. Institutional Platform

## 21.1 Organization model

```ts
export interface Organization {
  id: string;
  name: string;
  type:
    | "college"
    | "trade_school"
    | "municipality"
    | "housing_authority"
    | "nonprofit"
    | "employer"
    | "workforce_board"
    | "corporate";
  status: "prospect" | "active" | "suspended" | "expired";
}
```

## 21.2 Institutional capabilities

* Organization administrator
* Licensed course catalog
* Seat allocation
* Cohort creation
* Enrollment invitations
* Completion reporting
* Aggregate performance reporting
* Certificate verification
* Contract term tracking
* Renewal notifications
* Data-export controls

Institutional administrators must not see private learner responses unless the program contract, learner notice and access policy explicitly authorize it.

---

# 22. Security and Privacy Controls

## 22.1 Security baseline

Implement:

* Role-based access control
* Least privilege
* Server-side authorization
* Secure cookies
* CSRF protection where applicable
* Rate limiting
* Content Security Policy
* Input validation
* Malware scanning for uploads
* Signed media URLs
* Audit logging
* Secret scanning
* Dependency scanning
* Encryption in transit and at rest
* Backup and restoration testing

## 22.2 AI data controls

Never include the following in generation prompts unless specifically approved and required:

* Payment information
* Authentication credentials
* Government identifiers
* Full property-owner records
* Sensitive applicant narratives
* Unredacted legal documents
* Private learner responses
* Internal security data

Use redaction and data classification before generation.

## 22.3 Environment separation

Use distinct OpenAI projects or equivalent credential boundaries for:

* Development
* Staging
* Production
* Batch content production

Track usage and costs by project and workload. OpenAI provides organization usage and cost reporting that can support this operational separation and budget monitoring. ([OpenAI Platform][5])

---

# 23. Cost and Capacity Management

## 23.1 Cost attribution

Every generation job must store:

* Course ID
* Course version
* Lesson ID
* Job type
* Model
* Input size
* Output size
* Asset duration
* Estimated cost
* Actual cost
* Requesting user
* Budget center

## 23.2 Budget controls

Implement:

* Daily environment limits
* Per-course production budget
* Per-lesson regeneration limit
* Approval required above threshold
* Duplicate-generation detection
* Reuse of approved assets
* Lower-cost draft mode
* Higher-quality final mode

## 23.3 Batch processing

Use asynchronous batch execution for large, noninteractive workloads such as:

* Initial course-outline generation
* Metadata generation
* Assessment drafts
* Caption cleanup
* Catalog summaries
* Quality-evaluation runs

OpenAI’s Batch API supports asynchronous batches for supported endpoints and currently uses a 24-hour completion window, making it appropriate for noninteractive production queues rather than learner-facing requests. ([OpenAI Platform][6])

---

# 24. Quality Engineering

## 24.1 Automated curriculum checks

Validate:

* Required fields
* Objective coverage
* Assessment coverage
* Source identifiers
* Reading level
* Duplicate sections
* Unsupported claims
* Missing disclaimers
* Broken resource links
* Course-duration consistency
* Pricing configuration
* Publication state

## 24.2 AI output evaluations

Create evaluation datasets for:

* Factual grounding
* Source adherence
* Instructional clarity
* Brand voice
* Assessment validity
* Prohibited advice
* Hallucination rate
* Repetition
* Actionability
* Accessibility language

A generation prompt cannot be promoted to production unless it passes the evaluation threshold.

## 24.3 Media checks

Automate:

* Resolution validation
* Codec validation
* Audio loudness
* Caption presence
* Caption timing
* Black frames
* Frozen frames
* Duration mismatch
* Missing assets
* Thumbnail generation
* File corruption
* Transcript availability

## 24.4 Manual QA

Human reviewers must test:

* Desktop
* Tablet
* Mobile
* Keyboard-only use
* Screen-reader flow
* Captions
* Reduced motion
* Video controls
* Course resume
* Assessment recovery
* Payment recovery
* Certificate issuance

---

# 25. CI/CD Architecture

## 25.1 Pull-request pipeline

```text
Install dependencies
        ↓
Validate lockfile
        ↓
Format check
        ↓
Lint
        ↓
Type check
        ↓
Unit tests
        ↓
Integration tests
        ↓
Security scan
        ↓
Build
        ↓
Accessibility smoke tests
        ↓
End-to-end tests
        ↓
Preview deployment
        ↓
Visual review
```

## 25.2 Media pipeline deployment

Media workers must be independently deployable from the learner-facing application.

A media-worker failure must not take down:

* Public site
* Checkout
* Course playback
* Account access
* Existing media

## 25.3 Production deployment

Require:

* Successful staging deployment
* Database migration validation
* Smoke tests
* Change approval for high-risk releases
* Deployment record
* Rollback procedure
* Post-deployment verification

---

# 26. Observability

Track four categories.

## Application

* Request rates
* Error rates
* Latency
* Database performance
* Cache performance
* Authentication failures

## Learning

* Course starts
* Lesson completions
* Assessment failures
* Resume failures
* Certificate failures

## Commerce

* Checkout starts
* Payment success
* Payment failure
* Webhook failure
* Refund status

## Production pipeline

* Generation queue depth
* Generation failure rate
* Video-job duration
* Render failure rate
* Rejection rate
* Cost per course
* Regeneration frequency

Create alerts for:

* Elevated checkout failures
* Failed payment webhooks
* Stalled generation jobs
* Render-worker backlog
* Missing captions
* Certificate-generation failure
* Unexpected cost spikes
* Course publication without all approvals

---

# 27. Codex Execution Model

Codex tasks should be narrow, testable and milestone-based.

Do not issue:

> Build the entire Honorary Homes Academy.

Use:

> Implement Course Domain Phase 1 according to `docs/product-specs/course-domain.md`. Do not add media generation or checkout in this task.

Each Codex task must identify:

* Source specification
* Scope
* Out-of-scope work
* Acceptance criteria
* Required tests
* Required documentation
* Allowed dependencies
* Security considerations
* Expected completion report

---

# 28. Master Codex Bootstrap Prompt

You are the principal software engineer for Honorary Homes Academy.

Honorary Homes Academy is an enterprise professional-education platform serving homeowners, property professionals, skilled-trade learners, community-development practitioners, entrepreneurs and institutional clients.

Read before changing code:

* `AGENTS.md`
* `ARCHITECTURE.md`
* `docs/product-specs/`
* `docs/curriculum-standards/`
* `docs/media-standards/`
* `docs/security/`
* `docs/exec-plans/active/`

First inspect and report:

1. Current repository architecture
2. Application boundaries
3. Existing data models
4. Existing authentication
5. Existing CMS integration
6. Existing tests
7. Existing CI/CD
8. Security gaps
9. Missing environment configuration
10. Recommended implementation sequence

Then implement only the approved foundation milestone:

* Monorepo configuration
* TypeScript strict mode
* Shared configuration
* Design-token package
* Shared UI package
* Database package
* Environment validation
* Unit-test framework
* Playwright
* Storybook
* CI workflow
* Security headers
* Structured logging
* Health endpoint
* Documentation skeleton

Do not build checkout, course generation, video generation or learner dashboards in this milestone.

Do not invent course content, statistics, partners or properties.

Before completion:

* Format
* Lint
* Type check
* Run unit tests
* Run integration tests
* Run end-to-end smoke tests
* Run production build
* Review the diff
* Update documentation

Report:

* Files changed
* Commands executed
* Test results
* Architecture decisions
* Security implications
* Known limitations
* Recommended next milestone

---

# 29. Codex Prompt: Module-to-Course Migration

Implement the module-to-course migration domain.

Read:

* `docs/product-specs/course-domain.md`
* `docs/curriculum-standards/module-conversion.md`
* `docs/security/ai-content.md`

Build:

1. Source-module import schema
2. Module classification service
3. Course-proposal schema
4. School assignment rules
5. Pricing-tier rules
6. Learning-objective schema
7. Source-coverage report
8. Review-flag schema
9. Human approval workflow
10. Migration audit trail

Requirements:

* Use strict schemas.
* Do not publish generated results.
* Persist every proposal as a draft.
* Record source-module lineage.
* Require an explicit reviewer decision.
* Make migration idempotent.
* Reject duplicate SKUs and slugs.
* Preserve original source references.
* Add unit and integration tests.
* Add fixtures covering thin, duplicate and unsupported modules.

Out of scope:

* Lesson video generation
* Checkout
* Learner enrollment
* Certificates

---

# 30. Codex Prompt: Course Generation Service

Implement the AI-assisted course-generation service.

The OpenAI API will power generation. Credentials must remain server-side and must never be exposed to browser code or logs.

Build:

* Generation-request API
* Durable background job
* Prompt-template registry
* Source-package loader
* Structured-output schema
* Generation manifest
* Validation pipeline
* Cost attribution
* Retry policy
* Dead-letter state
* Human-review queue

Generation stages:

* Curriculum outline
* Lesson manuscript
* Guided exercises
* Assessments
* Media plan
* Metadata

Requirements:

* No autonomous publication.
* Validate source IDs.
* Reject unsupported citations.
* Record model and prompt version.
* Hash request and output.
* Apply course budget limits.
* Redact prohibited data.
* Add request IDs.
* Add structured logs.
* Add integration tests using mocked provider responses.
* Add an evaluation fixture set.

Do not include real credentials in fixtures or documentation.

---

# 31. Codex Prompt: Video Production Pipeline

Implement the Honorary Homes lesson-video production pipeline.

Build:

1. Lesson video-plan schema
2. Scene classification
3. Generated-video job adapter
4. Narration-generation adapter
5. Asset approval workflow
6. FFmpeg timeline compiler
7. Caption packaging
8. Thumbnail generation
9. HLS and MP4 outputs
10. Media quality validation
11. Storage adapter
12. Signed playback URLs
13. Job progress API
14. Internal production console

Requirements:

* Generated video scenes are short illustrative clips only.
* Full lessons are assembled deterministically.
* Every generated clip requires quality review.
* Record provider job IDs without exposing them publicly.
* Support cancellation and retry.
* Ensure job idempotency.
* Use checksums to avoid duplicate renders.
* No long-running work in web handlers.
* Do not publish media without captions.
* Do not create a human digital replica.
* Add unit, integration and worker tests.
* Provide a local fixture mode that requires no external generation.

Acceptance criteria:

* An approved script can compile into a complete preview video.
* Failed scenes can be regenerated independently.
* Existing approved scenes are not regenerated unnecessarily.
* The final video includes narration, typography, captions and branding.
* The pipeline reports cost and duration.
* The player can stream the final approved asset.

---

# 32. Codex Prompt: Learner Experience

Implement the authenticated Honorary Homes learning experience.

Build:

* Course dashboard
* Resume learning
* Chapter navigation
* Accessible video player
* Transcript panel
* Guided exercise forms
* Autosave
* Knowledge checks
* Assessment flow
* Progress calculation
* Action-plan generation request
* Download center
* Certificate eligibility

Requirements:

* Do not mark completion from video playback alone.
* Save progress server-side.
* Support keyboard and screen readers.
* Provide visible focus states.
* Respect reduced motion.
* Support caption selection.
* Preserve answers across sessions.
* Do not send private answers to analytics.
* Provide failure recovery.
* Add end-to-end tests for purchase-to-completion flow.

---

# 33. Codex Prompt: Enterprise Administration

Build the internal Academy administration console.

Capabilities:

* Course inventory
* Course versioning
* Source-package management
* Generation requests
* Draft comparisons
* Reviewer assignments
* Approval queue
* Media production status
* Cost reporting
* Publication scheduling
* Course retirement
* Cohort licensing
* Enrollment reporting
* Audit log

Requirements:

* Role-based authorization.
* Server-side permission checks.
* Immutable publication records.
* No destructive deletion of published versions.
* Downloadable audit reports.
* Accessible tables.
* Filtering and pagination.
* Bulk actions require confirmation.
* High-risk actions require step-up authorization where supported.

---

# 34. Definition of Done

The Academy is not complete because pages render or generated videos play.

A feature is complete only when:

* Product acceptance criteria pass.
* Security boundaries are enforced.
* Human approval gates work.
* Accessibility is validated.
* Failure states exist.
* Tests pass.
* Monitoring exists.
* Costs are attributable.
* Documentation is updated.
* Rollback is possible.
* Personal data is protected.
* Generated content is traceable.
* Published content has approved sources.
* No unsupported claims are visible.
* No media is published without captions.
* No certificate is issued without completion rules being satisfied.

---

# 35. Final Engineering Directive

Build Honorary Homes Academy as a controlled enterprise publishing and learning platform.

Do not treat AI generation as the product.

The product is the governed system surrounding generation:

* Approved sources
* Professional curriculum design
* Human judgment
* Media quality
* Accessibility
* Secure delivery
* Measurable learning
* Operational accountability
* Version control
* Institutional trust

AI should reduce production friction while the platform preserves authorship, standards, review, safety and quality.

That is the difference between an AI course generator and a Fortune 500-grade professional education operation.

The document can serve as:

```text
docs/product-specs/HONORARY_ACADEMY_AI_PLATFORM_SPEC.md
```

The **module-to-course migration** should be the first curriculum milestone after the repository and design-system foundation. The media pipeline should follow only after the course domain, source governance and human approval workflow are operational.

[1]: https://openai.com/index/introducing-codex/?utm_source=chatgpt.com "Introducing Codex | OpenAI"
[2]: https://platform.openai.com/docs/api-reference/evals/deleteRun?lang=python&utm_source=chatgpt.com "Evals | OpenAI API Reference"
[3]: https://platform.openai.com/docs/api-reference/videos?lang=csharp&utm_source=chatgpt.com "Videos | OpenAI API Reference"
[4]: https://platform.openai.com/docs/api-reference/audio/speech-audio-done-event?lang=curl&utm_source=chatgpt.com "Audio | OpenAI API Reference"
[5]: https://platform.openai.com/docs/api-reference/usage/audio_transcriptions_object?utm_source=chatgpt.com "Usage | OpenAI API Reference"
[6]: https://platform.openai.com/docs/api-reference/batch/object?api-mode=responses&utm_source=chatgpt.com "Batch | OpenAI API Reference"
