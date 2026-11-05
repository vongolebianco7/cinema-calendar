# CINELVA unified data automation architecture (proposal)

Status: proposed, design-only; no production source activation. Owner: #239 / #244.
Constraints: zero-cost personal use; no scraping; approved source registry; no new metered services; preserve user watch history, ratings, bookmarks, backups, and restore formats.

## Current baseline (verified 2026-11-06)

- `.github/workflows/update-movies.yml` runs daily, builds multiple movie/provider snapshots, commits JSON to main, then synchronizes movie and TV data to PostgreSQL. A DB sync failure can occur after JSON publication. It currently shares the `cinema-database-write` concurrency group with nationwide now-playing.
- `.github/workflows/update-now-playing.yml` separately refreshes the TMDB JP now-playing snapshot; it has a pre-collection and pre-publication exact-source proof gate.
- `data/source-status.json` shows streaming availability from TMDB watch/providers is automated but incomplete and may contain stale observations. Streaming premieres, TV broadcasts, festivals, outdoor events, premium formats and special screenings rely on manual official intake or validation; automated website acquisition is not authorized.
- `data/source_registry.json`, `COMPLIANCE.md` and `scripts/verify-production-release.cjs` are authoritative; the production proof is a fail-closed gate, not a nuisance to bypass.

## Target architecture

```text
Approved API / explicitly licensed machine-readable feed
    | source adapter (isolated; allowlist + budgets)
    v
Raw observation manifest (source, fetched_at, terms, checksum, run_id)
    v
Schema validation + identity resolution (TMDB ID; deterministic)
    v
Normalized candidate dataset + provenance + expiry
    v
Quality gate (completeness, freshness, deduplication, poster URLs,
              changes vs previous good snapshot, license, source proof)
    |
    +-- reject/quarantine --> diagnostics + alert; keep last known good
    |
    v
Immutable, versioned release manifest (dataset version + checksums)
    |
    +--> static JSON publication (atomic candidate -> current pointer)
    +--> movie/TV DB staging + idempotent upsert + verification
    |
    v
Post-publish health checks and rollback to last known good
```

### Source adapter contract

Every adapter returns observations in a common schema, with `source_id`, `source_url` or API reference, `observed_at`, `valid_from`, `valid_until`, `territory`, `title`, `tmdb_id` when known, `provider_id` where applicable, `content_type`, `rights_mode`, `confidence` and `run_id`. Missing values remain null; never fabricate titles, air dates, venue dates or availability. Store the terms/attribution decision in the source registry; adapters cannot self-approve. Record `last_success_at`, `last_attempt_at`, `item_count`, `stale_count`, `failure_reason`, `data_version` and `publication_version` per domain.

Adapter modes:
- `approved_api`: automated fetching, bounded requests, caching and retry.
- `approved_feed`: automated only after explicit machine-readable feed terms and redistribution review.
- `manual_curated`: source-reviewed structured input, automatically normalized, enriched, validated and published; discovery is NOT claimed to be automatic.
- `disabled`: no collection, no fallback scraping, no silent reuse as fresh data.

### Domain-specific strategy

| Domain | Current permitted source | Automation scope | Important limitation |
| --- | --- | --- | --- |
| Movie catalog, posters, ratings, release dates | TMDB API | Daily incremental API fetch, deterministic ID merge, poster path/HTTP checks, fallback | TMDB catalog coverage is not guaranteed exhaustive |
| Japan streaming availability | TMDB watch/providers (JustWatch attribution) | Rolling per-title refresh, adaptive bounded queue, provider coverage and stale flags | Observed availability is not a complete upcoming premiere announcement calendar |
| Official upcoming streaming premieres | Source-reviewed official announcement records | Auto-ingest and TMDB match from approved structured inputs | No automatic scraping of Netflix/Prime/U-NEXT/Disney+/ABEMA/WOWOW websites; new official feeds require permission review |
| Currently playing | TMDB now-playing JP | Daily independent refresh | Not cinema-specific showtimes |
| Television broadcasts | Existing source-reviewed station records | Auto-enrich, de-duplicate, expiry, validate; add feed adapter only if licensed | Do not promise nationwide live TV schedules without an authorized feed |
| Film festivals, outdoor and special screenings | Organizer-reviewed structured records | Auto-validate, enrich, expire, publish | Discovery remains manual unless approved official machine-readable feeds exist |
| IMAX/Dolby/premium formats | Official brand/theater directory reviewed manually | Automated normalization and change audit of approved structured records | No theater page scraping; no invented session times |
| Theater showtimes | None authorized for automatic collection | Keep disabled and mark unavailable | Requires approved license/API |
| Box office / awards | Existing approved TMDB/Wikidata or curated facts | Auto-enrich supported fields and validate provenance | Do not republish unlicensed industry charts |

### Scheduling and reliability

- Separate API observation, dataset build, release verification, and DB synchronization workflows. A dataset refresh must not hold a database-write lock while calling remote APIs. DB writes alone use a serialized `cinema-database-write` concurrency group.
- GitHub Actions daily jobs use fixed schedules with manual dispatch. Run within GitHub/Vercel/Neon free quotas; stop cleanly at quota threshold rather than upgrading or silently charging.
- Limit each adapter's API budget and execution time. Retry transient errors at most twice with bounded exponential backoff; no retry on 401/403/terms rejection. On partial failure, preserve last known good entries and explicitly age them out by domain TTL; never represent stale records as newly verified.
- Incremental checkpoints and idempotent upserts permit safe reruns. No forced pushes; do not rewrite user tables. Data tables are separate from user-owned reviews/bookmarks.
- Avoid updating the entire catalog when only one domain changes. Publish domain-specific versioned manifests, then update an atomic aggregate pointer only after validation.
- Source-proof guard runs before external collection, before GitHub publication, and before DB writes. A changed executable/config/source registry must receive required exact-head CI and receipt-only proof renewal. Do not auto-mint proof from unverified code.

### Quality and observability gates

- Fail closed on unapproved source, missing required attribution, malformed schema, duplicated canonical keys, unknown TMDB identities above a documented threshold, major unexpected item-count drop, poster fetch failures above baseline, or invalid dates.
- Streaming: report by service, territory, current-vs-upcoming, source, freshness, unmatched count, and gaps; avoid a false "100% coverage" claim.
- TV/events: count upcoming verified records and expired records, plus days since source review. A successful workflow that merely reprocesses old manual inputs is **not** a successful source refresh.
- Poster checks: sample actual image HTTP and browser render across calendar/search/directors/streaming/My Cinelva; fallback is an explicit failure signal, not proof of poster coverage.
- Per-domain dashboard from generated JSON and Actions summaries: last successful observation, last publication, freshness, counts, drift, failed adapters, current version, DB sync parity, production deployed SHA.
- Alert only on actionable degradation (two failed scheduled runs, data age > TTL, major count regression, source permission change, publication/DB parity mismatch). No new paid monitoring service.

### Publication and rollback

1. Build candidate with immutable run ID, source provenance and SHA256 hashes.
2. Validate candidate against current last-known-good and required CI receipt; fail without writes on guard failure.
3. Publish candidate snapshot, verify exact bytes, and atomically promote a manifest pointer. Keep prior good version available.
4. Sync movie/TV DB with idempotent upserts in a transaction/staging approach, verify row counts and version; do not touch user-owned tables.
5. If DB sync fails, mark release `partial`, retain previous DB state, and retry DB-only from the same approved immutable manifest. Do not label the whole update successful.
6. Verify frontend/backend production aliases and real content. Roll back only the affected domain pointer or DB staging transaction; never roll back user data.

## Implementation sequence and acceptance criteria

**P0 — baseline and safety (first):** inventory all current workflows, source registry, existing schemas, quotas and DB mappings; add a read-only machine-readable source health report and source-version parity checks. No new source activation. Tests prove existing user records are untouched.

**P1 — adapter normalization:** extract TMDB movie and watch-provider fetching into shared adapter interface; preserve current outputs and tests; enforce bounded queues, per-item provenance and idempotent merge. CI compares output with current format for backward compatibility.

**P2 — release decoupling:** split observation, validation, static publication and DB sync; immutable manifest and resume tokens; inject failure at each stage and prove last-known-good survives. Exact-source proof and free-only checks remain mandatory.

**P3 — domain expansion:** implement approved-feed adapter framework; only turn on a specific TV/event/IMAX feed after documented terms, rate/storage/display review. Keep manually curated domains automated *after intake*, clearly marked `manual_curated`.

**P4 — operations:** per-source freshness, parity and error dashboards; alerting; production and physical iPhone verification; a release gate that rejects stale/partial coverage rather than claiming completeness.

Definition of done: 7 consecutive scheduled runs without unreviewed failure; all approved adapters refresh within documented TTL; no duplicate keys; a forced API failure leaves last-known-good visible; a forced DB failure cannot alter user data and is retriable; exact-source proof and quality CI green; static/DB release versions reconcile; iPhone real-poster routes verified; no new paid service or prohibited collection.


## Review resolution: exact publication and consistency contract

### Cross-system consistency (GitHub Pages / PostgreSQL)

GitHub static hosting and PostgreSQL have no distributed transaction. Therefore **never claim global atomicity**. Use immutable `dataset_version` identifiers, with one release manifest per domain, and independently recorded `static_version` and `db_version`. The release state machine is `candidate -> validated -> static_published -> db_synced -> verified`, with `partial` and `rejected` as explicit failure states. For domains used by both static and API readers, a version is advertised as `current_verified` only after both sides have been read back and their checksums/version IDs agree. Existing static readers that cannot pin versions must continue reading the prior compatible public snapshot until the new version is verified; a compatibility layer must be demonstrated before changing their pointers.

An immutable candidate may be published to a versioned path without promoting the public pointer. The safe default order is: write immutable candidate, validate; stage DB changes in a transaction (only data-owned tables); validate DB staged rows; publish immutable static artifact; verify it is reachable; commit/promote the DB dataset version; then promote the public static pointer and verify both readers. A crash between DB promotion and static pointer promotion is a **partial** release, not success. Reconcile by completing the pointer promotion for the exact manifest or restoring the previous data-owned DB dataset version. Rollback must not mutate user-owned rows. This sequence is a migration target, not an assertion that the current DB supports staging or rollback; inventory schema, readers and migration reversibility first.

Every public API response backed by the synchronized domain should expose `dataset_version` (header or JSON field) without breaking existing consumers. Clients receiving a newer static version and older API version should display the last compatible snapshot or an explicit stale indicator; never silently mix records from incompatible versions. A missing manifest or checksum mismatch is a release failure.

### Exact-source proof across split jobs

A run starts by resolving and recording `source_commit_sha`, `production_proof_head_sha`, `source_digest`, `dataset_version` and immutable candidate checksum. All downstream jobs consume these exact identifiers; no job recomputes from floating `main` after a rebase. If the source changed, require the four mandated CI workflows on the exact executable source and a receipt-only proof renewal before any publication/DB write. Each job checks out the pinned source, runs `check_sources.py`, the existing quality gate where appropriate, and `verify-production-release.cjs --require` before publication or DB sync. Do not bypass the gate when a receipt becomes stale.

Concurrency is scoped to *writes*, with one serialized publication/DB promotion per domain and no forced push. If `main` moves while a candidate is being generated, reject/rebase the candidate through the **full** verification process; do not publish with mixed source hashes. No automatic proof-signing from untested source.

### Resource budgets and domain thresholds (initial conservative defaults; tune from measured baselines)

| Resource/domain | Initial guardrail | Failure behavior |
| --- | --- | --- |
| GitHub Actions | One scheduled full movie observation/day; one now-playing observation/day; cap each movie run at existing 25 min and now-playing at 8 min; no more than two automatic transient retries | Abort before exceeding run deadline; no overlapping writer |
| TMDB | Keep existing per-run adaptive availability queue hard cap of 200 titles and six-minute observation deadline; preserve provider attribution | Defer remaining IDs to later runs, mark stale |
| Neon Free | Preflight read-only capacity/connection/compute status and configured project free-plan limits before DB staging; no paid overage | Skip DB writes if safe capacity cannot be established; mark partial |
| Vercel Hobby | Do not create preview/prod deployments for data-only or docs-only commits; deploy only approved application source changes | Stop at free-plan usage warning; no auto-upgrade |
| Movie/poster data | Fail on a drop >20% from previous verified snapshot, unless an explicit reviewed removal manifest explains it; sample real poster URLs across routes | Quarantine candidate, preserve last good |
| Streaming observations | 7-day per-title freshness target; warn when fresh share <90% and fail promotion when it drops >10 percentage points against previous verified release; report each provider separately | Retain last good, show stale markers; do not claim complete catalog |
| Now-playing | 48-hour target; fail on unexpected >20% count drop or invalid JP territory | Retain previous verified |
| TV schedules | 7-day source review freshness target; require at least one verified upcoming record to label coverage active | If missing, display incomplete/unavailable, not fresh |
| Film festivals / events | 14-day source review freshness target; require cited date and venue for each event | Quarantine invalid records, show manual coverage status |
| IMAX/premium format directory | 30-day manual source review target; no automatic showtime claims | Mark stale/unverified, do not fabricate schedules |

These are **provisional engineering thresholds**, not measured coverage guarantees. P0 must capture at least 14 days of baseline counts, quotas and provider coverage before enforcing a new promotion failure threshold. A 7-run streak demonstrates operational reliability only; it cannot prove source completeness. Quota checks should use available provider metrics or safe local configured limits; if an authoritative live quota endpoint is unavailable, apply the conservative configured cap rather than guessing remaining usage.

### Source permission vs adapter mode

`data/source_registry.json` remains the sole source-permission gate with existing `approved`, `link_only`, `disabled` states. Adapter operational modes (`approved_api`, `approved_feed`, `manual_curated`, `disabled`) are **not** permission grants. An adapter can run automatically only if the corresponding source registry entry explicitly approves its precise acquisition, storage and publication purpose. `manual_curated` means manual discovery and review followed by automated downstream processing; it never authorizes automatic website retrieval.

### Minimum acceptance tests before rollout

1. Simulate API timeout and malformed response: candidate rejected, prior verified static/API records remain readable.
2. Simulate DB sync failure after immutable static candidate upload: public pointer unchanged; previous DB dataset and all user-owned records unchanged; retry same pinned candidate idempotently.
3. Simulate process crash between DB promotion and pointer promotion: release becomes `partial`, both version IDs visible, reconciliation restores verified parity.
4. Simulate a source edit after CI receipt: publication and DB sync reject it before writes.
5. Verify existing static JSON consumers and API clients handle version metadata without schema regression; verify real poster image responses on iPhone routes.
6. Exercise free quota exhaustion: job exits without billable resource activation, without replacing good data.
7. Confirm domain-specific freshness/coverage status distinguishes automated observation from manual intake and never implies full TV/event/IMAX discovery.


## Explicitly unresolved / requires owner decision

- A genuinely comprehensive TV broadcast calendar, official streaming premieres, theater showtimes and event discovery require a permitted machine-readable source or written license. Architecture alone cannot authorize scraping or create source coverage.
- New credentials, paid services, billing, changes to authentication and irreversible DB migrations require explicit human approval.
- Do not merge this design PR as evidence that implementation or live data coverage is complete.
