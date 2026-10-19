# CINELVA full-product functional and UI audit acceptance contract (2026-10-19)

Status: implementation contract, not proof of implementation. Source of truth: live main, issue #239, route manifest, CI evidence. Preserve brand logo, name, colors, user data and origin.

## Common movie interactions
- Poster/title: navigate to canonical standalone movie detail URL; browser back restores tab, filter, sorting, search and scroll.
- Rating: retain the CURRENT implemented gauge behavior and its already-fixed accidental-operation handling. This is a regression-only check, NOT a request to reimplement or redesign gauge gesture logic. Confirm current scoring scale from live source before asserting it. Never invent watched status.
- Eye icon: exactly one consistent review modal per movie; default date today for new records, retain existing dates when editing. No duplicate eye action. Save/cancel/close/escape/focus behavior consistent. Theater/streaming only.
- Bookmark: one toggle everywhere relevant, independent of viewing/rating/review; blue filled when active, accessible state and transient auto-dismiss toast 'ブックマークしました' on add, appropriate removal feedback. Dedicated watchlist page; no redundant bookmark list in My CINELVA dashboard.
- Show 'あなたの評価' vs '見た人の評価' distinctly; do not duplicate TMDB/community values; distinguish missing from zero. Posters must display wherever available and show consistent placeholder otherwise.

## Freshness / no-regression gate
Before implementation, inspect current main, open PR #401, latest issue #239 comments, docs/operations/work-state.json, and any PR-branch docs/operations/movie-operation-contract.md and ui-operation-inventory.json. Classify each requirement as already implemented / pending PR / broken / missing / production unverified. Do not recreate shared bookmark store, watchlist tab, gauge behavior or controls that already exist. The inventory is reported as 29 routes, but its current PR branch must be fetched and checked before treating it as merged. CI or PR status is not production verification. Respect Vercel rate limit and avoid redundant deploy attempts.

## Coverage matrix
Check each active route from machine-readable route manifest, plus dialogs, embedded cards, rankings, awards, directors, search, calendars, film festivals, outdoor screenings, streaming, My CINELVA and watchlist. Record applicable interactions, layout variant, mobile/desktop, theme, empty/loading/error states, keyboard and touch. Non-movie rows must not receive movie controls.

## Visual design tokens
Unify card boundaries, spacing, gaps, poster aspect ratios, alignment, title truncation, typography, button/icon size, hover/focus/disabled states, overlays, labels, dropdowns, skeletons, error messages, footer/help/version metadata. Avoid both touching borders and excessive gaps. Do not redesign the logo.

## Domain-specific invariants
- Director filmography: directed feature films only, exclude irrelevant anthology/shorts under agreed 30-minute threshold; verify total counts, watched counts, Japanese display names, posters and director portraits when sourced.
- Awards: prestige-based order, most recent years first, award category support, poster and review action; clear decade matrix in My CINELVA.
- My CINELVA: compact lifetime/selected-year totals, average, >=4 stars, theater/streaming, top/most highly rated director and award with minimum sample safeguards, genre and production country. Annual viewing calendar below stats, 3x4 months, selected year synchronized, all-time shows years and 50+ gold threshold. Avoid crowns, oversized graphs and redundant year controls.
- Rankings: posters and same movie actions as search. Calendar and events: multiday events visibly span dates, event movie cards use shared movie presentation.

## Regression gate
1. Generate coverage from route manifest; fail CI if any active route lacks a classification and screenshot evidence at narrow phone and desktop widths.
2. Exercise each applicable poster/detail, rating, eye/review and bookmark flow with persistent storage round-trip and cross-route synchronization.
3. Regression-check existing gauge touch behavior without redesigning it; verify modal defaults and edit retention, keyboard focus/escape, toast timeout, no duplicate action, no layout overflow, poster fallback, stable navigation state.
4. Preserve saved data/backups; no mock/demo content in production; no extra external paid services or unauthorized scraping.
5. Record test counts and failing routes, fix until green, merge only after required checks, deploy only when available, then verify actual production URL/SHA and screenshots. Never equate PR/CI with production.

## Implementation order
P0 shared movie model and four actions -> P0 missing posters and duplicated controls -> P1 shared cards and layout tokens -> P1 domain pages -> P1 responsive/accessibility -> P0 regression and release evidence. Continue independent work while deployment blocked. Update issue #239 and docs/operations/work-state.json after meaningful milestones.

## Mandatory full-product functional audit (not only UI)
For every feature on every active route, record owner/source, input, transformation, output, persisted state, edge cases, evidence, severity, status, fix PR and production verification. Do not mark complete based on code existence.

### Functional domains
1. Search and discovery: Japanese/English names, punctuation normalization (スターウォーズ/スター・ウォーズ), typos, filtering, sorting, pagination, duplicate handling, empty results and deep links.
2. Movies and metadata: identity across TMDB/local IDs, posters, localized titles, credits, genres, durations, dates, cast/director mapping and correct detail URLs.
3. User records: quick rating, modal review, watched/unwatched, date defaults and partial dates, theater/streaming, edits/deletes, bookmark independence, cross-route consistency, storage reload and import/export.
4. Calendars and schedules: film release calendars, year selection synchronization, viewing calendars, multi-day event boundaries, timezone, unavailable and stale cinema/streaming listings.
5. Rankings/awards/directors: box office ordering, awards categories/years/decade matrix, director filmography inclusion and counts, watched counts, averages, minimum sample rules and drilldowns.
6. My CINELVA analytics: lifetime/year counts, distribution totals, 4+ scores, genre/country/decade, directors/awards, maps, Movie DNA and every chart's source records; zero/one/large dataset handling.
7. Navigation/accessibility: links, state retention, browser back, modal focus, touch/keyboard, responsive layouts, semantic labeling and consistent errors.
8. Runtime/performance: initial load, slow API, offline, failed images, partial responses, concurrency, repeated event handlers, unbounded fetches, memory leaks, console errors, WebKit/iPhone behavior.
9. Compliance/operations: free-only, authorized APIs, poster attribution and rights, external source freshness, privacy, backups, production domain/origin, CI gates, deployment SHA, rollback and support.

### Execution requirements
- Inventory ALL active routes and every user action, API, storage mutation, data transform and scheduled update. Join route manifest and PR #401 interaction inventory, then inspect source for uncovered code paths.
- Create a traceable route × feature × state × viewport × browser matrix, with test ID and screenshots/logs. Classify implemented/PR pending/bug/missing/production unverified. Count verified cells and report failures; never fabricate an overall completion percentage.
- Prioritize reproducible P0 functional defects (wrong counts, lost records, broken navigation, missing images), then P1 visual/accessibility, then P2 polish. Write regression tests before or with fixes and retest affected neighboring pages.
- Exercise at least empty, single, normal, large, stale, API error, offline, reload, import/restore, duplicate identity and legacy data scenarios where applicable.
- Merge and production-verify tested SHA only when checks pass and deployment limits permit. Record evidence in #239 and durable work-state. Do not require the user to manually debug or report issues to find regressions.

## Mandatory detection of systemic defects (2026-10-19 addendum)
A screenshot or click-success assertion alone is NOT evidence that a feature works.

### Five failure classes and required evidence
- Duplicate/non-shared implementation: search all movie actions, storage adapters, date controls, posters, card components, modals, layout tokens and API clients for divergent implementations. Establish a canonical implementation and explicit approved exceptions; detect duplicates by import/call graph and code review, not merely visual resemblance.
- Standards drift: lint hardcoded visual tokens, route shell/brand/navigation discrepancies, inconsistent labels/semantics, missing accessibility and data-contract violations. Maintain an exception register; fail CI on unapproved drift.
- Missing automation: inventory every data source and recurring refresh, actual trigger (Actions cron/manual/webhook), permission/credentials, last success, freshness SLA, downstream consumers, alert on failures, and whether a manual step remains. Never label unsupported sources automated.
- Single route/tab anomalies: enumerate all routes AND tabs, filters, modal states, viewports, themes, signed-in/out where applicable, data conditions; compare component contracts, DOM layout, screenshot diffs and functional behavior against equivalent pages. Audit direct load, refresh and back navigation.
- Dead/no-op feature: enumerate every actionable element (including icon-only, menus, links, cards and keyboard shortcuts); click/activate it with deterministic fixtures; assert meaningful output such as route change, modal with correct data, network result, persisted mutation or explicit user-facing error. Reject empty panels, no-op handlers, placeholder links, swallowed exceptions and silent failures. Follow the resulting workflow to completion.

### Additional fault classes
Broken cross-route sync, stale/false data, missing posters, invalid film identities, incorrect aggregates, race conditions, non-idempotent saves, memory/performance regressions, orphaned code and unreachable features, incorrect empty/loading/error messaging, missing fallback, inaccessible controls, dead external links, untested scheduled jobs, duplicate or contradictory navigation, localStorage corruption and backup restore failures.

### Evidence format and fail-closed rules
For each route/tab/action create an audit row with URL, selector/action, expected behavior, observed behavior, test fixture, screenshots/log, source component, severity, status, CI run and production SHA. Empty output requires a documented valid empty-state contract; never count a click alone as a pass. Maintain route × tab × action × state coverage and a separate scheduled-job × source × freshness matrix. Automated test discovery plus manual architecture review is required: neither can guarantee perfect completeness alone. Detect missing requirements by reconciling user-facing inventory, routes, DOM controls, source handlers, and product specifications. Report uncovered cells explicitly rather than assuming success.
