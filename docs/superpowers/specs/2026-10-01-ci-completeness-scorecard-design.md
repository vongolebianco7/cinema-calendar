# Cinemap CI Completeness Scorecard Design

## Goal
Convert Cinemap's screen-level, user-flow, and cross-cutting quality criteria into a deterministic CI scorecard that produces a reproducible 100-point product-completeness score plus explicit release blockers.

The scorecard must reuse existing tests wherever possible, avoid duplicating Ocean coverage, and preserve the current zero-LLM deterministic quality-gate philosophy.

## Design Principles
- Existing pass/fail tests remain authoritative for their current contracts.
- A new scorecard layer maps test outcomes to fixed points; it does not replace `scripts/quality_gate.py`.
- Score and release eligibility are separate outputs.
- Release blockers override the score.
- CI must compare PR results against the current `main` baseline so improvement PRs are mergeable before the final target score is reached.
- Mobile/iPhone quality is assessed at 390x844 in Chromium and WebKit.
- No paid APIs, metered AI/API services, or new recurring costs may be introduced.
- Existing Ocean tests are reused rather than rewritten unless a required acceptance criterion is currently untested.
- Every scored metric has a stable ID, fixed maximum points, deterministic evidence, and a defined blocker flag.

## Score Model

### Screen Quality — 45 points
- Home / Calendar: 8
- Discover: 10
- Movie Detail: 10
- My Cinemap: 7
- Ocean: 7
- Critic / Deep Dive: 3

### User Flows — 40 points
- Search -> Detail -> Record -> My Cinemap: 10
- Home -> Detail -> Related -> Detail: 5
- Person -> Films -> Detail: 5
- Record -> Ocean: 7
- Critic -> Source: 5
- First-use journey: 4
- Error / empty states: 4

### Cross-Cutting Quality — 15 points
- Mobile: 5
- Performance: 4
- Data quality: 3
- Compliance: 3

Total maximum score: 100.

## Canonical Metric Record
Every test participating in scoring emits or is converted into this logical record:

```json
{
  "id": "DETAIL-06",
  "group": "screen",
  "area": "movie-detail",
  "description": "record survives reload",
  "points": 1.0,
  "earned": 1.0,
  "status": "pass",
  "blocker": true,
  "browser": "webkit",
  "duration_ms": 832
}
```

Required fields:
- `id`: immutable metric identifier.
- `group`: `screen`, `flow`, or `cross`.
- `area`: stable scorecard area key.
- `description`: short human-readable contract.
- `points`: fixed maximum value.
- `earned`: awarded value from 0 to `points`.
- `status`: `pass`, `fail`, `partial`, or `not_applicable`.
- `blocker`: whether a failure makes release ineligible.

Optional evidence fields include `browser`, `duration_ms`, `screenshot`, `details`, and `source_test`.

## Screen Metrics

### Home / Calendar — 8 points
- `CAL-01` page responds successfully — 0.5
- `CAL-02` no uncaught JS/page errors — 1.0, blocker
- `CAL-03` no page-level horizontal overflow at 390px — 1.0, blocker
- `CAL-04` month/week calendar structure contract passes — 1.0
- `CAL-05` at least one fixture movie card renders correctly — 1.0
- `CAL-06` movie card opens the correct detail page — 1.0
- `CAL-07` theatrical-category filter works — 1.0
- `CAL-08` empty/no-movie date state remains usable — 0.5
- `CAL-09` back navigation restores usable state — 0.5
- `CAL-10` primary controls are operable on mobile — 0.5

Existing static calendar contracts from `scripts/check_discovery_ui.py` should satisfy structural portions of `CAL-04` and `CAL-07`; Playwright covers runtime behavior.

### Discover — 10 points
- `DISC-01` page responds successfully — 0.5
- `DISC-02` no uncaught JS/page errors — 1.0, blocker
- `DISC-03` no page-level horizontal overflow — 0.5, blocker
- `DISC-04` result grid uses the approved three-column mobile layout — 1.0
- `DISC-05` keyword search returns expected fixture results — 1.0
- `DISC-06` filters alter the result set correctly — 1.0
- `DISC-07` release-year sort is correct — 0.75
- `DISC-08` rating sort is correct — 0.75
- `DISC-09` title sort is correct — 0.5
- `DISC-10` filters and sort coexist without state loss — 1.0
- `DISC-11` detail/back preserves discover state — 1.0
- `DISC-12` zero-result state is deliberate and operable — 1.0

### Movie Detail — 10 points
- `DETAIL-01` known fixture movie loads — 0.5
- `DETAIL-02` essential metadata renders — 0.5
- `DETAIL-03` watched/record control is visible and operable — 1.0
- `DETAIL-04` rating 1–5 can be set — 1.0
- `DETAIL-05` saved state reflects immediately — 1.0, blocker
- `DETAIL-06` saved record survives reload — 1.0, blocker
- `DETAIL-07` existing rating can be changed/cleared without corrupting watched state — 0.5
- `DETAIL-08` related-work rail is usable — 1.0
- `DETAIL-09` related work opens the correct movie detail — 1.0
- `DETAIL-10` cast/creator navigation enters a usable movie-results surface — 1.0
- `DETAIL-11` critic CTA behaves correctly for evidence/no-evidence states — 0.5
- `DETAIL-12` no mobile overflow or uncaught errors — 1.0, blocker

### My Cinemap — 7 points
- `MY-01` saved movie appears — 1.0, blocker
- `MY-02` displayed rating matches canonical record state — 1.0, blocker
- `MY-03` state survives reload — 1.0, blocker
- `MY-04` record can be edited from My Cinemap flow — 1.0
- `MY-05` empty state is usable — 0.5
- `MY-06` 100-record fixture renders without breaking core controls — 0.5
- `MY-07` 500-record fixture renders without breaking core controls — 0.5
- `MY-08` no page-level horizontal overflow — 0.5, blocker
- `MY-09` no uncaught JS/page errors — 0.5, blocker
- `MY-10` saved movie opens the correct detail page — 0.5

### Ocean — 7 points
The scorecard reuses current Ocean contract tests wherever possible.

- `OC-01` exact logical creature-count invariant — 1.0, blocker
- `OC-02` milestone schedule invariant — 1.0, blocker
- `OC-03` ordinary biodiversity contract — 0.5
- `OC-04` habitat-depth distribution contract — 0.5
- `OC-05` rating-to-ecology contract — 0.5
- `OC-06` record/grow/reload persistence — 0.5, blocker
- `OC-07` natural-motion contract — 0.5
- `OC-08` large-animal size hierarchy — 0.5
- `OC-09` 500-creature natural-density contract — 0.5
- `OC-10` 500-creature performance contract — 0.5, blocker if renderer becomes unusable
- `OC-11` iPhone visual gate — 1.0, blocker

### Critic / Deep Dive — 3 points
- `CRIT-01` evidence data conforms to verified-source schema — 0.5
- `CRIT-02` qualifying summaries include usable source links — 0.5
- `CRIT-03` evidence is associated with the correct movie — 0.5, blocker for false association
- `CRIT-04` insufficient evidence produces an explicit insufficient-data state — 0.5
- `CRIT-05` criticism is not inferred from synopsis/metadata — 0.5, blocker
- `CRIT-06` critic view has no mobile overflow or uncaught errors — 0.5

Existing `scripts/check_core_journey.py`, `scripts/check_critic_map.py`, and `scripts/check_critic_evidence.js` should feed these metrics.

## User-Flow Metrics

### FLOW-RECORD — 10 points
Fixture journey:
1. discover/search for a known movie;
2. open its detail page;
3. mark watched;
4. set rating to 4;
5. verify immediate UI update;
6. open My Cinemap;
7. verify movie exists and rating equals 4;
8. reload;
9. verify movie and rating still match.

Award points by completed checkpoint rather than all-or-nothing, but persistence and cross-screen consistency failures are release blockers.

### FLOW-RELATED — 5 points
Home -> detail -> related rail -> second detail -> back. Runtime navigation, correct movie identity, and usable back behavior are scored separately.

### FLOW-PERSON — 5 points
Movie detail -> director/cast -> movie-result surface -> sort/filter if applicable -> second movie detail. Dead ends or identity mismatches lose points.

### FLOW-OCEAN — 7 points
Use deterministic local-record fixtures at boundaries:
`0, 1, 24, 25, 49, 50, 99, 100, 149, 150, 499, 500`.

Verify:
- exact logical count;
- correct milestone inclusion/exclusion;
- persistence after reload;
- no renderer crash/page error;
- usable 500-state visual/performance result.

Off-by-one milestone failures are blockers.

### FLOW-CRITIC — 5 points
For known evidence fixtures:
- critic view opens;
- source link exists and corresponds to evidence record;
- sparse-evidence movie shows insufficient-data state;
- no fabricated consensus appears.

False-source association or fabricated criticism is a blocker.

### FLOW-FIRSTUSE — 4 points
Fresh storage/context fixture. Without pre-seeded user state, verify the user can:
- find a film;
- open detail;
- record it;
- reach My Cinemap;
- understand/open Ocean from the record experience.

This remains deterministic UI operability testing, not subjective usability research.

### FLOW-ERROR — 4 points
Mock the following independently:
- zero search results;
- missing image;
- missing streaming metadata;
- empty critic evidence;
- no related works;
- corrupt localStorage record;
- optional movie backend HTTP 500;
- optional movie backend timeout.

Expected invariant:
- no white screen;
- no uncaught exception;
- no invented metadata/criticism;
- local record function remains usable where its dependencies are local;
- navigation remains usable.

## Cross-Cutting Metrics

### Mobile — 5 points
Run at 390x844, DPR 3 in both Chromium and WebKit across at least:
- `index.html`
- `discover.html`
- known movie detail URL
- `rankings.html`
- `theaters.html`
- `experience.html`
- `my-cinemap.html`
- known critic URL
- Ocean page/route

Checks:
- page-level `scrollWidth <= clientWidth + 2`;
- no uncaught page errors;
- primary controls visible/operable;
- internal horizontal rails are allowed.

Any page-level horizontal overflow on a core journey page is a release blocker.

### Performance — 4 points
CI runners vary, so use hard-fail ceilings plus broad score bands.

Hard blockers:
- page navigation > 8 s;
- primary interaction completion > 2 s;
- Ocean target-state render > 5 s;
- browser crash/hang.

Scoring bands for applicable timing metrics:
- <1.5 s: 100% of timing subpoints
- 1.5–3 s: 75%
- 3–5 s: 50%
- 5–8 s: 25%
- >8 s: 0 and blocker

Ocean-specific existing performance contracts remain authoritative where they are stricter or more representative.

### Data Quality — 3 points
Score from existing source/data checks plus additional fixture-level integrity contracts:
- valid source/provenance where required;
- no duplicate canonical movie records in tested fixtures;
- date/order integrity;
- missing data represented as unknown rather than guessed;
- verified critic/source associations.

Material false data introduced by a PR is a blocker.

### Compliance — 3 points
Deterministic checks must verify:
- no newly introduced paid or metered runtime dependency;
- no unapproved scraping path;
- no unverified critic-generation path;
- no prohibited external tracker/request addition;
- existing `COMPLIANCE.md` / free-only rules remain satisfied.

A compliance violation is a blocker regardless of score.

## Release Blockers
`release_eligible` is false if any blocker metric fails, even when total score is high.

Minimum blocker classes:
- saved movie/ratings are lost or inconsistent across screens;
- core page is unusable on iPhone-sized WebKit;
- page-level horizontal overflow on a core journey page;
- uncaught JS/page error in a core journey;
- fabricated or falsely associated critic evidence;
- Ocean logical creature-count mismatch;
- milestone off-by-one error;
- Ocean 500-state crash/unusable renderer;
- material source/data integrity violation;
- paid/metered runtime dependency or other compliance violation.

## Score Aggregation
Add `quality/scorecard.json` as the canonical static configuration for metric IDs, categories, points, and blocker flags.

Add `scripts/score_quality.py` to:
1. load metric configuration;
2. read individual JSON result files produced by test groups;
3. validate unique metric IDs and point totals;
4. calculate screen, flow, cross-cutting, and total scores;
5. calculate `release_eligible`;
6. emit `artifacts/completeness/score.json`;
7. exit non-zero only according to the active gate policy, not merely because total score is below the future target.

Add `scripts/quality_report.py` to render a human-readable Markdown report from `score.json` for GitHub Actions job summary/artifacts.

## Baseline and Gate Policy
The system must compare the PR score with a score generated from `main` using the same scorecard version.

### Phase A — adoption
Do not require 85 immediately.
Fail when:
- a new release blocker is introduced;
- total score is lower than `main` beyond deterministic rounding tolerance;
- an area touched by the PR regresses relative to `main`.

Untouched-area regressions detected by full CI still fail if they are blockers; otherwise they are reported and should normally fail the total-score regression rule.

### Phase B — after 80 is reached
Require:
- total >= 80;
- no release blockers;
- no score regression vs `main`.

### Phase C — formal release candidate
Require:
- total >= 85;
- screen >= 38/45;
- flow >= 34/40;
- cross-cutting >= 13/15;
- zero release blockers.

### High-completeness target
Require total >= 90 and zero blockers. This is a maturity target, not the initial merge threshold.

The active phase is explicit in scorecard configuration; it must not be inferred from the current score.

## CI Architecture
Extend the existing Autonomous quality gate rather than replacing it.

Target jobs:
1. `contracts`
   - current `python scripts/quality_gate.py` and deterministic contracts;
   - emits mapped metric results where applicable.
2. `mobile-e2e`
   - Chromium + WebKit screen-level tests;
   - screenshots and metric JSON.
3. `journey-e2e`
   - record, related, person, critic, first-use, and error-state flows;
   - metric JSON.
4. `ocean`
   - existing Ocean contracts plus persistence/visual gate;
   - mapped metric JSON.
5. `data-compliance`
   - sources, provenance, critic evidence, free-only/compliance contracts;
   - metric JSON.
6. `score`
   - downloads all metric artifacts;
   - calculates the score;
   - compares with `main` baseline;
   - writes GitHub job summary;
   - enforces active gate policy.

All browser screenshots and score artifacts are uploaded even on failure where possible.

## File Layout

```text
quality/
  scorecard.json

scripts/
  score_quality.py
  quality_report.py
  mobile_smoke.mjs              # expanded or delegated to focused tests

 tests/
  product/
    calendar.mjs
    discover.mjs
    movie-detail.mjs
    my-cinemap.mjs
    critic.mjs

  journeys/
    record-journey.mjs
    related-journey.mjs
    creator-journey.mjs
    critic-source-journey.mjs
    first-use-journey.mjs
    empty-states.mjs

  cross/
    mobile-layout.mjs
    performance.mjs
    data-quality.py
    compliance.py

artifacts/
  completeness/
    metrics/
    score.json
    score.md
    screenshots/
```

Exact test-file consolidation may follow existing repository patterns; this structure expresses responsibility boundaries, not a required framework rewrite.

## Reporting
Every PR score job should publish a concise summary:

```text
Cinemap Product Completeness
TOTAL            82.5 / 100
SCREEN           37.5 / 45
FLOWS            33.0 / 40
CROSS-CUTTING    12.0 / 15
Release eligible: NO
Delta vs main: +2.0
Blockers: 2
```

The detailed report lists every area, failed metric, screenshot/evidence reference where available, and blocker reason.

## Testing the Scorecard Itself
The scoring system needs deterministic unit tests for:
- all configured points sum to exactly 100;
- category totals equal 45/40/15;
- duplicate metric IDs are rejected;
- unknown result metric IDs are rejected;
- missing mandatory metric results are represented as failure, not silently ignored;
- `earned` cannot exceed configured points;
- blocker failure forces `release_eligible=false`;
- score regression rules compare PR and baseline correctly;
- Phase A/B/C thresholds behave exactly as specified;
- same metric inputs always produce byte-equivalent normalized score output except timestamps if timestamps are included.

## Non-Goals
- replacing all current tests with a new test framework;
- visual-diff pixel perfection for every page;
- subjective aesthetic scoring in CI;
- paid browser/testing infrastructure;
- production API dependence for deterministic tests;
- user accounts/cloud state for test setup;
- weakening existing Ocean or compliance gates merely to improve the numeric score.

## Acceptance Criteria
This design is implemented when:
1. every 100-point metric has a stable configured ID and deterministic evidence source;
2. CI produces per-metric JSON, a normalized score JSON, and a Markdown summary;
3. the same commit produces the same score from the same fixtures within documented timing-band tolerance;
4. release blockers are enforced independently of total score;
5. PR vs `main` regression detection is active;
6. Chromium and WebKit cover all core screens/flows identified here;
7. existing deterministic and Ocean contracts remain green and are reused rather than duplicated;
8. no paid/metered service is needed to run the scorecard.