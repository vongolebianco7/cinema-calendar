# CINELVA data coverage (2026-10-17)

## Awards
- 291 sourced award/category records across 8 organizations; 180 have uniquely matched TMDB IDs.
- Official Japanese Academy 2025 results and Kinema Junpo 2024 selection / 2025 presentation have been added. Years in the heatmap mean award/presentation years, not selection-year labels.
- Identity resolution uses the existing approved TMDB API, exact localized/original titles and release-year windows. Same-title ambiguities stay unresolved. Recipient suffixes are kept separately; raw source titles are retained.
- Full award corpora and per-decade totals have not been established. Achievement percentages stay disabled for partial cells. Missing cells differ from zero watched works. An unresolved identity never means definitely unwatched.
- `scripts/enrich_award_catalog.py` reconciles existing catalog metadata offline in the daily workflow; `scripts/resolve_awards_tmdb.py` performs the bounded API identity lookup when explicitly run. Neither scrapes award websites.

## Streaming
- Start dates are maintained in `streaming.json` only when an official announcement establishes them.
- Current provider snapshots come from TMDB's approved JP watch-provider API, powered by JustWatch. Each film keeps its own successful observation time. Failure of the whole batch preserves the last successful timestamp and file. Writes are atomic.
- Discovery excludes provider observations older than seven days, empty provider results and future timestamps. A premiere announcement alone never establishes continuing availability.
- WOWOW official on-demand listing records for The Walk (2015) and Aristocrats (2021) were individually checked in the browser. Their official pages list availability through 2026-10-31 23:59 JST. Premiere dates are unknown. They are displayed separately from TV and release-calendar events, with original source links, observation dates and expiry.
- WOWOW's full catalog and all providers' premiere schedules cannot be automatically sourced under the presently approved APIs. No provider scraping or private API bypass is enabled. Curated listings expire from recommendations after seven days unless reviewed again; authorized TMDB coverage updates automatically.

## Personal records
- Existing legacy keys are never rewritten. Country, runtime, independent classifications and unknown metadata survive edits and record-backup restoration.
- Restoration validates the entire input before writing and preserves legacy deletion markers on a failed record write. Watched-without-rating, zero rating, partial dates and unwatched legacy entries retain their meaning.
- Formats and work forms are independent. Documentary does not imply human drama; lack of animation metadata does not establish live action. Users can enter a known medium/work form explicitly.
- Director lists are partial TMDB filmographies. Gold highlights mean a sourced award match; outlined nodes mean TMDB score >= 7.5 and >= 100 votes. No full-career completion percentage is claimed.


### Per-service coverage snapshot

Snapshot file: `data/availability.json` (`generated_at=2026-10-16T18:49:04.484983+00:00`). Counts below are unique movie records per service, observed across subscription, rental or purchase listings; “fresh” means the movie's `checked_at` is no more than 7 days old as of 2026-10-17 11:58 JST. Old observations are excluded from recommendation results. A zero means no record in this snapshot, not that the provider has no catalog.

| Service | Fresh movie records | Stale movie records |
|---|---:|---:|
| Netflix | 10 | 6 |
| Prime Video | 45 | 11 |
| Disney+ | 1 | 1 |
| U-NEXT | 46 | 10 |
| Hulu | 28 | 0 |
| Apple TV+ | 2 | 0 |
| ABEMA | 0 | 0 |
| Lemino | 0 | 0 |
| WOWOWオンデマンド | 0 | 0 |

Provider names are normalized using the aliases in `scripts/update_availability.py`; counts can include a movie appearing in more than one listing type, but each movie is counted once per service. Timestamp freshness is determined by each movie's `checked_at`, not file modification time.
