# Issue #244 — approved external movie data architecture

Status: **approved product decisions; implementation and source compliance verification pending**  
Date: 2026-11-07  
References: #239, #244, #242, #243, COMPLIANCE.md, docs/free-only-policy.md

## Approved decisions

1. **Accuracy first.** Publish only confirmed facts. Candidate/unverified records must not masquerade as confirmed dates.
2. **Two distinct streaming views.** A verified **premiere schedule** and a separately dated **currently available** observation. TMDB JP watch/providers is never evidence of a premiere date.
3. **Curated fallback permitted.** Official announcements may be manually reviewed and recorded with a source URL, review timestamp and reviewer provenance; no unsupported inferred dates.
4. **Staged rollout.** Streaming first, then television, theaters, festivals/events; awards, box office and poster provenance follow the same controls. No release without the relevant gate.

## Existing verified baseline

- `data/streaming_sources.json`: twelve services, all `auto_premiere_discovery: false`.
- `data/streaming-official-feeds.json`: `feeds: []`.
- Thus no service can be described as having verified automated premiere discovery today. Do **not** flip a flag to true without an actual authorized adapter, a test and production evidence.
- Follow `data/source_registry.json` and `scripts/check_sources.py`. HTML/JSON-LD scraping, unapproved feeds, paid services and unverified rights are prohibited.

## Architecture: small, reversible, static-first

```
approved API / licensed feed / manually reviewed official announcement
  -> per-source adapter (explicitly permissioned)
  -> candidate records + provenance
  -> normalization / TMDB movie-ID match / duplicate detection
  -> validation and source-specific freshness rules
  -> atomic publish of versioned, validated static JSON
  -> calendar premiere events OR current-availability observations
  -> UI with evidence, checked-at time and unknown/stale state
```

Do not introduce a database or metered API solely for this feature. Preserve existing JSON readers, IDs and user localStorage; implement adapters behind existing pipelines. An unavailable source is a declared coverage limitation, not a reason to scrape.

## Contract: common normalized records (proposed v1)

```json
{
  "schema_version": 1,
  "kind": "streaming_premiere",
  "movie_tmdb_id": 123,
  "service": "Netflix",
  "region": "JP",
  "event_date": "2026-11-15",
  "date_precision": "day",
  "verification": "confirmed",
  "source_id": "registered-source-id",
  "source_url": "https://official.example/announcement",
  "source_published_at": null,
  "observed_at": "2026-11-07T00:00:00Z",
  "verified_at": "2026-11-07T00:00:00Z",
  "expires_at": null,
  "status": "active"
}
```

This is a **schema example, not real movie data**. Separate kinds: `streaming_premiere`, `streaming_availability`, `tv_broadcast`, `theater_showtime`, `film_event`, `award_result`, `box_office_snapshot`. Availability records must not carry a fabricated premiere date. Broadcast records additionally require region, channel, local start time and timezone. Maintain the source's original evidence separately from the canonical display record. Unknown movie matches remain candidates, not published events.

Stable deduplication key: kind + TMDB movie ID + region + provider/channel/venue + event time/date + relevant edition/version; do not merge different screenings or films with identical titles. Track amendments and cancellation by stable source event ID when available.

## Source approval and coverage ledger

For **each** of Netflix, Prime Video, Disney+, U-NEXT, Hulu, Apple TV+, Lemino, ABEMA, DMM TV, FOD, TELASA and WOWOW On Demand record:

- Official URL; API/feed URL if any; explicit allowed uses; attribution; caching and republication restrictions; rate limits; source registry status.
- `premiere_discovery`: automated_verified / manual_verified / unavailable / unverified.
- `current_availability`: observed / unavailable; evidence timestamp and known limitations.
- Last successful retrieval, last failure, fetched count, candidates, matched, published, changed, withdrawn, rejected, stale.
- Counts for next 30/60/90 days and comparisons against available official announcements.

Only change `auto_premiere_discovery` after legal approval, adapter implementation, fixture-based tests and observed production publication.

## Publication and safety gates

- Validate shape, movie/TV classification, exact date provenance, title/year consistency, provider/region, duplicates, source approval and future date validity.
- On timeout, malformed response, empty/unexpected drop or ambiguous match: **fail closed**, retain last-known-good static dataset and its original generated timestamp; emit a failure report. Never rewrite saved reviews, watch history, bookmarks or backup keys.
- Expired TV schedules and past showtimes are hidden or explicitly labeled historical, not presented as currently available.
- Only successful validated changes update data timestamps; keep `retrieved_at`, `verified_at`, `source_published_at` and `published_at` distinct.
- Daily or source-appropriate scheduled GitHub Actions with manual dispatch; avoid unnecessary executions and unbounded loops. CI checks source registry and data contracts before deployment.
- The UI must show last confirmation, original source and unknown/unavailable status where appropriate.

## Delivery slices and acceptance tests

**PR A — design and compliance inventory:** this document, actual workflow/script/data/UI path inventory, service-by-service source approval and measured baseline. No false claims of automatic discovery.

**PR B — shared pipeline:** schema/validation, provenance, matching, dedup, change/withdrawal and atomic last-known-good publication. Fixtures for new title, same-title different-year film, TV-series contamination, duplicates, change, cancellation, empty feed, API outage and stale data.

**PR C — first approved streaming adapter:** one actually authorized official API/feed, if available, or curated official announcement import with explicit human verification. End-to-end test: new unseen movie appears in source -> correct TMDB movie -> visible on calendar. Do not promise automated premiere discovery when no authorized source exists.

**PR D — coverage and production evidence:** service-level dashboard/log, 30/60/90-day coverage, before/after published counts, actual deployed SHA and mobile Safari verification. Extend the same design to TV, theater, events and other categories in separate reviewed PRs.

## Release definition of done

For every category, identify automated/partial/manual/unavailable with evidence. Show reproducible source-to-production additions, modifications and withdrawals, not just green Actions or updated `generated_at`. Record exact-head CI, validated main SHA, production READY + alias, UI evidence and remaining source limitations in #244 and #239. Keep #244 open until these conditions are satisfied.
