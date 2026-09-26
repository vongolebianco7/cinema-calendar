# IMAX Official Evidence Catalog — Design

## Status
Design approved in chat on 2026-09-26. This document defines the architecture before implementation planning.

## Goal
Prevent Cinemap from missing decisive IMAX facts for films such as *The Odyssey*, *The Dark Knight*, *Oppenheimer*, *Disclosure Day*, and future releases.

The system must stop depending on ad-hoc per-film manual score fixes. It should maintain a reusable, traceable catalog of official IMAX facts and feed those facts into the existing screening-format model.

Success means:
- official IMAX facts are checked before heuristic film-trait inference;
- a missing local evidence entry does not silently turn a major IMAX title into a low score;
- every strong IMAX claim can be traced to an official source;
- no paid or usage-credit service is required;
- no runtime fan-out or repeated third-party requests are introduced;
- collection remains compliant with source terms, robots directives, copyright, and reasonable request rates.

## Non-goals
- Do not scrape review sites, fan wikis, IMDb, Letterboxd, Filmarks, or other unofficial catalogs to establish IMAX facts.
- Do not call IMAX or search engines when a user opens a movie page.
- Do not use TinyFish, Firecrawl, paid APIs, LLM APIs, proxy networks, CAPTCHA bypass, or other metered/credit-consuming services.
- Do not infer `Filmed For IMAX`, camera type, 1.43:1/1.90:1 expansion, or IMAX 70mm from genre, director, studio, popularity, or an IMAX logo alone.
- Do not equate “released in IMAX” with “shot for IMAX”.

## Existing integration points
The repository already contains:
- `data/screening_format_evidence.json` — current film-specific screening evidence;
- `js/screening-model-v7.js` — current scoring model;
- `scripts/check_screening_v7.js` — regression checks.

The new catalog is an upstream evidence layer. It should not duplicate scoring logic.

## Architecture

### 1. Canonical catalog
Add `data/imax_catalog.json` as the normalized source of IMAX-specific facts.

Each record should contain stable identity plus factual fields, for example:

```json
{
  "tmdb_id": 123,
  "title": "Example",
  "original_title": "Example",
  "release_year": 2026,
  "aliases": ["Japanese title"],
  "official_imax_release": true,
  "filmed_for_imax": true,
  "imax_camera": "imax_film",
  "expanded_ratio": ["1.43:1"],
  "expanded_runtime_minutes": null,
  "imax_70mm": true,
  "imax_specific_sound": "unknown",
  "evidence": [
    {
      "source_type": "imax_movie_page",
      "url": "https://www.imax.com/...",
      "claim": "shot entirely with IMAX film cameras",
      "checked_at": "2026-09-26"
    }
  ],
  "confidence": "official-confirmed",
  "last_verified_at": "2026-09-26"
}
```

Unknown is different from false. Fields that are not explicitly supported by an official source must be `null`/`unknown`, never guessed.

### 2. Identity matching
Match catalog records to Cinemap movies in this order:
1. exact TMDb ID when known;
2. normalized original title + release year;
3. normalized title/alias + release year;
4. otherwise place the record in an unresolved review queue rather than auto-linking it.

A title-only match is not sufficient because remakes and reused titles exist.

### 3. Source hierarchy
Use official sources only for automatic/high-confidence IMAX facts, in this priority order:
1. IMAX individual movie/news pages with film-specific technical statements;
2. IMAX official movie catalog / release listings;
3. IMAX investor slate/materials when they explicitly identify `Filmed For IMAX`, IMAX DNA, IMAX 70mm, or equivalent film-specific status;
4. official studio/distributor/filmmaker technical material when IMAX itself does not expose the needed detail.

A lower-priority source may add a fact but must not silently override a contradictory higher-priority official fact. Contradictions go to review.

### 4. Collection strategy: low-frequency static generation
The website must never fetch IMAX data during user requests.

Collection is an offline/static maintenance task. Preferred sequence:
1. inspect a small allowlisted set of official index/slate sources;
2. identify new or changed film entries;
3. fetch only the new/changed official film pages needed to resolve technical facts;
4. normalize facts into `data/imax_catalog.json`;
5. produce a diff/review report;
6. update the committed catalog only after validation.

The collector must cache source fingerprints/ETag/Last-Modified where available so unchanged sources are not repeatedly downloaded.

### 5. Compliance gate
Before any source is fetched automatically, it must be registered in an allowlist with:
- domain;
- purpose;
- source class;
- terms/robots review date;
- allowed fetch mode;
- minimum request interval;
- notes.

If automated retrieval is disallowed, ambiguous, blocked, or requires bypassing access controls, the collector skips that source and emits a manual-review item. It must never bypass robots, authentication, rate limits, bot protection, CAPTCHAs, or technical restrictions.

Only short factual attributes are stored. Do not store copied article/page prose. `claim` should be a concise factual paraphrase sufficient for auditability, with the source URL retained.

### 6. Scheduling
Do not run a crawler continuously.

Initial implementation should support:
- manual execution;
- at most a low-frequency scheduled GitHub Action after the compliance allowlist is validated;
- one run should stop when there are no source changes;
- bounded concurrency of 1 for external IMAX requests;
- conservative delay between requests;
- hard maximum request count per run.

The exact cadence and request ceiling belong in implementation configuration, not hard-coded into scoring logic. Weekly is the intended maximum default cadence unless a stricter source requirement applies.

### 7. Evidence precedence in scoring
The scoring path becomes:

`IMAX official catalog -> existing screening evidence -> film-trait heuristic fallback`

Rules:
- official catalog facts always win over heuristic inference;
- existing manually verified evidence can supplement the catalog but cannot contradict a stronger official fact without raising a conflict;
- lack of catalog data is not negative evidence;
- missing IMAX facts must not automatically produce 1–2 stars;
- the current product rule remains: IMAX 2★ is exceptional, 3★ is the normal neutral baseline, 4★ is for strong IMAX presentation/film-fit evidence, and 5★ requires decisive IMAX-specific creative/presentation evidence such as meaningful IMAX capture/expanded presentation;
- exact scoring remains owned by `js/screening-model-v7.js` (or its successor), not by the collector.

### 8. Distinguish IMAX facts
The catalog must preserve these distinctions:
- `official_imax_release`: the film is officially presented/released in IMAX;
- `filmed_for_imax`: official Filmed For IMAX designation;
- `imax_camera`: IMAX film / IMAX-certified digital / other / unknown;
- `expanded_ratio`: 1.90:1 / 1.43:1 / mixed / none-confirmed / unknown;
- `expanded_runtime_minutes`: when officially stated;
- `imax_70mm`: film-specific IMAX 70mm presentation confirmed;
- `imax_specific_sound`: only when film-specific official evidence exists.

These flags must not be collapsed into one `is_imax` boolean.

## Initial coverage
The first catalog pass should prioritize both historical benchmark films and current/upcoming IMAX releases rather than only the titles already reported by the user.

Regression anchors must include at minimum:
- The Odyssey (2026) — IMAX 5 expected from decisive official IMAX capture/presentation evidence;
- Oppenheimer — IMAX 5;
- The Dark Knight — IMAX 5;
- Dune: Part Two — high IMAX case with official facts preserved;
- Spider-Man: Brand New Day — official IMAX release + strong film-fit case must not fall to 2;
- Disclosure Day — official IMAX/Filmed For IMAX evidence must not fall to 2;
- a quiet/small-scale non-IMAX title — proves the model can still produce the exceptional 2 case;
- an unknown-evidence title — proves unknown does not mean poor fit.

The collector should also generate a coverage report: number of Cinemap theatrical/upcoming titles with official IMAX evidence, unresolved matches, stale records, and conflicts.

## Staleness and future films
Upcoming-film technical details can change before release. Every record therefore carries `last_verified_at` and evidence URLs.

Future releases should be rechecked when:
- a previously unknown technical field becomes available;
- a new official film page appears;
- the release reaches a configurable pre-release window;
- a source fingerprint changes.

A stale record is not deleted automatically. It is marked for re-verification.

## Failure behavior
Collection failure must never break Cinemap pages or lower a score.

If collection fails:
- keep the last known-good committed catalog;
- emit diagnostics/review output;
- do not overwrite the catalog with an empty or partial result;
- do not reinterpret missing data as `false`;
- do not block GitHub Pages deployment unless a committed catalog change itself fails schema/regression validation.

## Tests
Implementation must be TDD-driven and include:
- JSON schema/shape validation;
- unknown-vs-false tests;
- title/year/TMDb identity matching tests;
- duplicate/conflict detection;
- source-priority tests;
- collector request-budget and single-concurrency tests;
- last-known-good preservation on fetch/parse failure;
- scoring integration tests for the benchmark films above;
- regression test that official evidence cannot be silently overridden by heuristics;
- regression test that missing catalog data does not become a low-score penalty.

## Cost and operational constraints
- Zero paid APIs/services.
- Zero TinyFish/Firecrawl/LLM/API credit consumption.
- GitHub Actions only within the repository's available free allowance; manual execution remains supported so the feature does not depend on paid Actions capacity.
- Static JSON is served by GitHub Pages with the rest of the frontend.
- No database is required for the first version.

## Security and legal constraints
- No secrets should be needed for official public sources.
- No browser automation for protected pages.
- No copying long source text into the repository.
- Preserve provenance for every high-confidence claim.
- A source must be removable/disabled centrally if its terms or access policy changes.

## Rollout
1. Add schema, allowlist, matching/validation code, and tests.
2. Seed benchmark official evidence and prove scoring integration.
3. Add compliant low-frequency discovery/refresh for allowlisted IMAX official sources.
4. Generate coverage/conflict reports.
5. Only then enable an optional scheduled refresh if compliance checks are satisfied.

## Acceptance criteria
The feature is complete when:
- the benchmark films produce the expected IMAX outcomes from catalog facts rather than title-specific score overrides;
- Cinemap can distinguish official IMAX release from Filmed For IMAX, camera capture, expanded ratio, and IMAX 70mm;
- unknown evidence never becomes a false negative;
- every high-confidence technical fact has an official source URL and verification date;
- collection does not happen at page-view time;
- no paid/credit-consuming service is used;
- prohibited/ambiguous automated access is skipped rather than bypassed;
- existing non-IMAX format scoring remains intact.
