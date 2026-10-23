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
