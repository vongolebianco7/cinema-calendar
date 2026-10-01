# Cinemap CI Completeness Scorecard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic CI scorecard that converts Cinemap screen, journey, and cross-cutting quality checks into a reproducible 100-point completeness score plus independent release blockers.

**Architecture:** Keep existing deterministic contracts authoritative and add a scorecard layer above them. Focused Playwright/Node/Python test groups emit metric JSON records, an aggregator validates/normalizes them, compares PR results with `main`, and renders a GitHub Actions summary. Existing Ocean tests are mapped rather than duplicated.

**Tech Stack:** Python 3.12, Node.js 22, Playwright 1.55.0, GitHub Actions, existing static HTML/JS test harnesses.

**Spec:** `docs/superpowers/specs/2026-10-01-ci-completeness-scorecard-design.md`

## Global Constraints
- Preserve existing `scripts/quality_gate.py`; do not replace its current contracts.
- Mobile/iPhone target is 390x844, DPR 3, in Chromium and WebKit.
- No paid APIs, metered AI/API services, subscriptions, or new recurring costs.
- Reuse existing Ocean tests whenever they already prove the required contract.
- Score and release eligibility are separate outputs; blocker failures override score.
- Scorecard metric IDs and point values are stable and defined in `quality/scorecard.json`.
- Initial gate policy is Phase A: no newly introduced blockers, no total regression vs `main`, and no touched-area regression.
- Keep runtime external access mocked/deterministic in CI where possible.

## Review Focus
1. Partial/missing metric artifact: aggregator must report the missing metric explicitly, award no hidden points, and not silently renormalize the total.
2. Duplicate metric IDs from two jobs: aggregator must fail configuration validation instead of double-counting.
3. Browser-specific conflict: a blocker that fails in either Chromium or WebKit must make `release_eligible=false`.
4. `main` baseline generated with a different scorecard version: comparison must fail closed with a clear incompatibility error rather than compare unlike scores.
5. Optional external/backend failure: local core journeys must remain testable via mocks and should not become flaky because a third-party endpoint is unavailable.

---

### Task 1: Canonical Scorecard Configuration and Aggregator

**Files:**
- Create: `quality/scorecard.json`
- Create: `scripts/score_quality.py`
- Create: `tests/test_score_quality.py`

**Interfaces:**
- Consumes: metric JSON objects with fields `id`, `status`, `earned`, plus optional evidence fields.
- Produces: `artifacts/completeness/score.json` with `version`, group totals, area totals, `total`, `release_eligible`, `blockers`, `missing_metrics`, and comparison metadata.

- [ ] **Step 1: Write failing tests for scorecard validation**

Add tests covering: configured total = 100; screen=45, flow=40, cross=15; duplicate configured IDs rejected; duplicate result IDs rejected; unknown result IDs rejected; earned points cannot exceed configured maximum; missing metrics are listed and score zero; blocker failure sets `release_eligible=false`.

- [ ] **Step 2: Run the score tests and confirm failure**

Run: `python -m unittest tests.test_score_quality -v`
Expected: FAIL because `quality/scorecard.json` and `scripts.score_quality` do not exist.

- [ ] **Step 3: Create `quality/scorecard.json`**

Define all stable metric IDs and exact points from the approved spec, including `group`, `area`, `description`, and `blocker`. Add explicit `scorecard_version` and `gate_phase: "A"`.

- [ ] **Step 4: Implement aggregator API**

In `scripts/score_quality.py`, provide:
- `load_scorecard(path: Path) -> dict`
- `load_metric_results(paths: list[Path]) -> list[dict]`
- `calculate_score(scorecard: dict, results: list[dict]) -> dict`
- `compare_scores(current: dict, baseline: dict, touched_areas: set[str]) -> dict`
- CLI that writes `artifacts/completeness/score.json`.

Missing metrics receive zero points and appear in `missing_metrics`; never renormalize to a smaller denominator.

- [ ] **Step 5: Add baseline-version and browser-conflict tests**

Assert mismatched `scorecard_version` rejects comparison. Assert any failed blocker result across duplicate browser variants resolves the canonical blocker metric to failed/release-ineligible rather than allowing a passing browser to mask it.

- [ ] **Step 6: Run tests**

Run: `python -m unittest tests.test_score_quality -v`
Expected: PASS.

- [ ] **Step 7: Commit**

Commit: `feat(quality): add completeness scorecard aggregator`

---

### Task 2: Human-Readable Quality Report

**Files:**
- Create: `scripts/quality_report.py`
- Create: `tests/test_quality_report.py`

**Interfaces:**
- Consumes: canonical `score.json` from Task 1.
- Produces: Markdown summary at `artifacts/completeness/score.md` suitable for `$GITHUB_STEP_SUMMARY`.

- [ ] **Step 1: Write failing report tests**

Assert output includes total `/ 100`, Screen `/45`, User Flows `/40`, Cross-Cutting `/15`, per-area rows, blocker list, baseline total, delta, and `release_eligible` state.

- [ ] **Step 2: Run and confirm failure**

Run: `python -m unittest tests.test_quality_report -v`
Expected: FAIL because report module does not exist.

- [ ] **Step 3: Implement report renderer**

Provide `render_report(score: dict) -> str` and CLI input/output flags. Do not recalculate scores in this module.

- [ ] **Step 4: Run tests**

Run: `python -m unittest tests.test_quality_report -v`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat(quality): render completeness score report`

---

### Task 3: Shared Browser Metric Harness and Screen-Level Tests

**Files:**
- Create: `tests/product/helpers/metric-harness.mjs`
- Create: `tests/product/calendar.mjs`
- Create: `tests/product/discover.mjs`
- Create: `tests/product/movie-detail.mjs`
- Create: `tests/product/my-cinemap.mjs`
- Create: `tests/product/critic.mjs`
- Modify: `scripts/mobile_smoke.mjs`

**Interfaces:**
- Produces: one JSON file per browser/test group under `artifacts/completeness/metrics/`.
- Shared helper exports `recordMetric`, `writeMetrics`, `attachPageErrorCollector`, `assertNoPageOverflow`, and deterministic route fixtures.

- [ ] **Step 1: Add failing harness contract test**

Create a minimal Node test asserting metric output contains stable IDs, `status`, `earned`, evidence, and browser field; assert two browser-specific observations for one canonical metric are mergeable by Task 1 rules.

- [ ] **Step 2: Implement shared harness**

Use Playwright contexts at 390x844 DPR3; mock optional movie backend endpoints; collect uncaught `pageerror`; write screenshots into `artifacts/completeness/screenshots/`.

- [ ] **Step 3: Implement Calendar runtime metrics**

Cover `CAL-01..10`; reuse structural evidence from existing `check_discovery_ui.py` only through an adapter/result mapping, while navigation/filter/tap behavior is Playwright-driven.

- [ ] **Step 4: Implement Discover runtime metrics**

Cover `DISC-01..12` using deterministic fixtures for keyword, filters, year/rating/title sorts, combined state, back navigation, and zero results.

- [ ] **Step 5: Implement Movie Detail runtime metrics**

Cover `DETAIL-01..12`, including record persistence, rating change/clear semantics, related rail, creator/cast route, critic CTA state, WebKit/Chromium overflow/error checks.

- [ ] **Step 6: Implement My Cinemap runtime metrics**

Cover `MY-01..10` with empty, single-record, 100-record, and 500-record local fixtures.

- [ ] **Step 7: Implement Critic runtime metrics**

Cover runtime portions of `CRIT-01..06`; source-schema/static truth remains owned by deterministic data checks.

- [ ] **Step 8: Expand legacy mobile smoke safely**

Either delegate `scripts/mobile_smoke.mjs` to the new focused tests or expand its candidate coverage so legacy CI continues protecting all major pages during migration. Do not leave two divergent definitions of overflow behavior.

- [ ] **Step 9: Run both browsers locally/CI-style**

Run Chromium and WebKit product suites against `python3 -m http.server 4173`.
Expected: metric JSON emitted; existing pages that do not yet satisfy a metric record failures without crashing the test harness.

- [ ] **Step 10: Commit**

Commit: `test(quality): add scored screen-level browser checks`

---

### Task 4: User-Journey E2E Metrics

**Files:**
- Create: `tests/journeys/helpers/fixtures.mjs`
- Create: `tests/journeys/record-journey.mjs`
- Create: `tests/journeys/related-journey.mjs`
- Create: `tests/journeys/creator-journey.mjs`
- Create: `tests/journeys/critic-source-journey.mjs`
- Create: `tests/journeys/first-use-journey.mjs`
- Create: `tests/journeys/error-states.mjs`

**Interfaces:**
- Consumes: same deterministic movie/evidence/localStorage fixture shapes as Task 3.
- Produces: `FLOW-RECORD`, `FLOW-RELATED`, `FLOW-PERSON`, `FLOW-CRITIC`, `FLOW-FIRSTUSE`, and `FLOW-ERROR` metric records.

- [ ] **Step 1: Write journey fixture contract**

Pin one known movie, one related movie, one person/creator, one evidence-rich movie, and one sparse-evidence movie. Fixture IDs must remain stable and not depend on current production backend data.

- [ ] **Step 2: Implement record journey**

Search/discover fixture movie -> detail -> watched -> rating 4 -> immediate UI -> My Cinemap -> reload -> still rating 4. Persistence and cross-screen mismatch metrics are blockers.

- [ ] **Step 3: Implement related journey**

Home -> detail -> related rail -> second movie detail -> back; score identity and navigation checkpoints separately.

- [ ] **Step 4: Implement creator journey**

Detail -> director/cast -> results -> supported sort/filter -> second detail; dead ends and wrong identity lose points.

- [ ] **Step 5: Implement critic journey**

Evidence-rich fixture must show matching source; sparse fixture must show insufficient-data state; fabricated consensus or wrong-source association is blocker.

- [ ] **Step 6: Implement first-use journey**

Fresh storage; verify find film -> detail -> record -> My Cinemap -> Ocean entry path without preseeded user state.

- [ ] **Step 7: Implement error-state matrix**

Independently mock zero results, missing image, missing streaming data, empty critic evidence, no related works, corrupt localStorage, optional backend 500, optional backend timeout. Assert no white screen, uncaught exception, or invented content; local record/navigation remain usable where applicable.

- [ ] **Step 8: Run journey suites in Chromium and required WebKit subsets**

Run all blocker-sensitive flows in both browsers; non-blocker duplicate flows may run Chromium-only only if the scorecard explicitly marks browser scope.

- [ ] **Step 9: Commit**

Commit: `test(quality): add scored core journey checks`

---

### Task 5: Map Existing Ocean Contracts into Score Metrics

**Files:**
- Create: `scripts/map_ocean_metrics.py`
- Create: `tests/test_map_ocean_metrics.py`
- Modify only if needed: `scripts/ocean_persistence_smoke.mjs`
- Modify only if needed: `scripts/ocean_visual_smoke.mjs`

**Interfaces:**
- Consumes: exit/status outputs from existing Ocean tests and browser smoke results.
- Produces: `OC-01..11` metric JSON without rewriting existing Ocean logic.

- [ ] **Step 1: Create mapping table test**

Assert every `OC-01..11` maps to at least one existing authoritative test/smoke check; fail if a mapping points to a nonexistent test file.

- [ ] **Step 2: Implement mapping adapter**

Map count, milestone, biodiversity, habitat, rating ecology, persistence, motion, size hierarchy, 500 density, 500 performance, and visual gate to the approved IDs.

- [ ] **Step 3: Add only genuinely missing Ocean evidence**

If size hierarchy or another approved OC metric is not represented by an existing deterministic test, add the smallest regression test to the existing Ocean test family instead of duplicating renderer code in the mapper.

- [ ] **Step 4: Run Ocean contracts and mapper**

Run existing Ocean subset plus mapper tests; verify failure in visual gate or count invariant marks blocker metric failed.

- [ ] **Step 5: Commit**

Commit: `test(ocean): map existing contracts to completeness score`

---

### Task 6: Data, Provenance, Compliance, and Performance Metrics

**Files:**
- Create: `scripts/map_data_compliance_metrics.py`
- Create: `tests/test_data_compliance_metrics.py`
- Create: `tests/cross/performance.mjs`
- Reuse: `scripts/check_sources.py`, `scripts/check_critic_map.py`, `scripts/check_critic_evidence.js`, `COMPLIANCE.md`, `docs/free-only-policy.md`

**Interfaces:**
- Produces: data-quality, compliance, and performance metric JSON under canonical IDs from `quality/scorecard.json`.

- [ ] **Step 1: Write mapping/integrity tests**

Assert source/provenance checks, critic association checks, unknown-data handling, and free-only policy checks each map to configured metrics. Include a regression fixture with false critic association and assert blocker.

- [ ] **Step 2: Implement compliance mapper**

Detect newly introduced paid/metered runtime dependency patterns, unapproved scraping entry points, unverified critic-generation paths, and disallowed trackers/requests using deterministic repository scans plus existing policy checks.

- [ ] **Step 3: Implement data-quality mapper**

Adapt existing source checks into scored metrics; add fixture-level duplicate/date/unknown-state integrity only where existing checks do not cover them.

- [ ] **Step 4: Implement performance browser checks**

Measure navigation, primary interaction, and Ocean target-state render using hard ceilings and score bands from the spec. Keep thresholds broad enough to avoid CI runner noise; browser crash/hang is always blocker.

- [ ] **Step 5: Run cross-cutting tests**

Run Python mapping tests and Playwright performance test against local static server.

- [ ] **Step 6: Commit**

Commit: `test(quality): score data compliance and performance`

---

### Task 7: CI Job Decomposition and Artifact Aggregation

**Files:**
- Modify: `.github/workflows/autonomous-quality-gate.yml`
- Create: `scripts/ci_touched_areas.py`
- Create: `tests/test_ci_touched_areas.py`

**Interfaces:**
- Jobs: `contracts`, `mobile-e2e`, `journey-e2e`, `ocean`, `data-compliance`, `score`.
- Each producer job uploads metric JSON artifact(s); `score` downloads all and creates final score/report.

- [ ] **Step 1: Write touched-area classifier tests**

Map representative changed paths to stable areas, e.g. `discover.html -> discover`, `search.html -> movie-detail`, `my-cinemap.html -> my-cinemap`, Ocean files -> ocean, critic data/scripts -> critic/data. Unknown product paths conservatively return `all`.

- [ ] **Step 2: Implement `ci_touched_areas.py`**

CLI accepts changed file list and outputs JSON/set used by Phase A comparison. Conservative classification is preferred over under-classification.

- [ ] **Step 3: Refactor workflow into producer jobs**

Keep existing deterministic and mobile commands while moving them under the new job names. Preserve existing screenshots-on-failure behavior.

- [ ] **Step 4: Upload metric artifacts from every producer job**

Use `if: always()` where practical so failed checks still leave evidence for the score job.

- [ ] **Step 5: Implement baseline generation in score job**

Checkout/evaluate `main` with the same `quality/scorecard.json` version, or retrieve a trusted same-version baseline artifact. Do not compare across versions.

- [ ] **Step 6: Aggregate current + baseline scores**

Run `scripts/score_quality.py`, pass touched areas, enforce Phase A, then run `scripts/quality_report.py` and append to `$GITHUB_STEP_SUMMARY`.

- [ ] **Step 7: Upload final completeness artifacts**

Always upload `score.json`, `score.md`, metric JSON, and screenshots with short retention.

- [ ] **Step 8: Validate workflow syntax and dry-run deterministic pieces**

Run local script tests and repository quality gate. Confirm workflow retains no paid/runtime dependency.

- [ ] **Step 9: Commit**

Commit: `ci: add scored product completeness gate`

---

### Task 8: Adoption Guardrails and Initial Baseline

**Files:**
- Create: `docs/quality-scorecard.md`
- Modify if required: `AGENTS.md`

**Interfaces:**
- Documents current gate phase and how to interpret score/blockers.
- Establishes the first same-version `main` baseline after the scorecard implementation lands.

- [ ] **Step 1: Document score interpretation**

Explain 100-point composition, blockers, Phase A behavior, artifact locations, and the rule that subjective completion percentages are replaced by CI score evidence where available.

- [ ] **Step 2: Document phase promotion criteria**

Phase B only after main >=80 and team intentionally changes config; Phase C only for formal release-candidate enforcement; never auto-promote based on score.

- [ ] **Step 3: Run full verification**

Run:
- `python scripts/quality_gate.py`
- scorecard unit tests
- Chromium + WebKit product suites
- journey suites
- Ocean mapping/contracts
- data/compliance checks
- score aggregation/report generation

Expected: the system produces a deterministic baseline score and any existing blockers without hiding failures.

- [ ] **Step 4: Confirm regression policy with a synthetic failing result**

Inject test fixture representing one new blocker and one touched-area score regression; both must make Phase A gate fail. Remove the fixture after verification.

- [ ] **Step 5: Commit**

Commit: `docs: document CI completeness scorecard`

---

## Recommended PR Sequence
1. PR A — Tasks 1–2: scorecard config, aggregation, reporting.
2. PR B — Task 3: screen/browser metrics.
3. PR C — Task 4: journey metrics.
4. PR D — Tasks 5–6: Ocean mapping + cross-cutting/data/compliance/performance.
5. PR E — Tasks 7–8: CI orchestration, baseline comparison, adoption docs.

Each PR must leave `main` usable and keep the legacy pass/fail gate operational until the final score job is proven stable.

## Self-Review Result
- Spec coverage: all screen, flow, cross-cutting, blocker, baseline, and phased-gate requirements are mapped to tasks.
- Type/interface consistency: metric JSON is the only interchange contract; aggregation owns scoring and reporting never recalculates.
- Review-focus risks are covered by Tasks 1, 3, 4, and 7.
- Scope is intentionally split into five mergeable PRs so a failure in browser scoring cannot block foundational score aggregation work.
- No unrelated product refactor, framework migration, account/cloud work, or new external service is included.
