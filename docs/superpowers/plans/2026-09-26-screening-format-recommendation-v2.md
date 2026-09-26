# Screening Format Recommendation v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current screening-format recommendation with evidence-backed scoring, explicit reasons, fixed display order, correct Dolby hierarchy, and resilient loading behavior.

**Architecture:** Keep the existing static-site structure. Add a small evidence dataset for format-specific facts, centralize scoring/reason generation in the film detail page logic, and make recommendation rendering independent from the base movie metadata load so one failure cannot leave the page stuck.

**Tech Stack:** HTML/CSS/vanilla JavaScript, JSON data files, Python validation scripts, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-26-screening-format-recommendation-design.md`

## Global Constraints
- Canonical display order: `通常上映 → IMAX → Dolby Cinema → 4DX / MX4D → ScreenX`.
- Dolby Atmos is a supporting audio attribute, not a peer top-level format.
- Premium recommendations require verifiable film-specific evidence.
- Unknown evidence must lower confidence rather than be guessed.
- Every displayed recommendation must include a reason.
- The UI must never remain indefinitely at `作品を読み込み中…`.
- No prohibited scraping; prefer official/allowed sources.

## Review Focus
- Missing format evidence must not produce high premium scores.
- Partial movie-data failure must not block the whole page.
- IMAX DMR-only titles must be allowed to rank below standard.
- Dolby Atmos-only evidence must not be rendered as Dolby Cinema.
- Fixed display order must remain stable even when recommendation winner changes.

---

### Task 1: Add regression gates for recommendation semantics

**Files:**
- Modify: `scripts/check_critic_map.py` or the existing detail-page validation script that owns screening-format checks
- Test: GitHub Actions `Validate frontend`

**Interfaces:**
- Consumes: current film detail markup/JS.
- Produces: failing checks for fixed order, reason text, Dolby hierarchy, and loading fallback.

- [ ] **Step 1: Write failing validation assertions**
  - Require fixed format order tokens.
  - Require reason rendering for every top-level format card.
  - Reject Atmos as a top-level peer card.
  - Require timeout/error/retry handling for movie load.

- [ ] **Step 2: Run Validate frontend and verify RED**
  - Expected: failure in the new screening-format assertions.

- [ ] **Step 3: Commit the failing checks**

### Task 2: Add evidence-backed screening metadata

**Files:**
- Create: `data/screening_format_evidence.json`
- Modify: `critic.html` or the film-detail page that currently renders `どの上映方式で見る？`

**Interfaces:**
- Consumes: film id / TMDB id already used by detail page.
- Produces: per-film evidence fields from the spec and a neutral `unknown` fallback.

- [ ] **Step 1: Add minimal evidence schema with representative fixtures**
  - Include at least one IMAX-expanded example, one DMR-only/weak-IMAX example, one Dolby Vision + Atmos example, and one unknown example.

- [ ] **Step 2: Implement safe evidence lookup with unknown defaults**

- [ ] **Step 3: Run syntax/data-source checks**
  - Expected: pass.

- [ ] **Step 4: Commit evidence model**

### Task 3: Implement scoring and reason generation

**Files:**
- Modify: `critic.html`

**Interfaces:**
- Consumes: screening evidence object.
- Produces: score 1–5, verdict, confidence, reasons for Standard / IMAX / Dolby Cinema / 4DX-MX4D / ScreenX; optional 3D attribute.

- [ ] **Step 1: Implement IMAX rules from the spec**
  - Expanded 1.90/1.43 + IMAX camera evidence can reach 5.
  - DMR-only without expanded framing stays low.

- [ ] **Step 2: Implement Dolby Cinema rules**
  - Dolby Vision + Atmos together drive Dolby Cinema score.
  - Atmos alone appears only as a supporting attribute.

- [ ] **Step 3: Implement Standard, 4DX/MX4D, ScreenX, and optional 3D scoring**

- [ ] **Step 4: Generate reasons only from evidence that affected the score**

- [ ] **Step 5: Run regression checks and verify GREEN**

- [ ] **Step 6: Commit scoring logic**

### Task 4: Render fixed-order recommendation UI

**Files:**
- Modify: `critic.html`

**Interfaces:**
- Consumes: scored recommendation objects.
- Produces: stable top-level cards in canonical order with recommendation badge, stars, verdict, reasons, confidence, and evidence links when available.

- [ ] **Step 1: Render canonical order independent of score rank**

- [ ] **Step 2: Add `おすすめ` badge to winner without moving its card**

- [ ] **Step 3: Render Atmos beneath Dolby Cinema / sound details, never as a peer card**

- [ ] **Step 4: Verify mobile layout and no horizontal page overflow**

- [ ] **Step 5: Commit UI changes**

### Task 5: Eliminate endless `作品を読み込み中…`

**Files:**
- Modify: `critic.html`

**Interfaces:**
- Consumes: existing movie fetch and recommendation fetch/load paths.
- Produces: bounded loading time, visible error state, retry action, partial rendering when only recommendations fail.

- [ ] **Step 1: Add explicit timeout around movie/recommendation loading**

- [ ] **Step 2: Add error state and retry control**

- [ ] **Step 3: Decouple basic movie metadata rendering from recommendation rendering**

- [ ] **Step 4: Run regression checks for failure path**

- [ ] **Step 5: Commit loading resilience**

### Task 6: Full verification and merge

**Files:**
- No new production files expected.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified branch ready for merge.

- [ ] **Step 1: Run full `Validate frontend` workflow**
  - Expected: all checks success.

- [ ] **Step 2: Open the deployed preview / GitHub Pages equivalent and verify a representative IMAX title, a non-IMAX-benefit title, a Dolby title, and an unknown title**

- [ ] **Step 3: Verify `作品を読み込み中…` no longer persists on failure**

- [ ] **Step 4: Create PR and review diff for regressions**

- [ ] **Step 5: Merge after green CI and visual verification**
