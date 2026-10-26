# Search quality implementation plan

> Execute inline using executing-plans. User has requested autonomous completion.

**Goal:** Apply the existing director ranking exclusions to search profiles, normalize punctuation in person searches, show safe thumbnails, and remove avoidable search waiting.
**Architecture:** Reuse one exported director predicate across records and global search. Normalize/cache person queries on the existing API; provide a small verified alias for the reported actor if upstream punctuation matching is insufficient. Render partial suggestions without waiting for other requests and reuse profile responses between tabs.
**Tech stack:** Existing static JavaScript, Next API, node tests, Playwright.
**Spec:** User request in this session; no new services, preserve records/branding.

## Review focus
- Producer/actor/short/anthology credits cannot enter director lists.
- Local fallbacks cannot replace verified live works or introduce different directors.
- Stalled movie/person/catalog requests cannot block available suggestions.
- Photos are escaped and safe, missing photos retain accessible labels.
- Exact actor identity survives punctuation-free query and candidate selection.

### Task 1
- [x] Add failing shared director exclusions and normalization tests.
- [x] Extract existing ranking predicate into the global search model and consume it from records; pass canonical Japanese name resolver for record aliases.
- [x] Verify node director/global-search tests.

### Task 2
- [x] Add API regression for トムホランド using upstream-compatible query and browser regression for thumbnails and partial results.
- [x] Normalize known reported actor spelling at the API; cache independent results and profile tabs; emit partial results for every completed source, retain abort/IME guards.
- [x] Verify focused browser tests and full quality gate.

### Task 3
- [ ] Record current Netflix date-feed scope/count, without claiming full library coverage.
- [ ] Review complete diff; exact source CI, receipt-only CI, merge and verify canonical deployment.

Actual-data finding: TMDB movie credits omit runtimes; pure predicate reuse alone retained Nolan shorts. Project verified ranking IDs to a110KB index, rebuild/stage with every director projection, and constrain complete director lists. This replaces loading4.9MB of biography/poster data for healthy profiles.

Integration checkpoint: preserve main cinema discount feature15e214bb in a true merge parent. Official Netflix editorial review adds4 identified films with verified artwork, bringing dated Netflix coverage to9 rows (October5); remains partial and excludes series.
