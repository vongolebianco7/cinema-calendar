# 2026-10-29 requested 28-task audit

Baseline: main `0e94795f6342d8dcb8b390fc51485a03a1958745`. Read AGENTS, work-resume, work-state, #239, current Issue search and 12 open PRs. This is a source/test audit, not fresh production or physical-iPhone acceptance. `要確認` explicitly includes implemented-but-not-fully-accepted behavior; do not rebuild it or call it complete.

| # | Request | Classification | Evidence / remaining acceptance / owner |
|---|---|---|---|
|1|ポスター欠落|要確認|poster-index, poster-retry-browser, boxoffice-poster-browser exist; source quality gate passes. Run current live missing-image sample and confirm fallback. #242|
|2|レビューUI共通化|要確認|cinelva-quick-rate.js and shared card tests present; light review contrast reported in #542, overlaps PR539. Audit every entry.|
|3|作品・ランキング・映画賞重複|要確認|movie-identity, calendar-dedupe, boxoffice-ties, award_identity tests pass locally; production catalog cross-screen audit outstanding. #242/#244|
|4|タブ切替の初期化|不具合あり|#542 reports discovery detail close losing list/filters/scroll; My page separately has sessionStorage tab restoration. PR539 search.html changes overlap. Preserve both navigation contexts.|
|5|監督数・短編・同名統合|不具合あり|director enrichment/render tests exist; open PR543 movie-only filmographies and PR526 short-film work overlap. PR544 fixes duplicate declaration in PR539; reconcile before new patch.|
|6|TMDB二重表示|要確認|quick-rate and shared card tests pass; full live per-route rating audit required. #242|
|7|カード高さ|要確認|390px layout/readiness contracts exist; screenshots on watchlist/awards and long titles still needed. #243|
|8|映画祭・イベント不足|要確認|PR541 merged; events.html and official feed refresh tests exist. Confirm licensed feed coverage, freshness and live combined navigation. #244|
|9|作品詳細ページ|要確認|search.html detail and calendar detail context/fallback implemented; independent URL and return-flow acceptance required. #542|
|10|レビュー仕様統一|不具合あり|Shared modal implemented; #542 light-theme issue, PR539 includes modal changes. Verify today's date, venue, spoiler, save-only-current-modal and preserved records.|
|11|映画カレンダー整備|要確認|Chronology/API identity/import/month-week tests pass; TV/showtime source gaps remain. #244|
|12|映画賞マトリクス|要確認|Existing My awards implementation and identity tests; check six awards, decades, film counts and watched outlines on current production. #239|
|13|監督コレクション・メダル|要確認|Existing director rendering and insights; unresolved filmography work as #5, dashboard requests #542/PR539. Audit 3/5/10/Complete against feature-only IDs.|
|14|My統計|要確認|cinelva-insights.js, shared record tests; PR539/544 dashboard changes pending. Verify numeric breakdown and drilldowns with imported IDs. #239|
|15|年間鑑賞カレンダー|要確認|annual-calendar tests pass; current accepted semantics/4x3 layout need live review. Historical acceptance docs contain superseded rules; do not restore them blindly.|
|16|見たい映画|要確認|my-cinelva/watchlist.html and tab/shared bookmark tests exist; production three-column/height/unbookmark validation required.|
|17|探す|不具合あり|discover.html exists; #542 director constraint relevance and detail return defects; PR543 series-title searches. Reconcile existing changes.|
|18|初期表示|要確認|Old score permits 5000ms. Requested 2000ms not established; added separate diagnostic. #239 P1-08|
|19|タブ0.3秒|要確認|Old score combines tab + typing into one metric. Separate tab measurement added. #239 P1-08|
|20|画像最適化|要確認|Lazy loading/poster retry/index present; real network bytes, decode/priority/LCP and iPhone testing outstanding.|
|21|スクロール60fps|要確認|Added rAF cadence diagnostic on full 1000-record list; not actual GPU/display FPS. Browser binaries unavailable locally; physical device trace required.|
|22|API・キャッシュ|要確認|Existing API caching and release-date tests; request counts/hit ratios/rate limits under real search not measured in this run.|
|23|My集計|要確認|Insights tests and existing 0/1000-record score harness; operation-specific baseline pending.|
|24|ランキング・監督・映画賞取得|要確認|Static catalogs/feature index and deferred data exist; category-specific fetch/parse/cache timing still unmeasured.|
|25|上映中|要確認|now_playing.json, API/tests and shared browser controls exist; current source snapshot and live freshness acceptance still required. #244|
|26|ブックマーク公開・配信通知|未実装|No release/streaming notification pipeline found in backend/js; local status notify() is only a UI message. Design permission/opt-in and free delivery limits before implementing. #239|
|27|配信自動更新|要確認|Existing update tests, source registry and #244. PR514 explicitly blocks all-catalog claims without licensed source; no scraping or paid catalog workaround.|
|28|iPhone回帰|要確認|Mobile CI and browser suites exist; no attached physical iPhone. #542 is current actual-user regression input. CI WebKit must not be labeled device acceptance.|

No item is marked 完了済み solely from tests or an old checkpoint. Existing owning issues #239/#242/#243/#244/#542 are reused instead of creating 28 duplicate issues.

## Baseline validation and hosting

- `python scripts/quality_gate.py`: PASS on baseline. Node primary suite 391/391; separate calendar dedupe 6/6; remaining invoked Python/contracts/compliance checks passed.
- Existing PR539 head `189fd365`: check-runs include failing deterministic, build, frontend, mobile and completeness checks. It is not merge-ready. PR544 is an existing repair branch, not yet accepted here.
- Vercel project cinema-calendar uses static build (`node scripts/build-static.cjs`), public output, main-only deploy, prefixed route redirects. Existing project and origin retained.
- Vercel production API latest READY: `201b0295b96abf967e5b2e5c157eed86323d6413`, deployment `dpl_6BXVRFoW2h7s5smb9RvAEysgg5zP` (PR541). Current source snapshot is newer. No release from this work; no quota reset assumption, deploy retries or plan changes.

## Performance work and limitations

The historical scorecard allows ready<=5000ms and combined interaction<=1000ms, so it cannot prove the new targets. Added `assessRequestedPerformance` with six independent targets, failing for invalid values and reporting missing evidence as `unmeasured`. Two target tests observed RED before implementation. Independent review found that rAF cadence could incorrectly pass rendered scroll FPS; a new failing regression now prevents that assignment. Cadence is diagnostic-only and scroll_fps remains unmeasured. Focused tests: 6/6 GREEN.

Review minor limitations retained: initial timing includes driver/IPC delay and may overestimate readiness; dirty-worktree runs record HEAD but not dirty status. Compare clean committed trees on the same CI environment; do not use this harness for fine-grained initial timing conclusions until that instrumentation is refined.

Diagnostic command: `node tests/cinelva-requested-performance-browser.cjs`; repeat with `CINELVA_BROWSER=webkit`. Existing frontend CI now uploads `requested-performance` artifact with source SHA, browser version, viewport, dataset, timings, errors and assessment. External requests are blocked; records are synthetic in isolated browser contexts. No real records are read or written.

Local browser attempt failed before navigation: no installed Chromium executable. Browser download returned a truncated/non-ZIP payload; install was interrupted rather than endlessly retried. No timing values or speedup are claimed. Requested initial/tab/cache/review/search targets remain UNMEASURED. Record filtering is not global TMDB search; repeat-tab timing is not all cached screens. Empty-record review/scroll remain unmeasured. The diagnostic preserves old scoring and reports target failures separately; strict mode rejects every unmeasured/missed target.

## Next actions

1. Read current PR539/543/544 diffs and latest checks, reconcile their dependencies; do not merge failing source. Investigate earliest deterministic failure, then frontend regression evidence, maximum three attempts per persistent blocker.
2. Run new diagnostic in CI; inspect artifact and repair any harness failure before using it for baseline comparisons. Compare unchanged harness on before/after code for every optimization.
3. Continue P0 with #542 detail return and light review evidence after reconciling PR539; preserve approved UI and data keys.
4. Audit remaining source coverage via approved APIs/RSS only; record unsupported feeds explicitly.
5. Actual iPhone and production acceptance remain separate. No approval is currently requested; destructive migration, authentication or major production change remains outside this patch.
