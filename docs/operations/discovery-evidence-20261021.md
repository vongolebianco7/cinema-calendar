# Current discovery acceptance — 2026-10-21

Scope: the current user-approved discovery flow, not retired next-action widgets, custom shelves or 3D maps.

## P1-07.1: record-based discovery and explicit gaps

`renderDirectors` derives its picker from recorded feature films, excludes shorts and directors without a reviewed feature, and shows the named director's actual Director credits, watched/unwatched state and known coverage. It includes original feature-film records in progress; imported local/TMDB IDs cannot double-count a film or mark a conflicting film watched. Missing runtime/identity/coverage is not invented. Director profile clicks reach `discover.html?person=…&role=監督`; PR448 restricts those results to actual Director movie credits and PR449 verifies snapshot fallback provenance. The canonical live API returned Nolan's13directed movies in the production smoke, excluding producer/writer-only credits.

The award organization/decade cell identifies why its films are shown; each result has its prize/category, year, watched/unwatched status and source. The existing highest-prize/all-category controls preserve that scope. Unconfirmed identities go to title search rather than a guessed record. This makes the next-film choice an explicit director or award gap selected by the user. Shared cards lead to detail/review and the resulting record feeds those same counts. No rejected next-action prompt was restored.

Evidence: existing director runtime regressions cover shorts, unreviewed directors, all watched features, duplicate identities, conflicting identities and unknown runtime. Award/runtime and Chromium/WebKit journeys cover cell→list→shared review. PR448/449 exact CI and production smoke are recorded in #239 and the progress ledger.

## P1-07.2: supported filter combinations and unconfirmed availability

Four behavioral regressions execute the actual discovery query builders and actual shelf filter. Genre+era+rating+duration+country+multiple providers survive one query. A director decade replaces the requested date range while preserving runtime/providers. The public short/rated/classic presets emit their published deterministic constraints. Existing browser scorecard journeys cover era changes, sorting with active filters, detail/back retention and deliberate empty results in Chromium/WebKit.

Availability tabs apply to the explicitly labeled catalogue shelf; the general search provider controls send the selected providers to the official API with Japan watch region and flatrate constraint. A current observation with at least one provider is required for the shelf's “配信あり”. Stale, absent, future-dated and empty observations remain “未確認”; none is represented as confirmed unavailability. The public note states its7-day window and directs users to the provider for current terms. These filters do not claim whole-catalogue coverage.

No network source, scraping, billing, tracking or local record write was introduced by these acceptance checks.
