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
- [ ] Run focused tests, shared quality, both-engine root/prefix/light/dark browser checks with screenshot evidence. Verify search, all-results access, review save/bookmark persistence/detail URL, source errors and390px overflow0.
- [ ] Perform one focused whole-branch review, source CI, receipt-only proof and final CI; merge approved scope. Observe real initial collection and canonical publication; record any genuine external blocker.

## Execution record

- Baseline atdb3460ca: fullquality passed. Collector6 tests red→green; UI6 tests (including source-file/offline-detail checks) passed; fullquality passed after feature integration.
- Ruling: extend existing search detail fallback to the exact ID in the verified now-playing snapshot, since newly discovered films need not exist in the old catalog and DB/API failures must not break the approved detail link. Stale metadata can identify a film without making a current-showing claim; unavailable/invalid-source data cannot.
- Browser tests run in a parallel frontend CI job to preserve the existing15-minute full-audit budget. Local browser downloads returned truncated archives twice, including the exact pinned CI version; no local browser success claimed.
- Notifications are separate from this approved nationwide-list increment. Existing32-gate ledger remains a historical baseline; this added feature has its own work item and acceptance evidence.
