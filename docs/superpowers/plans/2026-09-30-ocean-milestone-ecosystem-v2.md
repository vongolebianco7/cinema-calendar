# Ocean Milestone Ecosystem v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace low-quality one-off milestone creatures with a high-quality, habitat-aware reward ecosystem that grows from 25 to 1500 watched films without regressing Ocean performance.

**Architecture:** Keep the existing hybrid Ocean renderer and exact-population invariant. Split milestone logic into a deterministic reward model, dedicated local milestone assets, hero rendering rules, and a developer-only gallery/preview surface. Recurring small/medium milestone species replace ordinary creatures at deterministic logical indices; large species occupy scarce DOM hero slots while ordinary population remains on Canvas.

**Tech Stack:** Vanilla JavaScript, HTML/CSS, Canvas 2D, local image assets, Node.js tests, Playwright Chromium/WebKit smoke tests.

**Spec:** `docs/superpowers/specs/2026-09-30-ocean-milestone-ecosystem-v2-design.md`

## Global Constraints

- Completely free: no paid API, metered API, paid database, or runtime AI dependency.
- No unnecessary scraping or repeated external access.
- Preserve the approved high-resolution Ocean background and HUD-outside-ocean behavior.
- Preserve `N watched films = N total logical creatures` exactly.
- Preserve record persistence and existing 500-creature hybrid performance behavior.
- No final milestone creature may use a crude inline SVG, generic fish body, or another species as a substitute.
- iPhone remains the primary runtime target.
- First milestone unlocks are fixed: 25 clownfish, 50 sea turtle, 75 seahorse, 100 ocean sunfish.

## Review Focus

- Counts below, exactly at, and just above each milestone must not duplicate or skip rewards.
- Recurring milestone species must replace ordinary creatures without changing total logical population.
- 500–1500 scenes must keep DOM hero count capped and avoid moving the ordinary population back into DOM.
- Missing or failed milestone assets must fail visibly in development rather than silently substitute the wrong animal.
- Large animals must not cover the HUD or make controls unusable at 390×844 iPhone size.

---

### Task 1: Deterministic milestone reward model

**Files:**
- Create: `preview/ocean/real-fish/milestone-rewards.js`
- Modify: `preview/ocean/real-fish/milestone-stars.js`
- Test: `tests/ocean-milestone-rewards.test.cjs`

**Interfaces:**
- Produces: `window.CinemapOceanMilestoneRewards.rewardsForCount(count)` → ordered reward instances `{key,label,unlockAt,ordinal,role,habitat,scaleClass}`.
- Produces: `window.CinemapOceanMilestoneRewards.heroRewardsForCount(count)` for large/hero animals.
- Consumes: no renderer details.

- [ ] **Step 1: Write failing reward-model tests**
  - Assert 24→no special reward, 25→1 clownfish, 50→clownfish+turtle, 75→+seahorse, 100→+sunfish.
  - Assert clownfish ordinals at 25/125/225, turtle at 50/250/450, seahorse at 75/275/475.
  - Assert large ladder at 150 octopus, 200 manta, 300 dolphin, 400 hammerhead, 500 large shark, 600 dugong, 700 minke whale, 800 orca, 1000 humpback, 1200 whale shark, 1500 blue whale.
  - Assert reward count never exceeds movie count.

- [ ] **Step 2: Run the focused test and verify failure**
  - Run: `node --test tests/ocean-milestone-rewards.test.cjs`
  - Expected: FAIL because the new reward model does not exist.

- [ ] **Step 3: Implement the minimal deterministic reward model**
  - Encode fixed first unlocks, recurring cadences, and large ladder in data rather than conditional renderer code.
  - Keep `milestone-stars.js` only as a compatibility adapter during migration; remove inline generated SVG assets from final production path.

- [ ] **Step 4: Re-run focused tests**
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - `git commit -m "feat(ocean): model recurring milestone rewards"`

### Task 2: Dedicated milestone asset catalog and quality gate

**Files:**
- Create: `preview/ocean/real-fish/milestone-assets.json`
- Create/Update: `preview/ocean/real-fish/optimized/milestone-*` local transparent assets
- Modify: `preview/ocean/real-fish/ASSET_PROVENANCE.md`
- Test: `tests/ocean-milestone-assets.test.cjs`

**Interfaces:**
- Consumes: reward keys from Task 1.
- Produces: per-key asset metadata `{src,widthClass,habitat,motion,presentationScale}`.

- [ ] **Step 1: Write failing asset-manifest tests**
  - Every approved species key must have exactly one local production asset.
  - Asset path must not be a data URI, generic fish asset, or another species' path.
  - Every asset must declare provenance/license notes where required.

- [ ] **Step 2: Run test and verify failure**
  - Run: `node --test tests/ocean-milestone-assets.test.cjs`.

- [ ] **Step 3: Create/source dedicated local assets before integration**
  - Species: clownfish, sea turtle, seahorse, ocean sunfish, giant octopus, manta ray, dolphin, hammerhead shark, large shark, dugong, minke whale, orca, humpback whale, whale shark, blue whale.
  - Normalize transparent crop and presentation framing for iPhone; no substitute species.

- [ ] **Step 4: Add catalog metadata and provenance**
  - Define visual scale classes so small habitat species stay small while whales are cinematic hero scale.

- [ ] **Step 5: Run asset tests**
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - `git commit -m "feat(ocean): add production milestone creature assets"`

### Task 3: Milestone gallery before ecosystem integration

**Files:**
- Create: `preview/ocean/real-fish/milestone-gallery.html`
- Create: `preview/ocean/real-fish/milestone-gallery.js`
- Test: `scripts/ocean_milestone_gallery_smoke.mjs`

**Interfaces:**
- Consumes: Task 1 reward keys and Task 2 asset metadata.
- Produces: development-only isolated preview for every milestone species at intended scale.

- [ ] **Step 1: Write failing Playwright gallery smoke test**
  - At 390×844, each species must render one recognizable asset container, remain inside the usable stage, and have no duplicate tail/body copy.
  - Verify no gold rectangular outline.

- [ ] **Step 2: Run smoke test and verify failure**
  - Run: `node scripts/ocean_milestone_gallery_smoke.mjs`.

- [ ] **Step 3: Implement the gallery**
  - Add selector/cards for all milestone species using the same asset metadata and sizing rules intended for production.
  - Keep it development-only and outside the main user navigation.

- [ ] **Step 4: Run gallery smoke test**
  - Expected: PASS in Chromium and WebKit where the existing CI harness supports both.

- [ ] **Step 5: Commit**
  - `git commit -m "feat(ocean): add milestone creature quality gallery"`

### Task 4: Habitat-aware hero integration with exact population semantics

**Files:**
- Modify: `preview/ocean/real-fish/photo-four-points.js`
- Modify: `preview/ocean/real-fish/performance-renderer.js` (or the existing hybrid-renderer file if named differently in the branch)
- Modify: `preview/ocean/real-fish/ecosystem.html`
- Test: `tests/ocean-photo-four-points.test.cjs`
- Test: `tests/ocean-milestone-integration.test.cjs`

**Interfaces:**
- Consumes: `rewardsForCount(count)` and Task 2 asset metadata.
- Produces: exact logical population with deterministic milestone replacement and hero-slot assignment.

- [ ] **Step 1: Write failing integration tests**
  - 25/50/75/100/125 exact milestone composition.
  - 500 logical creatures still total exactly 500 with all unlocked rewards replacing ordinary fish.
  - 1500 logical creatures still total exactly 1500.
  - Large rewards use hero DOM slots; ordinary overflow remains Canvas-backed.

- [ ] **Step 2: Run tests and verify failure**
  - Run: `node --test tests/ocean-photo-four-points.test.cjs tests/ocean-milestone-integration.test.cjs`.

- [ ] **Step 3: Replace milestone rendering path**
  - Remove legacy `milestone % 100` replacement behavior.
  - Map deterministic reward instances onto logical population indices.
  - Reserve DOM hero slots first for active milestone animals, then fill remaining DOM allowance with ordinary foreground creatures.

- [ ] **Step 4: Add habitat-specific positioning/motion classes**
  - Reef/anemone: clownfish.
  - Reef edge/open mid-water: turtles.
  - Reef vegetation: seahorse.
  - Open mid-water: sunfish.
  - Seabed/rock: octopus.
  - Open glide: manta.
  - Upper-mid: dolphin.
  - Open mid-water: sharks.
  - Shallow/seagrass-like: dugong.
  - Large open-water routes: whales/orca/whale shark.

- [ ] **Step 5: Run focused tests**
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - `git commit -m "feat(ocean): integrate habitat-aware milestone ecosystem"`

### Task 5: Preview states through 1500 films

**Files:**
- Modify: `preview/ocean/real-fish/ecosystem.html`
- Modify: `scripts/ocean_visual_smoke.mjs`
- Test: `tests/ocean-preview-counts.test.cjs`

**Interfaces:**
- Consumes: existing preview override behavior.
- Produces: direct states for 25, 50, 75, 100, 150, 200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500.

- [ ] **Step 1: Write failing preview-state tests**
  - Assert every required preview button/state exists and selecting it drives exact logical population regardless of saved record count.

- [ ] **Step 2: Run test and verify failure**
  - Run: `node --test tests/ocean-preview-counts.test.cjs`.

- [ ] **Step 3: Extend preview controls without changing normal record-driven behavior**
  - Keep preview override isolated to the preview controls; normal production count still comes from records.

- [ ] **Step 4: Extend visual smoke scenarios**
  - Include at least 25, 125, 500, 1000, and 1500 states.

- [ ] **Step 5: Run tests**
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - `git commit -m "feat(ocean): preview milestone ecosystem through 1500 films"`

### Task 6: Performance and regression gate

**Files:**
- Modify: `scripts/ocean_visual_smoke.mjs`
- Modify: existing Ocean performance contract tests
- Modify: `.github/workflows/*` only if required to add the new smoke script to the existing autonomous quality gate.

**Interfaces:**
- Consumes: final integrated renderer.
- Produces: regression evidence for responsiveness, DOM cap, exact population, persistence, and iPhone layout.

- [ ] **Step 1: Add failing regression assertions**
  - 500, 1000, and 1500 scenes keep the hero/foreground DOM count capped at the renderer budget.
  - Canvas logical count plus DOM logical count equals requested population.
  - HUD remains outside Ocean stage and controls remain tappable at 390×844.
  - Preview switching does not leak duplicate canvases, duplicate hero animals, or animation loops.

- [ ] **Step 2: Run the full local quality gate and capture failures**
  - Run the repository's shared quality-gate command plus `node scripts/ocean_visual_smoke.mjs` and `node scripts/ocean_milestone_gallery_smoke.mjs`.

- [ ] **Step 3: Make only the minimal performance/regression fixes required**
  - Preserve the single animation loop and reduced far-layer update frequency.
  - Do not solve performance by hiding logical creatures or lowering requested population.

- [ ] **Step 4: Re-run the complete test suite**
  - Expected: deterministic tests PASS, Chromium PASS, WebKit PASS, persistence PASS, Ocean visual gate PASS.

- [ ] **Step 5: Open PR and wait for all CI gates**
  - PR must describe exact milestone rules, asset-quality gate, 1500 preview coverage, and performance preservation.

- [ ] **Step 6: Merge only after all required checks succeed**
  - Use the agreed autonomous merge rule; do not merge if any Ocean gate is red.
