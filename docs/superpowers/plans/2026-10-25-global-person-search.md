# Global movie and person search implementation plan

> For agentic workers: execute natively with deterministic regression checks.

**Goal:** The header searches films, directors and cast; typing shows tappable candidates. Selecting a person shows a profile and complete available movie credits as three poster columns with the shared review control.
**Architecture:** Add one shared header controller loaded by the existing shared theme script. Reuse movie search/local catalog and `/api/people` with an additional profile+credits response. Keep movie search fallback and existing director-ID endpoint intact. The search page adds people matches and a selected-person panel; existing My Cinelva storage and quick-review component remain authoritative.
**Tech:** plain JavaScript/CSS, existing Next.js read-only TMDB adapter, Node tests and Playwright.
**Spec:** User instructions of 2026-10-25: global people/movie autocomplete, candidate tap submits; profile/filmography matches My Cinelva's director collection, three columns and common reviews.

## Constraints
- Free-only; no scraping, no new dependency/service, no storage migration.
- Japanese profile fields: name, portrait, birthday, birthplace, biography when present, source link. Never invent missing facts.
- Director credits only job=Director; acting credits separately selectable. Deduplicate IDs, films only, exclude adult entries; no arbitrary filmography truncation.
- 390px page has no horizontal overflow. Every poster has a separate common review area.

## Review focus
- Same-name people retain exact IDs/role; never resolve by display name alone.
- Late autocomplete responses cannot replace newer input; IME composition must not submit.
- Escaping, safe image paths, no markup injection from names/biographies.
- API failure keeps film/local results and allows retry; no invented empty complete filmography.
- Candidate tap, keyboard selection and ordinary Enter all perform a committed search.

## Tasks
- [x] Write failing pure-model tests for candidate identity, role filtering, URL encoding, credit filtering/deduplication and chronology.
- [x] Extend people API for profile plus movie credits; preserve existing q and role=director interfaces. Validate IDs and expose source/coverage explicitly.
- [x] Implement shared autocomplete with debounce, cache, cancellation/stale guards, IME and accessible keyboard/touch controls; mount through shared header infrastructure.
- [x] Implement people result/profile views and three-column poster cards using CinelvaQuickRate.mountInline; retain movie search/local fallback.
- [x] Add Chromium/WebKit mobile root/prefix/other-page journeys, deferred-response and errors, review save/reload and exact person/movie navigation.
- [ ] Full local quality, focused review and required exact-source CI; receipt-only proof, final CI, merge and verify both canonical frontend/backend.

Review: independent read-only review found unbounded fetches, missing director identity on saved reviews, and initial ArrowUp selection. Bounded abortable requests/independent early people results, exact director metadata and corrected keyboard selection were implemented. Browser tests observed missing-director and stalled-movie failures before fixes and now pass, including review persistence and profile-timeout fallback. Autocomplete uses39KB name readings; full5MB director snapshot is fetched only as a failed-profile fallback.
