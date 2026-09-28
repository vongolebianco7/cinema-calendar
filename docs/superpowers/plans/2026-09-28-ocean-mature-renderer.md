# Ocean Mature Renderer Implementation Plan

> **For implementers:** Follow the approved spec in `docs/superpowers/specs/2026-09-28-ocean-mature-renderer-design.md`. Use TDD for behavior changes. Do not merge/publish until visual review clears the iPhone bar.

**Goal:** Replace the current CSS/sprite Ocean presentation with a real WebGL underwater ecosystem whose atmosphere and motion feel materially closer to a mature ocean simulator while preserving Cinemap's ecology-driven movie model.

**Architecture:** Keep `ocean-model.js` as the source of movie→species/family/growth truth. Add a renderer adapter so the product can choose WebGL or the existing DOM renderer without changing model semantics. The WebGL renderer uses local, vendored Three.js build output and selected MIT-inspired underwater techniques (depth fog, absorption/scattering palette, caustic projection, soft volumetric shafts, schooling motion). Assets are local-only and license-manifested. The existing DOM renderer remains fallback for WebGL failure/reduced-motion/unsupported devices.

**Global constraints:** no Work credits; no paid API; no runtime CDN; no analytics/tracker in the renderer; no external multi-access; iPhone-first; preserve existing local records; do not merge a visually primitive result.

---

### Task 1: Renderer contract and deterministic fallback

**Files:**
- Create: `preview/ocean/js/ocean-renderer-contract.js`
- Create: `tests/ocean-renderer-contract.test.cjs`
- Modify: `preview/ocean/index.html`

**RED:** Add tests for renderer selection: WebGL+normal motion => `webgl`; unsupported WebGL or reduced motion => `dom`; explicit `?renderer=dom` => `dom`; explicit `?renderer=webgl` still falls back when WebGL is unavailable.

**GREEN:** Implement a tiny dependency-free selector and expose `window.CinemapOceanRendererContract`.

**Verify:** `node --test tests/ocean-renderer-contract.test.cjs` then `python scripts/quality_gate.py`.

### Task 2: Local Three.js build workspace and compliance guard

**Files:**
- Create: `preview/ocean/renderer/package.json`
- Create: `preview/ocean/renderer/src/main.js`
- Create: `preview/ocean/renderer/src/runtime-policy.js`
- Create: `tests/ocean-renderer-compliance.test.cjs`
- Create: `preview/ocean/renderer/THIRD_PARTY_NOTICES.md`

**RED:** Tests assert no runtime `http(s)://`, analytics SDK, PostHog, CDN import, or paid service reference in renderer source; notices must identify Three.js MIT and the adapted/reference ocean renderer MIT provenance.

**GREEN:** Add Vite/Three workspace with only required runtime dependencies; keep all requests local. Do not copy tracker code from the reference project.

**Verify:** compliance test and shared quality gate.

### Task 3: Cinematic underwater environment

**Files:**
- Create: `preview/ocean/renderer/src/environment.js`
- Create: `preview/ocean/renderer/src/quality.js`
- Create: `tests/ocean-renderer-quality.test.cjs`

**RED:** Tests cover iPhone quality tiers, capped DPR, fog/shaft/caustic feature policy, and deterministic low-power fallback.

**GREEN:** Implement scene background/fog, depth palette, soft additive light shafts, caustic projection, suspended particulate field, seabed/habitat silhouettes, and adaptive quality. No giant geometric cones or capsule vegetation.

**Verify:** renderer tests + build + quality gate.

### Task 4: Living creatures and schooling

**Files:**
- Create: `preview/ocean/renderer/src/creatures.js`
- Create: `preview/ocean/renderer/src/schooling.js`
- Create: `tests/ocean-schooling.test.cjs`
- Modify: `preview/ocean/js/ocean-model.js` only if a renderer-neutral export is required.

**RED:** Tests assert deterministic seeded positions, bounded velocity, separation/cohesion/alignment behavior, size/depth diversity, and ecology growth affecting population without genre-owned biomes.

**GREEN:** Implement schooling and creature instances. Use model-derived species/family metadata; start with renderer-generated fish silhouettes only as loading/fallback placeholders, not final hero assets.

**Verify:** tests + quality gate.

### Task 5: License-reviewed local glTF asset pipeline

**Files:**
- Create: `preview/ocean/renderer/assets/README.md`
- Create: `preview/ocean/renderer/assets/licenses.json`
- Create: `tests/ocean-assets-license.test.cjs`
- Modify: `preview/ocean/renderer/src/creatures.js`

**RED:** Every referenced model must have a local file, source URL recorded for provenance, license identifier, attribution text where required, and an allowed license (`CC0`, `CC-BY`, or compatible permissive license explicitly reviewed).

**GREEN:** Add a small curated set of local compressed glTF/GLB creatures and habitat assets; map multiple Cinemap species families to visibly different silhouettes. No unreviewed downloaded asset may ship.

**Verify:** license test + renderer build.

### Task 6: Product adapter and touch exploration

**Files:**
- Create: `preview/ocean/js/ocean-webgl-adapter.js`
- Modify: `preview/ocean/index.html`
- Modify: `preview/ocean/js/ocean-view.js`
- Modify: `preview/ocean/js/ocean-immersive.js`
- Create: `tests/ocean-webgl-adapter.test.cjs`

**RED:** Tests cover mount/unmount, fallback on renderer error, no duplicate animation loops, drag/pinch bounds, tap selection, and preservation of movie detail cards.

**GREEN:** Mount WebGL renderer behind the contract while keeping current DOM renderer as fallback. Touch interaction changes camera target smoothly rather than moving the entire page.

**Verify:** tests + shared quality gate.

### Task 7: iPhone visual gate and rejection loop

**Files:**
- Modify: `scripts/mobile_smoke.mjs`
- Modify: `.github/workflows/autonomous-quality-gate.yml` only if artifact coverage needs expansion.
- Create: `docs/superpowers/reviews/ocean-mature-renderer-visual.md`

**RED:** Add assertions that the Ocean viewport renders, does not horizontally overflow, has a non-empty WebGL canvas, and remains scrollable where product chrome requires scrolling.

**GREEN:** Capture iPhone 390×844 screenshots for hero view and explored view. Self-review against the approved bar: recognizable varied creatures, layered depth, organic habitat, non-geometric light, no sprite-sheet/cutout feel, no oversized primitive shapes. If it fails, reject and iterate before asking the user to review.

**Verify:** GitHub Actions deterministic checks + mobile smoke screenshots.

### Task 8: Final review and integration

Run the complete quality gate, renderer tests/build, and iPhone screenshots. Review licensing, performance, touch behavior, and fallback. Only after the branch clears the visual bar should the implementation PR be marked ready. Merge requires explicit user approval.
