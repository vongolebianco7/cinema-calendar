# Nationwide Now Playing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users find nationwide Japanese now-playing films and use existing detail/review/bookmark controls.

**Architecture:** An approved TMDB JP now-playing collector publishes a complete static snapshot daily. An independent discovery module validates freshness and renders shared controls without the database. Existing theatrical recommendations remain unchanged.

**Tech Stack:** Python standard library, vanilla JavaScript, existing shared card controls, GitHub Actions and Playwright.

**Spec:** `docs/superpowers/specs/2026-10-24-nationwide-now-playing-design.md`

## Global Constraints
- Free-only, noncommercial, no scraping, no DB dependency or writes.
- Preserve existing logo/colors/routes/records, three columns, 390px page overflow0.
- RegionJP, languageja-JP;36hour freshness and5minute future-clock tolerance.
- Never replace a complete snapshot with a partial result; keep secrets out of outputs.

## Review Focus
- A long-running release must only come from the upstream now-playing list, never local date inference.
- A failed middle page must retain the prior file and report failure.
- Empty, missing, stale and invalid snapshots must be distinct and truthful.
- Search/expansion/reload must preserve bookmark and review state.
- Prefixed routes and light/dark rendering must behave identically.

### Task1: Complete approved-source snapshot publication
**Files:** Create `scripts/update_now_playing.py`, `tests/test_now_playing_update.py`, `data/now_playing.json`, `.github/workflows/update-now-playing.yml`; modify source registry, release guard generated snapshot allowlist, shared quality gate.
**Interfaces:** `collect_now_playing(fetch_page, now)` returns a complete JP snapshot; `refresh(output, fetch_page, now)` atomically publishes it. Consumed by Task2 through the static JSON.
- [x] Write failing tests for pagination/dedup, malformed pages, HTTP failure, source approval and original-file preservation. Run `python -m unittest tests.test_now_playing_update`; expected failure before collector exists.
- [x] Implement collector and guarded daily publication with maximum20pages, bounded request timeouts and atomic replacement. Explicit unavailable initial snapshot has no invented observation time.
- [x] Run collector tests and full shared quality gate; expected all pass. Commit the independently testable data path.

### Task2: Discovery list and shared controls
**Files:** Create `js/cinelva-now-playing.js`, `tests/cinelva-now-playing.test.cjs`, `tests/cinelva-now-playing-browser.cjs`; modify both discovery HTML copies and frontend CI.
**Interfaces:** `snapshotState(snapshot, now)` returns `fresh|empty|stale|unavailable`; `selectMovies(movies, query, sort)` returns unique filtered results. DOM module uses existing `CinelvaQuickRate` and `CinelvaMovieIdentity`.
- [x] Write and run failing unit cases for valid/empty/stale/future/wrong-source payloads, punctuation search and exact IDs, sorting and expansion.
- [x] Implement section and module with12initial/all expansion, source/time copy and official cinema-directory link. Include shared reviews/bookmarks without a second implementation.
- [x] Run focused tests, shared quality, both-engine root/prefix/light/dark browser checks with screenshot evidence. Verify search, all-results access, review save/bookmark persistence/detail URL, source errors and390px overflow0.
- [x] Perform one focused whole-branch review, source CI, receipt-only proof and final CI; merge approved scope. Observe real initial collection and canonical publication; record any genuine external blocker.

## Execution record

- Baseline atdb3460ca: fullquality passed. Collector6 tests red→green; UI6 tests (including source-file/offline-detail checks) passed; fullquality passed after feature integration.
- Ruling: extend existing search detail fallback to the exact ID in the verified now-playing snapshot, since newly discovered films need not exist in the old catalog and DB/API failures must not break the approved detail link. Stale metadata can identify a film without making a current-showing claim; unavailable/invalid-source data cannot.
- Browser tests run in a parallel frontend CI job to preserve the existing15-minute full-audit budget. Local browser downloads returned truncated archives twice, including the exact pinned CI version; no local browser success claimed.
- Notifications are separate from this approved nationwide-list increment. Existing32-gate ledger remains a historical baseline; this added feature has its own work item and acceptance evidence.

- Focused whole-branch review: one Important finding, raw API row totals could be truncated while nonempty. Regression reproduced both1/2-page cases; raw rows now reconcile before filtering/dedup and preserve prior bytes on mismatch. Collector7 passed.
- Actual CI exposed a missing shared-script dependency on prefixed discovery; added original identity/library/rating modules and true scoped3-column CSS. Dependency contract red→green; UI7 passed. Root/prefix × light/dark × Chromium/WebKit, physical card rows, shared persistence, source states, detail, contrast and overflow all passed at664006f4;8 rendered screenshots retained and representative WebKit/Chromium routes visually checked.
- Existing backup workflow exposed its old logo filename assertion on unchanged index.html. The browser test now requires the exact approved primary asset on index and the original secondary asset on record/search, ignores only the cache query, and retains decode/dimensions/layout checks. No product branding changed.

- At1415f995 the new browser job passed both engines with deterministic unrelated-shelf fixtures and zero page-error assertions intact. Shared quality passed. Backup/brand (including existing canvas framing), completeness, Autonomous, mobile, backend, smoke, Python and stage passed; full frontend regression pending before receipt.

- Exact executable source1415f995: all10 PR workflows succeeded, including full frontend regression and the new both-engine list job. Final receipt/head CI and materialized production-checks precede integration; actual initial collection and canonical publication remain post-merge acceptance.

## Initial observation repair, PR484
- PR483 source1415f995 all10/final988a9e20 all11 passed; materialized public proof/fullquality passed, merge3d9d8208, canonical feature UI READY.
- Actual refresh40034078253 failed closed on upstream100/99 pagination totals; snapshot remains explicitly uninitialized. Numeric-only diagnostics40034380005/40034539138/40034644214 reproduced ordinary/no-cache/canonical-order mismatch.
- Official equivalent diagnostic40034856714 froze API window2026-09-16..2026-10-28 and observed5×20 rows, constant100 total, unchanged collector passed100 titles. This is evidence of the read-only retrieval, not production data publication.
- Repair tests: new fallback/date/preservation/direct-no-extra-request/realCLI-exact-filter cases red6 missing-interface→green12 total. Use one equivalent pass only for pagination/raw-count mismatch; preserve original malformed/network failure semantics and shared deadline. Remove temporary diagnostic workflow.
- Pending: focused repair review, shared/exact-source/final proof, merge484, actual complete guarded first refresh and canonical100-title observation.

- PR484 focused repair review independently verified official endpoint equivalence and12 tests; no Critical/Important blockers. Nonblocking additional test ideas (network exception with fallback enabled, impossible calendar date and shared-deadline exhaustion) are not required for this repair; current code propagates network failures, parses actual dates and shares one request budget. urllib keeps its existing per-operation socket timeout; the job has an8minute overall bound.
- Source45b2c01a all7 PR workflows passed including full frontend and dedicated Chromium/WebKit shared controls. Shared local quality passed. Final receipt/head CI, materialized production checks, merge and actual complete publication still pending.

## Completed release evidence
- PR484 finalac222b69 all8 workflows passed; actual materialized public proof/fullquality passed, digest8056568b8ad81a97055a6a95817f4b5bc34a662d443c889d8a7325b05609f8a9. Merged3fae6b87.
- Actual refresh40037837837 passed both public proof checks and fullquality, publishing100 unique films asb877e60e with real observation2026-10-23T23:07:46.612102+00:00. Direct endpoint was consistent in this run, so provenance correctly remains direct; equivalent fallback execution was proven by the live read-only diagnostic and entrypoint tests, not falsely claimed in production.
- Frontend dpl_Em48nfoBbFurqRjHZV9yrjggEBp6 and backend dpl_HbKbqJoK7goG2tYVBezAbD38VgoZ READYb877e60e on existing origins. Canonical JSON200/complete:true/JP/count100/unique100/source/time confirmed.
- Actual Chrome production shows100/initial12 and08:07JST, expands100, filters Street Fighter to1 and opens matching detail ID1153576/title and record action.13 real posters already loaded on expansion. A browser observation wait hit a protocol timeout; the next DOM observation confirmed the correct rendered detail. No production review/bookmark actions performed; no latency pass claimed.
- Collector12/UI7 and both-engine persistence/offline/source/geometry/contrast checks passed. This approved increment is COMPLETE; notifications remain later work. Historical rights/physical-device/participant/Neon gates are not claimed complete.
- Local execution environment became unavailable during the final documentation-only checkpoint. Code, tests, real collection and canonical browser verification were already complete; checkpoint persisted through GitHub and its normal CI rather than claiming an unreturned local documentation gate passed.
