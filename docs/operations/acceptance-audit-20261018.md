# Cinelva acceptance evidence — 2026-10-18

Initial baseline: main `4bac142449f9df00fcd3c44d444093676354d326` (#384). Concurrent #386 (`a4d2b04`) saved-film search normalization and zero-score director regression are preserved during reconciliation.
Issue #239 has **32 ordered acceptance bullets**, below. They are not 32 equal-sized tasks and are not a defensible percentage denominator. Historical work-state item counts are not release completion counts.

`Verified locally` means the named deterministic check was executed in this run. `Partial` means implementation/evidence exists but at least one part of the bullet is still open. `Pending` means the listed evidence is not available. Production evidence is separate from source/CI evidence.

## Current direct feedback

- New review: rating/comment alone must not assign a viewing day. Before this patch `open()` assigned today for a new movie; runtime regression failed. New blank default passes; explicitly selected dates and existing year/month/null precision remain covered.
- Annual calendar: latest user correction on 2026-10-18 16:52 JST is GOLD at **5** films/month, superseding 10. Actual renderer still used 10. Runtime regression failed at five; corrected threshold passes 0/1/4/5/6/10 boundary cases. Twelve months and existing 3-column layout retained.
- Director list: reconcile concurrent #384, do not revert reviewed-only selection or explicit directing-credit checks. Old VM harness lacked `ratedMovies`; use the actual production helper and meaningful rated fixtures. Added unreviewed and missing/conflicting/non-directing credit coverage.
- No 次へ, no rewatch flow, movie theater/streaming methods, tab persistence and annual calendar remain in existing deterministic tests. No independent claim that every visual preference is fully verified.

## All 32 master acceptance bullets

| ID | Acceptance scope | Evidence / remaining action | State |
|---|---|---|---|
| P0-01.1 | Reconcile main, issues, docs, release settings | main #384 and open PRs #368/#339 inspected; Vercel main status still build-rate-limit; historical release docs have stale Pages references; complete cross-document reconciliation remains | Partial |
| P0-01.2 | Entire suite and Python baseline classification | `audit_python_suite.py --strict`:121 tests,0 failures,0 errors. Active Cinelva Node suite is covered by shared gate; retired Ocean feature suites intentionally excluded | Verified locally |
| P0-01.3 | CI lint/unit/browser/accessibility/links/backup/dependencies/licenses/data | Existing quality, frontend Chromium/WebKit390/1280, scorecard, backup and source/data checks; comprehensive dependency/license gate and full external dead-link coverage not established in this audit | Partial |
| P0-01.4 | Artifacts and enforce checks before release | Existing frontend/scorecard artifacts, premerge gate; this patch requires fresh CI and review; production remains unverified | Partial |
| P0-02.1 | Remove Ocean production entry points | Existing retirement tests and static build filter; full canonical production audit pending | Partial |
| P0-02.2 | Retire renderer/assets/demo/tests/dependencies after reference inventory | #379 excludes75.8MB retired payload from published output, preserves redirects; source retirement archive remains, complete dead dependency inventory not established | Partial |
| P0-02.3 | Preserve shared records/ratings/backups/legacy keys | Actual store and backup unit tests in quality gate; no user storage mutation | Verified locally |
| P0-02.4 | Old URLs graceful,0/1/1000 records | Eight redirect files retained; backup1000 fixture exists; exact combined zero/one/1000 legacy-route production acceptance still unverified | Partial |
| P0-02.5 | Supersede #111/#113/#143 only after release | Keep pending until verified canonical production deployment | Pending |
| P0-03.1 | Shared detail/record/rating/date CRUD | #372 browser journeys; current runtime date repair; zero/partial dates tests. Rewatch requirement superseded by user: edit existing record | Partial |
| P0-03.2 | Import/export/unknown fields/conflicts/offline/refresh | Store/backup tests cover preservation, rollback and conflicts; existing browser backup round-trip. Current canonical upgrade verification pending | Partial |
| P0-03.3 | Local-only storage guidance/quota/errors | Page footer and data-backup guidance; storage/backup error tests in gate | Verified locally |
| P0-03.4 | Reconcile #228, no custom shelves | Existing My page contract; custom collections not reintroduced. Full issue reconciliation not established here | Partial |
| P0-04.1 | Source provenance/freshness/unknown display | External data registry, timestamp/data quality tests and check_sources; complete provider-by-provider live evidence still needs audit | Partial |
| P0-04.2 | Stale availability/schedules/duplicates/closed cinemas | Expired availability and duplicate tests; all closed cinema cases not verified | Partial |
| P0-04.3 | Free-only/no scraping/rights/truthful availability | Existing compliance policy/checks, freshness tests; no new external requests or data sources in patch | Partial |
| P1-05.1 | Canonical calendar/counts/country/director/decade/genre | Shared record store, insights tests, director runtime tests, summary implementation; complete user-facing drilldown audit pending | Partial |
| P1-05.2 | Every visualization drills to real films/unwatched | Awards/director journeys exist; all breakdown views not individually verified here | Partial |
| P1-05.3 | Narrative genre separate from medium | insights classification tests including numeric TMDB genres, animation and documentary | Verified locally |
| P1-06.1 | Award rows/decades/count intensity/lists/counting policy | Heatmap identity/dedupe/remake tests and existing browser checks; latest live production not verified | Partial |
| P1-06.2 | Grounded maps/DNA/3D/fallback | Latest user removed 3D navigation; old hidden implementation remains. Do not restore old roadmap UI. Full DNA/current replacement acceptance not established | Partial |
| P1-06.3 | No demos/custom shelves/Atlas naming | Current nav has summary/records/awards/directors; hidden legacy implementation retained; full published text/route inventory still required | Partial |
| P1-07.1 | Explainable record-based discovery/unwatched/gaps | Curated discovery tests and existing implementation; complete personal recommendation relevance audit pending | Partial |
| P1-07.2 | Duration/mood/genre/trusted availability filters | Existing discovery/source contracts; all requested filter combinations not established | Partial |
| P1-07.3 | Discovery/detail/record/visualization loop | #372 shared-review entry browser tests; new null-date path must pass fresh frontend CI | Partial |
| P1-08.1 | Actual iPhone Safari | No physical device attached; CI WebKit is separate | Pending |
| P1-08.2 |390px,touch,scroll,states,themes,a11y,large data | Existing mobile/route audit/backup evidence; fresh current patch CI and complete large-data interaction performance audit pending | Partial |
| P1-08.3 | Performance/no layout shifts | Artifact reduction is not measured page speed. Existing timing producer is not comprehensive CLS or gesture-latency evidence | Partial |
| P1-09.1 | Canonical origin/data continuity | Canonical https://cinelva.vercel.app/; no origin migration. Latest tested source not yet production | Partial |
| P1-09.2 | Naming/legal/film-data-image rights | Existing branding/legal review docs; no renewed legal clearance or per-asset license conclusion in this audit | Partial |
| P1-09.3 |5–10 user tests/appropriate opt-in metrics | No evidence of5–10 independent user tests; do not substitute automated tests or fabricate participants | Pending |
| P1-09.4 | Production smoke and rollback evidence | Vercel main statuses fail build-rate-limit; latest confirmed productioncc02eb47. No manual deployment retry | Pending |

## Next executable checks

1. Pass this patch's shared gate, focused review and required CI; merge only after results are green.
2. Continue source acceptance gaps; do not treat a merged PR or this document as overall completion.
3. Check release limit independently before one batched deployment; do not blindly retry or change origin.
4. Verify all canonical production routes and upgrade/backup flow on the exact released SHA. Real Safari and human user testing remain separate evidence.
