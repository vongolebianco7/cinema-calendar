# Nationwide now-playing discovery

The user approved adding a nationwide now-playing list first, with bookmark alerts as a later feature. Approved scope: an entry in discovery, existing three-column cards/detail/review/bookmark controls, daily refresh with observation time, and links to official screening information. Preserve logo, colors, existing routes, local records and all free-only/no-scraping rules.

## Approach

Use the already-approved TMDB developer API `/movie/now_playing`, `region=JP`, `language=ja-JP`, rather than guessing screening status from release dates. Its documented semantics are a national theatrical list, implemented upstream through a release-date window; it is not an exhaustive, independently verified list of every cinema session. State the source and coverage limits beside the list. Existing theatrical recommendations stay separate and retain their current meaning.

A daily GitHub Actions refresh publishes one static `data/now_playing.json`. This avoids the currently quota-suspended DB and browser API credentials. Collect all pages atomically; incomplete/invalid responses preserve the previous snapshot. Keep attribution under existing TMDB noncommercial policy. Do not scrape cinemas or invent an official film URL. Link to existing cinema directory with its official cinema links for screening times.

Alternatives considered: reusing the existing release-date shelf would incorrectly claim future/ended releases are playing; cinema-specific schedules would require new permission/data sources and exceed the approved nationwide scope. The approved shared-card list is retained; I choose the static snapshot implementation to minimize cost and DB coupling.

## Behavior

- Place a separate `上映中（全国）` section near the top of discovery, independent of recommendation/rating filters.
- Render every sourced title through three-column cards, initially12, expandable to all. Include title search and popularity/title sorting. Reuse shared identity, inline ratings, reviews and independent bookmarks; detail opens the existing film page.
- Display source, observation time and coverage note. A snapshot older than36hours, a future timestamp beyond5minutes, invalid region/provenance, missing data or fetch failure cannot be presented as current. Show an unavailable/update notice instead; a valid empty list is distinguished from an outage.
- No API keys in browser/artifacts. No DB writes, new trackers, image/logo edits or notification work in this change.

## Evidence and acceptance

Official references checked2026-10-24: https://developer.themoviedb.org/reference/movie-now-playing-list and https://developer.themoviedb.org/docs/faq. Existing source registry already approves TMDB metadata/images with attribution for personal noncommercial use; extend its purpose explicitly.

Unit tests cover full pagination/dedup, failure preservation, approved-source enforcement, malformed/future/stale/empty snapshots and title filtering. Chromium/WebKit tests cover root/prefixed routes, both themes, 390px overflow, expansion, search, shared review/bookmark reload and detail navigation. Shared quality gate and exact-source/final CI precede merge; actual scheduled collection and canonical data/UI publication are separate post-merge checks.

## Observed upstream inconsistency and equivalent retrieval

The initial real collection at2026-10-24 observed pages1–3 advertising100 rows while page4 advertised99. Ordinary no-cache revalidation and equivalent query ordering retained the mismatch, so no snapshot was published. TMDB officially documents now_playing as an equivalent discover query (https://developer.themoviedb.org/reference/movie-now-playing-list). A read-only diagnostic using the upstream response’s exact dates.minimum/maximum, regionJP/languageja-JP, with_release_type2|3, include_adult=false/include_video=false and popularity.desc returned5×20 rows with consistent100 totals and passed the unchanged complete collector.

Ruling: on pagination/count inconsistency only, allow one complete equivalent retrieval using that frozen, validated upstream window. Retain every page/identity/raw-count check and atomic preservation. Malformed identities, network failures, invalid windows or incomplete equivalent responses remain failures; valid direct results make no extra requests. Record retrieval_endpoint and upstream_window in provenance. No local guessed date cutoff, collection from release recommendations, or guard relaxation. Both paths share the120second deadline and20page per-observation ceiling. Temporary read-only diagnostic workflow is removed before release.
