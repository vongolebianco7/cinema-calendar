# Ocean Living Ecosystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace equal-size fish placement with a deterministic living-ecosystem scene whose organisms and habitat visibly grow from viewing/rating history.

**Architecture:** Add a pure scene-model module between records and the renderer, then make the immersive renderer consume that model. Add a focused CSS layer for habitat composition and iPhone-safe organism variation, reusing existing local Ocean art assets.

**Tech Stack:** Vanilla JavaScript, CSS, existing static WebP assets, Node tests/CI, Playwright mobile validation.

**Spec:** `docs/superpowers/specs/2026-09-28-ocean-living-ecosystem-design.md`

## Global Constraints
- Fully local/static runtime; no new API, scraping, dependency, tracker or external request.
- iPhone/390px primary; no page-level horizontal overflow.
- Preserve existing recording/navigation flows.
- PR only; no automatic merge/deploy.

## Review Focus
- Empty records render a valid quiet ocean without exceptions.
- Missing rating does not hide a watched film.
- Identical input yields identical scene output.
- 5.0 prominence does not make controls overflow at 390px.
- Large histories cap visual population/density to protect mobile performance.

---

### Task 1: Pure ecosystem scene model

**Files:**
- Create: `preview/ocean/js/ocean-ecosystem.js`
- Create: `preview/ocean/tests/ocean-ecosystem.test.cjs`

**Interfaces:**
- Consumes: `CinemapOceanModel.speciesFor(film)`, catalog, records.
- Produces: `CinemapOceanEcosystem.build(catalog, records)` returning `{maturity, habitat, organisms}`.

- [ ] Write deterministic tests for empty, 10/30/100-film maturity, stable organism traits, rating prominence and visual-population cap.
- [ ] Run the focused Node test and verify it fails before the module exists.
- [ ] Implement the minimal pure scene builder.
- [ ] Run focused tests and verify they pass.

### Task 2: Living renderer and habitat composition

**Files:**
- Modify: `preview/ocean/js/ocean-immersive.js`
- Create: `preview/ocean/js/ocean-living.css`
- Modify: `preview/ocean/index.html`
- Modify: `preview/ocean/ocean-demo.html`

**Interfaces:**
- Consumes: `CinemapOceanEcosystem.build()` scene.
- Produces: layered DOM using `--growth`, `--reef`, organism `--size`, `--z`, `--speed`, `--x`, `--y`, `--dir`.

- [ ] Load the scene module and focused stylesheet before the immersive renderer.
- [ ] Render `growth-reef-mobile.webp` / `growth-reef.webp` as a maturity-controlled habitat layer.
- [ ] Render bounded organism population with scene-provided scale/depth/speed instead of a common size formula.
- [ ] Keep tap-to-film detail and swipe exploration intact.
- [ ] Add 390px/reduced-motion safeguards.

### Task 3: Deterministic validation and PR

**Files:**
- No product files unless a deterministic failure requires repair.

- [ ] Run/observe `python scripts/quality_gate.py` through the existing Autonomous quality gate.
- [ ] Run/observe existing mobile browser validation in CI.
- [ ] Repair deterministic failures up to three attempts.
- [ ] Open one PR summarizing the ecosystem change, tests and remaining visual uncertainty.
- [ ] Do not merge automatically; request human review only after checks pass.
