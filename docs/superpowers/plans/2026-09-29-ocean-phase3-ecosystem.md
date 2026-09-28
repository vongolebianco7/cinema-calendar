# Ocean Phase 3 Ecosystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the polygon-demo feel with a deterministic, living marine ecosystem that visibly matures with movie records on iPhone.

**Architecture:** Keep the existing Three.js renderer boundaries and evolve environment, creature profiles, schooling and quality rather than introducing another renderer. Add deterministic scene metadata so CI can prove maturity/density/diversity without brittle pixel matching.

**Tech Stack:** JavaScript, Three.js, Playwright, existing GitHub Actions quality gate.

**Spec:** `docs/superpowers/specs/2026-09-29-ocean-phase3-ecosystem-design.md`

## Global Constraints
- iPhone primary target; acceptance viewport 390x844.
- Completely free; no paid/metered/AI runtime APIs.
- No scraping or unnecessary external runtime requests.
- Same records must generate the same ecosystem.
- Preserve Phase 2 rating -> visible growth -> reload persistence.
- Renderer failure leaves dashboard usable.
- Follow AGENTS.md, COMPLIANCE.md and docs/free-only-policy.md.

## Review Focus
- Empty/0-record state must not fabricate a mature ecosystem.
- 100-record state must remain performant and visually populated, not merely increase object count uniformly.
- Repeated records must not produce synchronized clones or identical silhouettes.
- Renderer/WebGL failure must not hide dashboard/local records.
- 390x844 must not create page-level horizontal overflow.

---

### Task 1: Deterministic ecosystem maturity contract

**Files:**
- Modify: `preview/ocean/renderer/src/creature-profiles.js`
- Modify: `preview/ocean/renderer/src/quality.js`
- Test: existing renderer/model tests plus Phase 3 fixture assertions

**Interfaces:**
- Consumes: Phase 2 ecosystem state.
- Produces: deterministic creature profile traits and quality/maturity caps used by environment and schooling.

- [ ] Add failing tests for 0/10/30/100 fixtures and deterministic repeated output.
- [ ] Run deterministic tests and confirm RED.
- [ ] Define profile traits for silhouette family, scale band, depth band, speed, turn radius, grouping and rarity; define maturity-aware caps.
- [ ] Run deterministic tests and confirm GREEN.
- [ ] Commit.

### Task 2: Continuous habitat composition

**Files:**
- Modify: `preview/ocean/renderer/src/environment.js`
- Test: Phase 3 scene metadata assertions

**Interfaces:**
- Consumes: maturity/environment density and quality caps from Task 1.
- Produces: foreground/mid/distant habitat layers plus inspectable counts/metadata.

- [ ] Add failing assertions that 0/10/30/100 have monotonically richer habitat and that 100 includes foreground reef, vegetation and distant depth cues.
- [ ] Confirm RED.
- [ ] Replace regular placement with seeded habitat patches across foreground/mid/distant depth; scale reef, vegetation, particles and light treatment by maturity.
- [ ] Confirm GREEN and no Phase 1/2 regression.
- [ ] Commit.

### Task 3: Silhouette-diverse marine life

**Files:**
- Modify: `preview/ocean/renderer/src/creatures.js`
- Modify: `preview/ocean/renderer/src/creature-profiles.js`
- Test: Phase 3 creature diversity assertions

**Interfaces:**
- Consumes: profile traits from Task 1.
- Produces: visually distinct small-school, medium and large/rare creature meshes with shared reusable geometry/materials where possible.

- [ ] Add failing test requiring multiple silhouette/scale bands in mature fixture.
- [ ] Confirm RED.
- [ ] Implement distinct procedural silhouettes/body proportions and shared low-cost distant variants; avoid recolor-only diversity.
- [ ] Confirm GREEN.
- [ ] Commit.

### Task 4: Natural schooling and motion

**Files:**
- Modify: `preview/ocean/renderer/src/schooling.js`
- Modify: `preview/ocean/renderer/src/creatures.js`
- Test: deterministic schooling/motion metadata assertions

**Interfaces:**
- Consumes: grouping, speed, depth and turn-radius traits.
- Produces: loose schools for small life, independent medium movement and wide slow paths for large life.

- [ ] Add failing assertions that mature fixtures include a school and multiple motion profiles without synchronized phase.
- [ ] Confirm RED.
- [ ] Implement seeded individual offsets/phases around shared school headings plus independent/wide-path motion classes.
- [ ] Confirm GREEN.
- [ ] Commit.

### Task 5: Mature-scene density and underwater finish

**Files:**
- Modify: `preview/ocean/renderer/src/environment.js`
- Modify: `preview/ocean/renderer/src/main.js`
- Modify: `preview/ocean/renderer/src/quality.js`
- Test: mature-scene and iPhone quality assertions

**Interfaces:**
- Consumes: Tasks 1-4 scene layers.
- Produces: coherent depth fog, restrained caustics/shafts/particles and mature density within iPhone caps.

- [ ] Add failing mature-fixture assertions for foreground habitat + school + multiple scales + distant life simultaneously.
- [ ] Confirm RED.
- [ ] Tune depth/color/light and quality caps so 100 records is populated into the background without opaque fog or particle-cloud appearance.
- [ ] Confirm GREEN on deterministic and renderer tests.
- [ ] Commit.

### Task 6: Phase 3 iPhone acceptance gate

**Files:**
- Modify: `scripts/ocean_persistence_smoke.mjs`
- Modify/create existing renderer smoke fixture only as needed.

**Interfaces:**
- Consumes: complete Phase 3 renderer.
- Produces: merge-blocking evidence for maturity differentiation, Phase 2 persistence, renderer fallback and iPhone layout safety.

- [ ] Extend Playwright fixture to exercise 0/10/30/100 deterministic records and inspect Phase 3 scene metadata.
- [ ] Verify old renderer fails the new acceptance assertions where reproducible.
- [ ] Run Autonomous quality gate locally/CI: deterministic checks and iPhone smoke must pass.
- [ ] Verify renderer-failure fallback and no page-level overflow at 390x844.
- [ ] Commit and open PR.

### Task 7: Preview, merge and production verification

**Files:** none unless a verified regression requires repair.

**Interfaces:**
- Consumes: green PR from Task 6.
- Produces: Phase 3 on main and production.

- [ ] Verify PR CI is fully green.
- [ ] Verify preview renders mature ecosystem and no fatal console/page error.
- [ ] Merge only after agreed autonomous quality gate succeeds.
- [ ] Verify main deployment succeeds.
- [ ] Verify production Ocean URL itself renders dashboard + 3D ecosystem at iPhone viewport.
- [ ] Only then mark Phase 3 100% and provide the production confirmation link.