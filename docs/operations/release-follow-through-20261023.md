# Release follow-through, 2026-10-23

## Verified failures and repairs awaiting publication

- Frontend main9ad3d38e is READY at https://cinelva.vercel.app. Backend deployment71Ngbqw failed because Vercel materialized the backend configuration into root vercel.json. The guard now accepts that exact committed configuration only inside a Vercel backend build. Arbitrary dirty files/config changes still fail closed; source CI proof remains mandatory.
- Neon project cinema-days exhausted its free monthly egress: read-only SELECT returned HTTP402, project usage5,541,204,690bytes. Reset2026-11-01T00:00:00Z (09:00JST). No restart, migration, credential retrieval, paid upgrade or quota evasion performed. [Neon transfer policy](https://neon.com/docs/introduction/network-transfer).
- Five read APIs now return reviewed repository snapshots after a bounded DB failure, retain original source timestamps and expose static_snapshot/unavailable metadata. Health remains503. This does not restore DB writes or make stale data fresh. The compiled-backend smoke covers all five routes with a deliberately unreachable DB.
- Daily refresh previously failed on nine new untranslated director profiles, before a separate quota-related sync failure. Defer unlocalized new director profiles, retaining movie IDs and warning in logs; retain existing profiles. Publish only quality/proof-validated snapshots before DB sync; sync still fails visibly while quota remains exhausted.
- Movie1591961 has no TMDB poster. Its existing API returns a same-work backdrop; movies/streaming snapshots now explicitly identify that artwork as a backdrop. No invented poster or third-party search image.

## Artwork evidence

The updated asset inventory hashes all current assets. Nine files exactly match generation archive PNG bytes with model_generated:true metadata. Source filenames and hashes are recorded without private file IDs. Award icons visually correspond to a generated gallery, but the crop/rescale chain has not been verified; it is not counted as an exact match. Remaining sprites, derivatives and original images still require provenance evidence. Existing logo, palette and artwork are preserved.

TMDB credits already contain its logo and required notice. Its [FAQ](https://developer.themoviedb.org/docs/faq) permits attributed noncommercial API use; it does not establish ownership of every image. Pexels attribution alone does not prove every current sprite derives from the cited photograph. No blanket legal clearance is asserted.

## Physical Safari test procedure

Use a physical iPhone with Safari, record model/iOS/Safari version, test date, origin, source SHA and light/dark setting. Back up existing records before testing; use a disposable profile for destructive restore checks. Record pass/fail, expected/actual result and screenshot reference for each journey:

1. Open calendar at narrow portrait width; verify horizontal rails scroll internally and page does not overflow.
2. Search both スターウォーズ and スター・ウォーズ; open the same film and return.
3. Create a review dated today with score0.1, save, edit and reload; verify record and date persistence.
4. Clear a review score and confirm unrated semantics; preserve other fields.
5. Bookmark/unbookmark, reload, and navigate discovery→detail→record→summary.
6. Open festival/outdoor detail cards and director/award lists in both themes; verify readable controls and touch/scroll.
7. Export backup, restore it in the disposable profile and compare record count/values.
8. Exercise loading, empty, offline/error states; confirm source freshness and fallback labels remain truthful.

Result: **not_run**. CI WebKit does not satisfy this physical-device gate.

## Independent participant test kit

Recruit5–10 independent participants after explicit recipient authorization; no invitations were sent. Use anonymous IDsP01–P10, avoid names/emails and viewing histories. Ask each to find a film, identify its source/date, save a review, bookmark, locate the record in the calendar, interpret a summary, and export a backup. Let them attempt each task without coaching; record completion, hesitation, errors and severity. Collect voluntary comments only; no new analytics/tracker is installed.

For each participant record: ID, consent yes/no, device/browser, date, source SHA, per-task pass/fail/abandoned, issue description, severity, and retest outcome. AllP01–P10 are **not_run**; no independent-user evidence exists yet. Fix confirmed critical issues and retest before closing the gate.

## Remaining external evidence

Physical Safari results,5–10 independent participant results and missing asset origin/permission chains remain open. Quota prevents real DB restoration until the free reset. Deployment and CI must be verified after integration; local tests alone do not close publication gates.

## CI isolation correction

Final-head completeness measurement exposed real backend requests escaping the scored-mobile fixture. The existing helper intercepted movie search only; calendar,TV and theater-directory reached the quota-suspended production DB and produced WebKit CORS page errors. One bounded unchanged-head rerun reproduced the failure. The fixture now serves all five reviewed snapshot APIs with CORS, returns503 for unconfigured APIs and leaves pageerror/overflow/scoring assertions unchanged. Real canonical API verification remains a separate required post-merge action. A red→green regression covers the request boundary and snapshot payloads; fresh source/final CI proof is required.

## Preview runtime and redirect readiness evidence

Vercel preview736ff47a returned200/static_snapshot/database unavailable for all five read APIs (calendar1027,TV16, search1, Tokyo directory14,Lemino releases2); health remained503. Source timestamps and1591961 backdrop marker survived actual platform bundling. The backdrop image HEAD returned200,image/jpeg,65569bytes. This is preview evidence; production verification still pending.

The repaired scored-mobile suite passed on source1eb1. Its frontend audit then reproduced a separate WebKit first-page readiness race at root agent.html/375px/light: blank screenshot, no page errors/local failures, timeout waiting main text. The existing exact redirect URL/mode wait covered only the prefixed legacy route; extend it to the root route too before theme/main assertions, retaining all assertions and timeouts.

## Exact-source acceptance

Source45a8762c passed all8 PR workflows, including both-engine route audit after the root redirect wait correction. Performance first measured1038ms for1000 records at390px against the unchanged1000ms budget. One bounded same-head remeasurement passed741.86ms at390px and743.13ms at1280px; readiness1621.92/1654.81ms, CLS.04237/.01516, no errors. Application and performance-test source were unchanged. Preserve both observations; this is synthetic CI evidence, not a physical-device performance guarantee. Receipt/final CI and production remain pending.

## Production follow-through after479

Merged2493c6ed after final5a063d86 all8 CI. Frontend is READY at existing aliases and publishes the same-work backdrop. Backend actual build passed exact-source proof, then failed12 frontend configuration assertions because its effective backend configuration sits at root. Reproduced the full failure locally. A narrow source reader now validates exact committed configuration before using the committed frontend source inside an explicitly marked, already-proved backend quality subprocess. Ordinary local/CI configuration edits remain visible; arbitrary root mutations throw; frontend callers discard inherited backend markers. All assertions and the full quality gate remain. Backend CI now reproduces this complete materialized quality state and restores the root file in finally. Both projects track the helper as a publication input. Normal/materialized local gates and focused review passed; fresh source/final proof and full production-check simulation required before next merge.

## Changing-catalog daily publication regression

PR480 initial source bd126fb8 passed all6 workflows, including complete materialized quality smoke. Main daily refresh39939689022 then failed because a test required TMDB1244492/StarWars to remain in the changing catalog. Controlled snapshot fixtures now assert punctuation, deduplication, release identity and ordering independently of production membership; integration search selects an actual current title and the Lemino minimum permits valid additions. No production data or acceptance thresholds changed. Six focused tests and the compiled five-API smoke passed; a temporary snapshot without1244492/StarWars also passed and was restored. Full normal and materialized quality gates passed. New source/final CI, full production-check simulation and actual backend publication remain required.

## Verified production release after480

PR480 source924e0763 passed all6 workflows; receipt-only final52980b8e passed all7. Complete production-checks from backend under VERCEL=1/production with exact committed backend configuration at root passed public CI proof and the entire quality gate; source digest32e74873f80f81dbcfbd88579bfc3f71d6d9171bd787b6a7be9e5259a5dd29e6. Root configuration restored. Merged5cf977ac. Both production projects are READY at unchanged aliases. Canonical backend calendar1027,TV16,current-title search1,Tokyo directory14,Lemino releases2 returned200/static_snapshot/database unavailable; original timestamps retained. Health remains503, correctly reporting Neon outage. Existing approved UI/origins/saved records preserved, previous READY backend retained. This closes the publication-check gate only:28/32 acceptance gates, four external rights/device/user gates remain. Actual DB writes remain unavailable until free quota recovers. One daily-data rerun39939689022 attempt2 is being observed to verify guarded snapshot publication after the changing-catalog test fix.

Post-merge Pages verified publication39952478865 and Pages build/deploy39952479016 succeeded. Main scorecard39952478680 passed both-engine journeys and mobile basics, but1000-record390px performance measured1003.21ms against unchanged1000ms budget; readiness2211.44ms, CLS.04237, no errors. Other1000-record1280px input956.30ms passed. Source/final scorecards passed on identical application/performance code. One bounded same-head remeasurement was requested; preserve the original result and do not relax thresholds.

The single same-head remeasurement passed4/4:1000-record390px input974.70ms,ready2112.34ms;1280px input969.71ms,ready2134.61ms; CLS.04237/.01516, no errors. Original1003.21ms failure remains above. No application, performance code or budget changed. This synthetic variation does not establish physical-device performance.

## Daily publication verified; latest data deployment deferred

Daily refresh39939689022 attempt2 passed complete quality and exact-source proof, then pushed12454582/13a9e63e to main:1030 movies generated2026-10-23T12:21:40.307684+00:00; no missing Japanese director names or normalization failures. All backdrop identity/type/source metadata survived. DB sync subsequently failedP1001; no DB restoration is claimed.

Vercel frontend status on13a9e63e explicitly reports Deployment rate limited — retry in24hours. Backend deployment was canceled by Ignored Build Step: its new bundled movies/TV/theaters-master snapshots were missing from the backend input list. A realGit regression failed for each import. Add exactly those3 paths;17 fixture tests and fullquality pass, including root/backend working directories and a missed publication followed by docs. Availability/UI-only changes continue to skip backend. New source/final proof is required before merge. Do not retry deployment or evade quota. Both canonical projects currently serve READY5cf977ac; backend snapshot1027 and Oct21 source timestamp remain truthful. Latest1030 repository data is not yet canonical Vercel data.
