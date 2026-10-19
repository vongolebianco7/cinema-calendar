# CINELVA UI/UX unification and exhaustive acceptance contract (2026-10-19)

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
