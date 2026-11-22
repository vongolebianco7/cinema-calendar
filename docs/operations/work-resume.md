Warning: truncated output (original token count: 29921)
Total output lines: 674

# CINELVA Work restart guide

Use this guide whenever a Work session ends, loses context, or reaches a usage limit. GitHub issue [#239](https://github.com/vongolebianco7/cinema-calendar/issues/239) is the single progress hub; this guide and `work-state.json` carry the durable checkpoint.

## Current live checkpoint — 2026-11-17 22:45 JST

- Live main: `f53d9e9fdce36a68eeb9a21127f558b6139a1261`. Issue #593 remains closed and public production boxoffice JSON is HTTP 200 with 1,908 rows and zero missing posters. Issue #244 remains open.
- Existing PR #873 was rebuilt on live main without a duplicate PR. Tested code head `2f0fa46a564d7a8d36413579396cc0cfdbd16954` changes only `streaming.html` and its browser regression: matching official TMDB watch URLs render a confirmation link; a different movie ID is rejected.
- Exact code-head CI finished **33/33 successful**, zero failed/pending. Executable digest: `7e74754055752272f4d8170247378fa447d9c605d60b71edabf48d3253246310`. The production proof receipt now points to that tested code source.
- Current production remains READY on `dpl_J8t4ixBFpVP8x8swjW8nDxg6T4vW` / `f53d9e9...`; PR #873 is not live yet. Public streaming JSON is HTTP 200 with 464 rows and zero missing poster URLs.
- Next: require exact-head CI on the proof/docs-only final PR tip; if green, merge once, wait for the ordinary automatic production release, and verify the live source link at desktop/mobile widths. Do not manually dispatch/deploy or retry Neon. Keep #244 open.

## Resume sequence

1. Read issue #239, this guide, and `docs/operations/work-state.json`.
2. Fetch current `main`, all relevant open PRs/issues, GitHub Actions checks, and the latest production deployment. The live GitHub state wins if it differs from the checkpoint.
3. Compare the recorded base SHA, branch, PR, tests, and deployment state. Reclassify unfinished or unverified work before continuing. Do not duplicate a PR or treat a preview as production.
   Historical acceptance audits contain superseded decisions. In particular, do not restore the old blank new-review date, monthly five-film Gold, inline list gauges or Kinema panels. Consult the 2026-10-21 supersession notice in `acceptance-audit-20261018.md` and the latest user instructions before changing behavior.
4. Follow the highest-priority ready task in #239. Make a small coherent branch change, run deterministic checks locally, then rely on GitHub Actions for repeatable browser and regression checks. When one task passes, immediately select and start the next READY task in the same work run; do not stop at a minor success or wait for the next scheduled run. Stop only when all currently READY tasks are complete or a genuine external blocker prevents further independent work.
5. Update the JSON checkpoint and add a short progress comment to #239 after each major task and at least every 30–60 minutes. Make a concise overall assessment there at least every two hours.
6. Before stopping, record the exact branch/PR/SHA, check URLs and outcomes, blockers, uncompleted acceptance criteria, deployment state, and the next concrete action/command.

## Vercel Hobby while deployments are limited

- Continue source review, implementation, unit/integration tests, static serving, and PR checks while Vercel is unavailable. Do not loop deployment retries or create an alternate account/paid plan to evade a limit.
- Vercel's published Hobby limits include at most 100 deployments in a rolling 24-hour period. The plan is for personal, non-commercial use; when a Hobby quota is exceeded, the affected feature is paused until its reset. Deployment storage is 10 GB; retention changes can remove older previews. See [Hobby plan](https://vercel.com/docs/plans/hobby), [platform limits](https://vercel.com/docs/limits), and [Hobby deployment retention](https://vercel.com/changelog/hobby-projects-now-retain-fewer-deployments-to-free-up-storage).
- Treat the user's reported restriction through the following day's 07:00 JST as a reported estimate, not a live-verified reset. Confirm deployment status and quota in the Vercel dashboard/API before one planned release attempt. Project-specific usage was not available to this run.
- GitHub Actions and isolated Cloudflare Pages PR previews can validate changes without relying on a Vercel production deployment. A PR/preview is not proof of production release. Preserve existing origins because browser-local viewing data is origin-scoped.
- Batch verified changes. Release only the tested SHA after required checks pass and the restriction has cleared. If deployment fails, stop and record the exact failure; do not retry without a new diagnosis.

## Checkpoint cadence and status vocabulary

Write to `work-state.json` and issue #239 every 30–60 minutes or at a meaningful milestone. Use only these task states: `planned`, `in_progress`, `pr_created`, `ci_passed`, `merged`, `deployment_pending`, `production_verified`, `blocked`. A passing local run does not mean CI passed; a merged SHA does not mean production is verified.

The status JSON is validated by `python scripts/check_work_state.py` and the shared quality gate. Never place secrets, tokens, personal data, or private bypass URLs in it.

## 2026-11-06 production publication proof recovery

The merged #651/#652 executable tree differs from the older `quality/production-proof.json` receipt. The verified legacy Pages build correctly refuses to publish it. Do **not** bypass `verify-production-release.cjs` or blindly retry failed publication. Run the required pull-request workflows against the **combined current executable tree**, then set the receipt `head_sha` to the exact successful PR source commit (receipt changes are excluded from the executable digest). Re-run publication and verify the actual Pages demo URL. Vercel production is a separate release gate; the old READY deployment does not prove current-main publication.

PR #653 is based on pre-merge main and currently has a merge conflict in `docs/operations/work-state.json`; reconcile with current state, preserve its data-coverage regression tests, and re-run exact-head checks before merging.

## Latest-checkpoint precedence and independent Pages deployment diagnosis

At the beginning of each run, read the live `main` SHA, open PRs/issues, exact-head Actions and Vercel alias before using `work-state.json`. Older nested checkpoint fields may describe already-merged PRs or a stale production SHA: **never** use them as the current queue. The newest UTC-dated checkpoint is historical evidence, not a substitute for live verification. Record any discrepancy in issue #239, then continue with a concrete implementation or test task.

GitHub's automatic `pages build and deployment` workflow and the repository's `Publish verified legacy Pages` workflow are separate. A successful verified publication does not erase a failure in the automatic Pages deploy. If the latter fails at `Deploy to GitHub Pages` after its build succeeds, inspect the specific deployment job, Pages environment and concurrency/permissions before changing source or retrying; do not treat this as a source build failure or bypass production proof. Confirm the canonical public URL after each successful deployment and distinguish it from Vercel's independent production alias.


## 2026-11-09 streaming premiere checkpoint

- Latest GitHub `main`: `e8e292251c8b91c4722eaf5805685562653ba233`. PR #757 and PR #756 are merged; PR #759 is open at source `142f42645446d003dae9c4caa2ed17f171859016`.
- All nine listed Actions succeeded on PR #759 exact head 142f42645446d003dae9c4caa2ed17f171859016, including Chromium/WebKit frontend journeys and visual checks, mobile layout, Python contract suite, backend build, quality gate and completeness scorecard. One unrelated Ocean-route WebKit timeout was resolved by rerunning only failed jobs. The dedicated calendar browser journey asserts Sirat appears on 11/05, uses the canonical TMDB poster, shows 115 minutes, and links to the Netflix title page.
- Local focused tests (33 Python), `scripts/quality_gate.py`, `scripts/check_release_data.py`, `scripts/check_streaming_coverage.py`, work-state validation and `git diff --check` passed. Local Playwright could not launch because its Chromium binary is not installed; CI browser checks passed.
- Sirat is manually registered from the Netflix Japan 10/29 announcement: TMDB 1151272, film year 2025, runtime 115 minutes, poster retained, Netflix title URL. Netflix's official Japan account announced the 11/5 date; the title page confirms the 2025 title. The current public `streaming.json` generated on 11/08 still lacks Sirat.
- November coverage: 181 cited official-announcement subset rows, 181 registered; 154 matched TMDB identities/posters, 27 poster/identity gaps. This is not an exhaustive census. All 12 premiere-discovery flags are false and the approved feed registry is empty; the daily job refreshes reviewed supplements, not new discoveries. Do not claim automatic discovery is active.
- PR #754 was already merged. PR #756 was merged after all exact-head CI passed. PR #759 has not yet merged; rebase was completed after #756. The initial frontend check found a stale expected poster count (4 vs 6 after metadata restoration); the test now allows the increased count while preserving its minimum, and passed on 142f426. An unrelated existing Ocean-route WebKit test timed out on the first run and passed when only failed jobs were rerun.
- Vercel canonical alias answers HTTP 200 but serves old source `f6cd6c6`; live `streaming.json` generated 2026-11-08T12:10:28Z lacks Sirat. Vercel reported its Hobby daily deployment cap exceeded (>100 deployments); avoid redundant retries until the quota reset. The receipt/checkpoint is being updated to tested source 142f426 in the pending PR. Production acceptance remains pending.
- Next: confirm final CI on the receipt/checkpoint commit; merge PR #759 if all required checks remain green; verify Vercel READY for the merged source and fetch public `data/streaming.json` to confirm Sirat. #244 and #593 remain open because provider discovery, exhaustive coverage, 27 poster gaps, and physical-device acceptance are not complete.


## 2026-11-09 streaming refresh follow-up

- Current `main`: `03a58494a5b9e60bf603e6599d1e4f49634f6f61`; #759 and #760 are merged. PR #761 is rebased on current main at `949d554e5240900e3ad3abb5bf6f783d066376c4`. It fetches full history, rebases before a bounded three-attempt fast-forward push, aborts on conflicts, and includes its own workflow path in the push trigger so merging launches a verification refresh.
- Local `python -m unittest tests.test_streaming_poster_enrichment -q` passed 17 tests. The pre-rebase head passed all eight listed Actions; exact-head checks for 949d554 are pending.
- Current availability discovery is automated through TMDB Watch Providers / JustWatch, but it observes availability rather than premiere dates. `data/availability.json` contains 1,602 records generated 2026-11-07T21:51:37Z; the 2026-11-09 source audit counted 971 fresh and 631 stale observations within the seven-day window. Snapshot subscription counts: Netflix 108, Prime Video 301, U-NEXT 279, Disney+ 45, Hulu 164, FOD 88, Apple TV+ 6. This is not a complete service catalogue.
- November premiere report: 181 cited official-announcement subset titles and 181 exact catalog matches; 154 TMDB identity/poster matches; 27 missing posters/identities. All 12 premiere discovery flags are false and no approved feed is configured; the scheduled premiere job refreshes reviewed supplements only.
- Vercel Hobby is blocked by HTTP 402 `api-deployments-free-per-day` (>100 deployments; retry-after 24 hours from 2026-11-09T01:37:22Z). Do not retry before 2026-11-10T01:37:22Z. Public production acceptance remains pending; physical iPhone Safari is not checked.
- Sirat is registered for Netflix on 2026-11-05, TMDB 1151272, film year 2025, runtime 115 minutes, with canonical poster and Netflix link. Netflix Japan's 2026-10-29 official account announcement supplies the date. The current Netflix title page confirms title/year but says unavailable in-country; JustWatch observed it on Netflix Japan on 2026-11-07. Keep date evidence distinct from live availability.
- Next: finish exact-head CI; refresh proof/checkpoint and rerun CI; merge #761 only after checks pass; verify the post-merge refresh; then attempt one Vercel production release only after quota reset. Keep #244/#593 open.


## 2026-11-09 post-merge checkpoint (02:52 UTC)

- Live GitHub main advanced to `9377890a5117cc81cfd6c0dfccd0a8b6fa1173d7` through scheduled data refresh commits after the code/proof merges. No open PRs were returned by the latest GitHub query. Issues #244 and #593 remain open.
- PR #761 merged as `8f00f741`; its post-merge official supplement refresh run `42549613739` succeeded. The logs report zero verified official RSS endpoints and zero feed candidates. This verifies job execution and race-safe saving only; it does not discover new premieres.
- PR #762 merged as `8b067dc`, restoring 18 verified box-office poster/TMDB mappings. Its exact head passed 22/22 checks. This is a partial #593 improvement, not a global fix. PR #763 merged as `3c764a1`; verified legacy Pages build/deploy and Cloudflare Pages succeeded. Vercel’s check failed on the Hobby `build-rate-limit` after HTTP 402 `api-deployments-free-per-day`; do not retry before `2026-11-10T01:37:22Z`.
- Sirat is registered for Netflix Japan from 2026-11-05 with TMDB 1151272, 2025, 115 minutes, the verified poster and Netflix title URL. Its official announcement evidence and Chromium/WebKit calendar acceptance are in PR #759. Public Vercel reflection remains unverified.
- The November manual review report has 181 cited titles and 181 exact catalog matches; 154 have TMDB identity/poster matches and 27 lack a verified match/poster (85.08%/14.92%). It is explicitly non-exhaustive. All 12 service premiere flags are false; no official feed is enabled. TMDB Watch Providers / JustWatch reports current availability, not premiere dates or full catalogs.
- Next: after the quota reset, check current main’s source-bound proof and Vercel quota once; deploy only if available, then verify the canonical live calendar/data/detail. Keep #244/#593 open and record any still-blocked provider coverage. Physical iPhone Safari is not verified.


### Reconciliation note (live data recount, 2026-11-09)

- Main `data/streaming.json` was directly parsed: `generated_at=2026-11-09T00:13:20.801231Z`, 182 November rows. Counts: Netflix 17, Prime Video 90, U-NEXT 18, Hulu 34, Disney+ 5, FOD 15, ABEMA 1, Lemino 1, Apple TV+ 1.
- 158/182 November rows currently have both a TMDB ID and poster field (24 do not; 86.81% present). This dataset recount differs from the separate manual-review report (154/181 matched, 27 missing). Keep both scopes visible and reconcile before reporting a definitive coverage rate. The report’s 181 rows are cited official subset, not the full November rows.
- Sirat is present in the current source JSON as Netflix, 2026-11-05, TMDB 1151272, poster, 2025, runtime 115; this is source-tree confirmation only. Vercel production still awaits quota reset and public verification.

### Per-service live metadata count (registered snapshot)

Counts below are from the 182 current `data/streaming.json` rows for November. “TMDB ID” and “poster” count populated fields only; they do not prove each identity/image was externally revalidated in this recount. Official announced titles may exceed these registered rows, so this is not a provider-completeness denominator.

| Service | Rows | TMDB ID | Poster |
|---|---:|---:|---:|
| Netflix | 17 | 14 | 14 |
| Prime Video | 90 | 87 | 87 |
| U-NEXT | 18 | 16 | 16 |
| Hulu | 34 | 24 | 24 |
| Disney+ | 5 | 5 | 5 |
| FOD | 15 | 9 | 9 |
| Apple TV+ | 1 | 1 | 1 |
| Lemino | 1 | 1 | 1 |
| ABEMA | 1 | 1 | 1 |

The coverage report's official-subset counts and direct current-data field counts measure different things. Hulu has 33 cited official rows vs 34 catalog rows; retain this as one catalog row outside the cited subset, with source/date review still needed before treating it as verified.


## 2026-11-09 canonical production acceptance check

- PR #764 (`f2f467d4278725046e3230f16d1440a081845d3e`) merged safely as main `7be351c7b50e1ba57bdb764023bdedb694c09e7a`. Python contracts, backend build, smoke, visual QA, mobile layout, completeness, autonomous quality and the targeted reported-regression Chromium/WebKit browser job passed. Vercel preview failed only because the Hobby daily deployment cap returned HTTP 402; Cloudflare Pages preview succeeded.
- Opened the canonical Vercel production JSON at `https://cinelva.vercel.app/data/streaming.json` in Chromium. It reports `generated_at=2026-11-08T12:10:28.725307+00:00` and does not contain Sirat. The November calendar also showed a different Netflix title on Nov 5. This is a direct production acceptance failure; source/main data and CI calendar tests do include Sirat, but production is stale.
- Vercel quota remains the blocker. Do not retry until the reported reset. At reset, confirm quota and current source-bound proof once, make one deployment attempt, and verify the canonical calendar, data JSON, and Netflix detail link. Physical iPhone Safari remains unverified.
- Automated premiere discovery is still inactive: 12 service flags are false and no official premiere feed is enabled. Existing schedules refresh reviewed supplements; availability tracking is not premiere discovery. #244 and #593 remain open. PR #765 exact-head tests passed, but its old branch became non-mergeable after #764 advanced main; reconcile onto current main, then rerun exact-head checks before merging the checkpoint.


## 2026-11-09 production proof and streaming regression checkpoint

- PR #765 was reconciled onto current main and merged as `43b7bf3`; it records that production JSON lacked Sirat. PR #766 then added a catalog regression contract for Netflix / 2026-11-05 / TMDB 1151272 / poster and Netflix title link, merged as `c24e982`.
- PR #766 exact head `9689929ec6cec9b4f379193efb1706d05a507ea4` passed all seven PR checks. Its Git tree SHA `c61ef905b34a9e5d968dc4b49d8192e939ccc723` is identical to current main `c24e982` tree. Required production proof workflows on that exact PR head passed: Autonomous quality, smoke, Validate frontend (Chromium/WebKit), and reproducible backend build.
- The main push's verified legacy Pages publication run `42567285133` failed safely because `quality/production-proof.json` still pointed at older source `bd6ac8b869b738c62ac5c1ff08077a2d87458ca0`. Refreshing that receipt to the exact tested PR #766 head makes the proof source-bound while preserving the executable tree; no check is bypassed.
- Vercel remains separately blocked by the Hobby daily deployment limit. The public canonical JSON generated 2026-11-08 still lacks Sirat even though main `data/streaming.json` includes the 11/05 entry. Do not retry Vercel before the quota reset at 2026-11-10 01:37:22 UTC; then verify quota once and make one planned release attempt.
- The scheduled reviewed-supplement refresh runs, but its latest successful run found zero verified official feed candidates. Automated premiere discovery remains disabled for all registered services. Keep #244 and #593 open; physical iPhone Safari remains unverified.


## 2026-11-09 #244 atomic refresh regression and publication proof

- PR #771 merged as `a0d7ac7e5a8677c89bf4819058b3e7b48af2e96a`. Its exact head `fe07e2aaed2a62601e88428ec06cf8f82652412c` passed all seven checks, including the required production workflows and the full Python contract suite. The test proves that a later invalid monthly source cannot partially replace an existing last-known-good snapshot; once corrected, both months publish together.
- The source tree at PR #771 head is identical to merged main. The earlier Pages publication failure on main `273f65ee` was a correctly enforced stale proof: #770 changed executable streaming validation after the receipt was issued. It was not a quota failure.
- Refreshing `quality/production-proof.json` on the exact tested #771 head and recording this checkpoint is proposed in PR #772. Do not bypass the proof gate. Verify the Pages publication workflow after merge.
- Vercel production remains stale and over the Hobby deployment cap. Do not retry before the recorded reset; verify canonical JSON and Sirât calendar/link after one planned deployment attempt. Browser acceptance remains pending.
- Automated premiere discovery remains disabled for all 12 registered services; #244 and #593 stay open. Current coverage counts are only a cited official-announcement subset, not full service catalogs.


## Latest checkpoint — 2026-11-09 15:27 UTC

- Current main: `8bde86dc8ab7dd0f64de0e4206f9e14476d6b5b0` (PR #779 merged).
- PR #779 makes the three streaming poster identities durable in the November source supplement. Local measurement improved the 457-row streaming catalog from 31 posterless rows (6.8%) to 28 (6.1%); this is a dataset count, not proof of all-screen or public image success.
- Exact-head CI passed all eight workflows on `38952f07b0b6618304b7831b94a36f8f404c41bd`; the Vercel backend check still fails because of the Hobby deployment-per-day limit.
- Public production is still on SHA `391da7d6aec71ac97dd18235379c97f286fd4be8`. Recheck live quota at/after `2026-11-10T01:37:22Z` before one free-tier deploy attempt.
- #244 remains open: 12 registered providers, 0 approved premiere feeds/automated discovery; 11 services have cited curated records (457 rows), DMM TV has none. Sirât is in the durable source with Netflix 2026-11-05, TMDB 1151272, and poster; production acceptance is pending.
- #593 remains open: all-screen image HTTP/error rates and public acceptance have not been measured. Continue full screen-by-screen validation after deployment; do not close issues early.
- Next: verify quota, deploy once if allowed, then test production on desktop Chromium/WebKit and 390px layout; retain physical iPhone Safari as a separate acceptance item.


## 2026-11-11 P0 resume checkpoint

- Latest main: `f83530426aebd27baf27093b9964af28c29a04e3`. PR #796 was squash merged with empty-poster source handling, production acceptance for images without a src, strict official TMDB alternative-title matching, and the Neon direct-connection DB sync fix from #795. PR #795 was closed as included.
- PR #796 head `94970b7b2fb0e6f84ff133e910922a75a6b2ea77` passed all four required workflows, the recorded additional checks, local focused tests 18/18, and the full quality gate (584 Node tests). Vercel preview was successful.
- The merge-triggered Vercel production build `dpl_EzfkQh2yGCkpoqpfhuYencddbBqW` stopped at the source-bound publication gate. Current main executable digest is `02898cf0810a7ca7022fab1741256884f0f3e61632386d6bde12b7244b9469fe`; the receipt still references `c0151084f048c0ae7911bcf13a3156595dd712ba` and verifies a different digest. This is not a quota failure; do not weaken or bypass the gate.
- Previous production counts, before #796 publication: boxoffice 1,383/1,647 (264 missing; +499 from 884 baseline), streaming 430/457 (27 missing), TV 20/23 (3 missing), movies 1,356/1,383 (27 missing), now-playing 88/89 (1 missing), theatrical 926/926, directors 9,980/10,673 (693 missing). Chromium showed zero HTTP failures for images that had URLs, but 3 ranking cards used empty image sources. These are not post-merge counts.
- #593 and #244 remain open; #244 remains queued behind #593. No new production recovery is counted. Do not rerun official backfill/DB sync until the receipt is repaired and latest main/proof/quota are rechecked.
- Next: verify the combined current-main source with required PR workflows, refresh `quality/production-proof.json` to a successful source SHA that matches the merged executable tree, merge after required checks pass, then verify the merge-triggered frontend/backend production deployments and public counts. Run post-deploy Chromium/WebKit poster acceptance once. Physical iPhone Safari remains a separate unverified acceptance item.


## Latest checkpoint — 2026-11-16 00:16 UTC

- Live main at start: `93bff91f15268d1888af61aa38c209cb32b7650f`; Open PRs: 0. Issues #239, #242, #243, #244, #585, #683 are open. #593 is closed as completed.
- Vercel production is READY on that exact main. Public `/data/boxoffice.json` returned HTTP 200: 1,808 annual rows, 1,808 with posters, 0 missing. Public `/data/streaming.json` returned HTTP 200: 457 rows, generated 2026-11-15T08:42:39.808Z.
- #244 live coverage remains 12 services with automated premiere discovery disabled and 0 approved official RSS/Atom feeds. The daily workflow's content updates can still be verified, but that is not automatic new-title discovery. The latest updater completed its collection/JSON stages and failed only at Neon P1001; do not retry DB sync without a new diagnosis.
- Confirmed a safe official announcement gap: Netflix's 2026 animation slate says the movie `In Waves` releases globally (excluding France) on 2026-12-11. Japan is included. The production streaming JSON and reviewed-announcement file did not contain it.
- Branch `data/netflix-in-waves-premiere-20261116`, data commit `953453a972c07e41c38e57553f951ac2ffbd8fae`: added title/original title `In Waves`, Netflix, 2026-12-11, release_year 2026, and the official Netflix source URL. No TMDB ID or poster is guessed. The existing strict resolver will assign them only for one exact-title, same-year TMDB API result that includes a poster; otherwise it leaves the poster unresolved.
- Exact-head CI, merge, post-merge scheduled official enrichment, production JSON update, and calendar rendering are still pending. #244 remains Open until source coverage, update behavior and actual production acceptance have evidence. User records and backups were not modified.
- Next: finish checkpoint/PR, wait for required exact-head CI, then verify the post-merge `update-movies` run, public streaming row + poster identity, Vercel READY, and the calendar route. Do not dispatch a duplicate updater or retry Neon.

- PR opened: [#867](https://github.com/vongolebianco7/cinema-calendar/pull/867), current checkpoint source `447af7f8a78793110ef32be0485b346de55b2409`; the final CI head will advance when the PR/checkpoint commit completes. Verify checks against the exact final PR head before merge.

- PR #867 also includes Netflix's officially announced `Ray Gunn` film, globally streaming on 2026-12-18. Both films are sourced from the same official Netflix animation-slate article; no IDs/posters are guessed, and exact-head CI restarted on the updated PR head.

## Live continuation checkpoint — 2026-11-16 00:27 UTC

- Main before PR: `93bff91f15268d1888af61aa38c209cb32b7650f`. PR #867 branch `data/netflix-in-waves-premiere-20261116`; branch has been extended with reviewed official announcements and state-file update (commits through `61ea8cec661065578cb49ff96a2ae48e1060f2a0`). Fetch the live PR head before acting; the exact head has advanced and checks must be read for that final SHA.
- #593 is closed/completed. Latest production box-office JSON check before this PR: HTTP 200, 1,808 rows, 1,808 poster-bearing, zero missing. Recheck this before release; reopen/recover #593 first if it regresses.
- #244 batch: four film-only, global Netflix announcements with release dates verified from Netflix newsroom: In Waves (Dec 11), Ray Gunn (Dec 18), Proxies (Dec 11), Secrets (Dec 3), 2026. All were absent from production streaming JSON at the start. Primary sources: https://about.netflix.com/en/news/netflix-previews-its-animation-slate-for-2026-and-beyond ; https://about.netflix.com/en/news/proxies-is-coming-to-netflix-on-december-11 ; https://about.netflix.com/en/news/netflix-unveils-teaser-for-secrets-ravi-bharwanis-first-film-in-eight-years-premiering-december-3 .
- No TMDB IDs/posters are supplied by this edit. Existing `update-movies.yml` push trigger includes `data/streaming_announcements.json`; it uses GitHub secret `TMDB_API_KEY` with the strict exact-title/same-year/unique-result resolver. Merge should start one run; do not manually dispatch while it is queued/running. If a movie is ambiguous or has no poster, retain unresolved status and report it honestly.
- Before the last PR update, exact-head CI on `07482d136a0d8b3fe6528b8a346616543a7bba24`: smoke, backend build, mobile layout, and completeness scorecard passed; frontend, autonomous quality gate, and Chromium/WebKit visual QA were running. Those results do not apply to the new final head. Recheck all required CI against the live head.
- Vercel production main was READY; branch backend preview was ignored by Vercel. Do not force a deploy; the main merge should trigger normal deployment if applicable and production status must be checked after merge.
- Next action: fetch current PR #867 head and its exact-head workflows. Merge only if required checks are all green and no new blocking review; then inspect the single automatic updater run, public streaming JSON (HTTP/date/title/TMDB identity/poster), Vercel production, and calendar rendering. Keep #244 open until coverage/production acceptance evidence is complete. User review/rating/bookmark/watch-history/backups were not touched.

## CI correction checkpoint — 2026-11-16 00:34 UTC

- Exact-head backend build for PR #867 at `3865442d534dad6deda7feda08c236235105a650` failed only because `docs/operations/work-state.json` used top-level status `pr_updated`, outside `scripts/check_work_state.py`'s allowed enum. No data, build, or user-storage test failed. The checkpoint now uses allowed `pr_created`; commit `5211841726625427f7c4addc8d74cff12c81b58c` records the correction and test result.
- This correction changes the branch head. The final exact-head checks must be fetched for the current PR SHA; the previous CI results cannot authorize merge. Next: check the live PR head and all required runs, fix any further concrete failure, then safe merge only when green.
- Production box-office public JSON was rechecked after the PR data-only changes: annual `by_year` rows = 1,808, missing posters = 0; `all_time` rows = 100, missing posters = 0. The earlier apparent count was a counting-script shape mistake (the JSON uses `by_year`, not `annual`); #593 remains closed.


## Live continuation checkpoint — 2026-11-16 00:40 UTC

- Latest main is `93bff91f15268d1888af61aa38c209cb32b7650f`. Open PR #867 is the only open PR in this task; #593 is closed as completed and #244 remains open.
- Production box-office JSON was fetched directly: HTTP 200; `by_year` 1,808/1,808 poster URLs present; `all_time` 100/100 present. #593 stays closed.
- Production streaming JSON before #867: HTTP 200, generated `2026-11-15T08:42:39.808Z`, 457 rows. `In Waves`, `Ray Gunn`, `Proxies`, and `Secrets` are absent.
- PR #867 source head `2bb3efb0dcec67e314b416833835e73ba636b4dc` passed all seven Actions at 00:37 UTC: Autonomous quality gate #43780906056, mobile layout #43780905893, smoke #43780905885, backend build #43780905910, completeness #43780905888, visual QA #43780905940, and frontend Chromium/WebKit #43780905939. This checkpoint-only commit updates branch docs, so fetch the new live head and recheck required Actions before merging.
- Official Netflix announcement sources are listed in PR #867. No TMDB ID/poster is guessed. The existing `update-movies.yml` push trigger covers `data/streaming_announcements.json`; merge should trigger one normal updater. Do not manually dispatch.
- Previous updater run #43773321430 committed the JSON snapshot but failed only at Neon direct sync with P1001. Do not retry Neon. Vercel production remains READY on main SHA `93bff91...`; Hobby usage is not exposed, so do not manually deploy.
- No viewing history, rating, review, bookmark, backup, or Vercel plan setting was changed.
- Next: check exact-head Actions for the updated PR branch; merge #867 only if all required checks pass and no blocking review appears; then inspect the single automatic updater result, public JSON entries/poster IDs, Vercel READY and calendar rendering. Keep #244 open because official premiere-discovery feeds remain unverified/unavailable and a single reviewed intake batch does not satisfy its acceptance criteria.


## 2026-11-16 00:55 UTC — Five official Netflix premieres queued

PR #867 now includes five films verified from Netflix announcements: Steps (2026-11-20), In Waves (2026-12-11, global excluding France), Ray Gunn (2026-12-18), Proxies (2026-12-11), and Secrets (2026-12-03). Steps is from Netflix’s official 2026 animation slate. Before merge, production streaming JSON remains 457 rows and none of the five are present. No TMDB IDs/posters were invented; the normal official resolver may add only a unique same-year film match with a poster.

The exact prior head `e6e3a0d8b088eea46e811660598ac319090375f7` had all seven required Actions pass. Validate frontend’s first attempt timed out at `tests/cinelva-provider-list-browser.cjs:41` while waiting for the offline provider status; its targeted second attempt passed with no code change. The new Steps/checkpoint commit advances the head and requires all seven exact-head checks again.

The existing scheduled updater run `43771219437` processed its data stage but failed at final Neon direct sync with P1001 (`ep-snowy-wave-b4gwato2.c-6.us-east-2.aws.neon.tech:5432`). Do not retry the sync or manually dispatch. After the new head is green and PR #867 is safely merged, let one normal updater run, then verify the public streaming JSON’s five titles, unique TMDB poster identities, Vercel READY, and calendar cards. #593 stays closed only while public box-office poster gaps remain zero; recheck before closing #244.


## 2026-11-16 01:04 UTC — U-NEXT official November title added

After the five Netflix announcements were added, I checked U-NEXT’s official November lineup against the live 457-row streaming snapshot and the reviewed intake. `ミニオンズ＆モンスターズ` was absent from both. U-NEXT’s official lineup says rental starts 2026-11-11 and links to its own title page; Illumination’s official film page confirms the 2026 film identity. Added it as a U-NEXT rental announcement with those sources. No TMDB ID or poster is guessed; the existing importer and unique same-year resolver handle enrichment.

This makes six reviewed candidates on PR #867: Steps, In Waves, Ray Gunn, Proxies, Secrets, and Minions & Monsters. The prior exact head `b07e2df82f2f629470d2b0800ba7a99698295932` passed all seven required Actions. The new data/checkpoint commit needs a fresh seven-check exact-head run. The registry currently has zero approved RSS/Atom feeds and all 12 providers remain editorial-only; this work used official pages as reviewed facts, not automated scraping. After the new head passes, merge safely, let the normal push-triggered update-movies workflow run once, and verify public records/posters/calendar. Do not manually dispatch or retry Neon P1001.


## 2026-11-16 01:15 UTC — Post-merge release gate diagnosis

- PR #867 merged as main `fd48f9c347af3f9234f5c579b500a79d86ef90ea`. It adds six official streaming announcements (five Netflix, one U-NEXT) to the reviewed intake. The six records are not in public data yet.
- Live #593 is closed/completed. Public production boxoffice JSON on the previous READY deployment returned HTTP 200: yearly rows 1,808/1,808 with posters and all-time rows 100/100 with posters. Keep #593 closed unless a new live gap appears.
- Main has one Open #244 and no feature PRs after #867 merged. The public streaming snapshot remains HTTP 200, 457 rows, generated 2026-11-15T08:42:39.808Z; the six newly reviewed titles are absent. The feed registry still has zero approved RSS/Atom feeds; all 12 providers remain editorial/manual review only.
- The merge-triggered updater run 43784784850 failed at its pre-collection exact-source gate, before import, enrichment, snapshot commit, or DB sync. Exact log: receipt head `85e0376894c58f684b6404300e93ae753e3b9e98`, current digest `a7906e3a1c1535fb598fe0130363480ec35f24a2d2db25c8dadfb7d9dd1df658`, receipt-tree digest `191d8991c24e04685ce218c8b23212b39a67753fe8c3026e87a324a66e3e0d65`. No data was imported by that run; no Neon request occurred.
- Vercel production deployment for fd48f9c is ERROR, code BUILD_UTILS_SPAWN_1: `node scripts/build-static.cjs` exited 1 because `verify-production-release.cjs` enforced the same stale receipt mismatch. Previous production deployment on 93bff91 remains READY and serves the old 457-row streaming JSON. Project quota meter is not available; no manual deployment or retry.
- GitHub Pages run 43784785028 also failed the legacy source-proof preflight and skipped deploy. This is a stale proof receipt, not Vercel quota and not a data-provider outage.
- The tested PR #867 source head `7179d04dbe2f66626ffc10ebcdbaca24a161ab86` passed all 7 required workflows / 20 check runs. Its full Git tree hash is the same as merged main `79dd3c914ceafc870ffbb516a0e0a9fcfc792ced`, so the executable trees are identical. A small follow-up PR updates the CI receipt to that already verified source head and records this checkpoint.
- Next: complete the proof/checkpoint PR’s exact-head checks; merge only green. Verify the regular main Vercel deployment and Pages gate. Confirm no Update movie data run is active, then dispatch the existing update-movies workflow exactly once because run 43784784850 failed before collection. Confirm it processes the six reviewed records; do not repeat on failure. Verify public streaming JSON records, unique TMDB identity/posters if resolved, production calendar cards and image loads. Leave #244 open until production data and rendering evidence satisfy its completion criteria. Existing watch records, ratings, reviews, bookmarks, and backups remain untouched.


## Live continuation checkpoint — 2026-11-16 01:40 UTC

- Current main: `0877129eaa1b84fafb01f4d0d99369a35a8ab392`. #593 is closed/completed (2026-11-15 14:53:26Z); latest public production `boxoffice.json` is HTTP 200 with 1,808/1,808 yearly rows and 100/100 all-time rows carrying posters. No regression; #244 remains the next task and is Open again because its production acceptance is still unmet.
- Only open PR: #869, branch `data/revalidate-official-streaming-announcements-20261116`, head `0b24ab006e343b08b4cd9e7af6ee16c71a562e9e`, based on main `0877129eaa1b84fafb01f4d0d99369a35a8ab392`. It changes only the six source-verification descriptions in `data/streaming_announcements.json`; official title/date/source URLs and movie identity fields stay unchanged. PR is mergeable.
- Exact-head checks on #869: smoke, mobile layout, completeness scorecard and reproducible backend build passed; Validate frontend, continuous visual QA and autonomous quality gate were still running at checkpoint time. Re-fetch all checks and require green on the final head before merge.
- Production Vercel is READY: `dpl_F81ij6fXoJut4du6dN8oLgDrxbf9`, commit `0877129eaa1b84fafb01f4d0d99369a35a8ab392`, stable alias `https://cinema-calendar-three.vercel.app`. Main Pages build/deploy run 43786485191 succeeded.
- Public `streaming.json`: HTTP 200, 457 records, generated at `2026-11-15T08:42:39.808Z`. The six verified official announcements are still absent: Steps, In Waves, Ray Gunn, Proxies, Secrets, and Minions & Monsters / ミニオンズ＆モンスターズ. Do not guess TMDB IDs/posters. Official source feed registry currently has zero confirmed RSS/Atom feeds; source-specific official announcements remain manual-review inputs.
- Prior update-movies run 43784784850 failed at the exact-source proof gate before collection; no import, snapshot change, or Neon write occurred. The proof mismatch was resolved by merged #868. No updater is currently active. Next: finish #869 exact-head CI, merge only if all required checks are green, then observe exactly one ordinary push-triggered update-movies run. Do not dispatch manually or retry it. Inspect per-title resolution, public JSON delta, READY production, calendar cards, and image loads. Keep #244 open until the evidence is complete.
- The separate nationwide now-playing refresh run 43786347481 failed at its publish step; obtain only the failed-step summary/log excerpt, record the actual cause, and fix or classify independently without touching the streaming updater. TV broadcast refresh run 43786347491 and Pages deployment run 43786485191 succeeded.
- No user watch records, ratings, reviews, bookmarks, or backups were modified. No paid service, scrape, manual deployment, or quota workaround was used.


## Live checkpoint — 2026-11-16 01:50 UTC

- Current main: `bf502c0e5e474d32f5e15e406f223cc942ca093b`. #593 closed/completed; latest public boxoffice evidence is 1,808/1,808 yearly and 100/100 all-time poster rows. #244 remains Open/reopened.
- Public streaming JSON is still 457 rows (generated 2026-11-15T08:42:39.808Z); the six verified items from official Netflix/U-NEXT announcements remain absent. #869 merge triggered update-movies run 43788084251, but it failed before any collection/write. All import/resolution/JSON/Neon steps were skipped.
- Exact failure: receipt head 7179d04, receipt digest a7906e3a..., current executable-source digest 1bc68022... . The source digest includes `data/streaming_announcements.json`; #869's official provenance text changed that source input. #869's 20 exact-head CI checks all passed, but production proof was stale. Vercel dpl_H232... for bf502 also failed at build with the same verifier refusal; prior production READY at SHA 0877129e remains live. No deployment retry.
- PR #871 adds `quality/production-proof.json` to the existing `update-movies.yml` push-path triggers, so a future source-proof refresh naturally starts the already gated updater without manual dispatch. Current PR source commit: `f29ab8b8e1df1646cd1df57f50a085bc4b5d2b2d`; work-state/resume checkpoints are being added before final exact-head CI.
- To create the new receipt safely: pass exact-head CI for the workflow-path commit, set the receipt head to that commit with its verified source digest, then require a new full exact-head CI on the final PR head. On merge, the receipt path triggers one normal workflow run. No manual dispatch, secret exposure, quota workaround, scrape, or DB retry.
- PR #870's test-only offline mock fix is independent; exact Python suite passed. Wait for all exact-head checks on its current revision before merge.
- No user watch/rating/review/bookmark/backup data changed. No official RSS/Atom provider feed is registered (0 confirmed); we continue only with manually verified official announcements.


## Live checkpoint — 2026-11-16 01:55 UTC

- Main `bf502c0e5e474d32f5e15e406f223cc942ca093b`; #593 closed/completed with latest public boxoffice 1,808/1,808 yearly plus 100/100 all-time poster rows. #244 is open/reopened and is not complete.
- #869 merged with all 20 exact-head checks. Its ordinary updater run 43788084251 stopped at the pre-collection exact-source gate: receipt digest `a7906e3a...` vs current digest `1bc68022...`; no import, enrichment, JSON update, or Neon call occurred. Vercel's bf502 production build was refused by the same proof mismatch; last READY release is dpl_F81... on main 0877129e. Do not retry deployment.
- Public streaming JSON remains HTTP 200 / 457 rows; six officially announced titles are still missing. Confirmed official RSS/Atom registry count is zero. Continue the approved manual-official-announcement pathway; do not assert automatic feed discovery.
- #870's test-only patch passed its Python suite and was consolidated into #871 so its source digest is covered with the workflow change. #870 is closed as superseded. #871 source commit before this …7921 tokens truncated…ld-rate-limit`; source-link UI is not production-deployed. Current main deployment is READY, but do not bypass the failing PR gate.
- Vercel authenticated fetch returns HTTP 200 for production JSON and `streaming.html`. Direct Chrome navigation redirected to Vercel login, so actual rendered cards/image loads remain unverified. No temporary share access or quota workaround was created.
- Prior updater run `43793292311` had one final Neon Prisma P1001 failure. No retry. Viewing history, ratings, reviews, bookmarks and backups were not touched. No manual update dispatch, deployment, scraping, or paid upgrade.

### Next actions

1. Keep #244 open. Recheck the normal Vercel release gate and do not deploy while build-rate-limit is reported.
2. Refresh PR #872 against live main; require final exact-head checks. Allow only the existing scheduled updater to attempt Proxies alias resolution. Trust the poster only after a unique TMDB ID is stored.
3. Visually verify the production cards when an authorized browser-accessible route is available without expanding access. Do not claim this acceptance is complete until then.


## Live continuation checkpoint — 2026-11-16 10:50 UTC

- Latest main: `66b04cc44140346e5865c5fdd4679bacf42aaac7`. #239 and #244 are open; #593 is closed/completed.
- Public canonical production JSON: boxoffice HTTP 200, 1,808/1,808 by-year and 100/100 all-time rows postered. Streaming HTTP 200, 463/463 rows postered; generated `2026-11-16T08:05:29.780681+00:00`. Proxies has a poster marked `fuzzy_search_fallback` plus candidate ID 1623160/TMDB URL, but no verified identity match: the ID has not yet been confirmed as the official `En nombre de otro` title/year result.
- Official Netflix Spain title evidence: Proxies / En nombre de otro, release date 2026-12-11. The TMDB API identity must still be resolved by the existing secret-backed workflow; do not adopt a guessed ID.
- PR #874 (`fix/recheck-curated-fuzzy-streaming-id-20261116`) implements a narrow recheck for only a curated official alias on an existing fuzzy poster with no saved TMDB identity. It replaces the poster/assigns an ID only after a unique exact-title and 2026 result. Ambiguous, wrong-year, API failure or missing-key paths preserve the existing row. Three regressions cover these outcomes. Source/test SHA at PR creation: `c909bbce2759df78a59ae53b4a02deeefc0d849c`; exact-head CI pending.
- Current release blocker: Vercel main deployment for `66b04cc` failed `verify-production-release.cjs`: receipt source `aaa160a2b79c8e62e363f3d5432e2fd8fb3736ea`, current digest `3965f6aa23fead1d7faae1ac6bd4d65989e86d9c9fa7f46d6780466a66c27656`, verified digest `616cfe9735e0af4a2ebcfdb994bb39f14b7be06d8ef9eda1fc2219fd6288b028`. PR #873 separately has a 24-hour Vercel deployment rate limit. Existing READY deployment remains on SHA `1717965d5e6a000e1a97948e64237c6366076764`; no manual deployment or quota workaround.
- Official-source audit: zero confirmed RSS/Atom feeds; 12 service flags remain `auto_premiere_discovery=false`. No scraping or paid source added.
- No viewing history, ratings, reviews, bookmarks, backups, Neon, or unrelated user data touched. No manual updater dispatch/retry.

### Next concrete actions

1. Fetch PR #874 exact-head Actions and required status checks; use the final resulting head only.
2. Diagnose the exact-source production receipt mismatch under required checks. Do not merge or deploy while the gate fails or Vercel blocks a build.
3. After a safe release, let the existing scheduled updater run once; verify the public row has a unique TMDB ID, canonical poster, and no fuzzy marker, then check the deployed streaming cards and image responses. Keep #244 open until production acceptance; leave #593 closed unless missing posters recur.


## Live checkpoint — 2026-11-16 10:57 UTC

- Live main is `66b04cc44140346e5865c5fdd4679bacf42aaac7`. Issues #239/#244 are open; #593 is closed and production poster acceptance remains 0 missing: public JSON HTTP 200, 1,808 yearly rows / 0 missing and 100 all-time rows / 0 missing (generated 2026-09-27).
- Public streaming snapshot is HTTP 200, 463 rows / 0 missing posters, generated `2026-11-16T08:05:29.780681+00:00`. The Proxies candidate is dated 2026-12-11 and uses a fuzzy fallback; main/public JSON currently carries candidate ID 1623160, which remains unverified against the official `En nombre de otro` alias. Netflix's official announcement confirms the title/date; PR #874 adds a guarded alias recheck and never overwrites the fallback on ambiguity, year mismatch, API failure, or absent key.
- PR #874 exact head `9fd4bfd3e490a0e46fd3f17f37ba0e039350b628`: all eight observed Actions succeeded (run IDs 43852552692, 43852552757, 43852552699, 43852552526, 43852552595, 43852552729, 43852552697, 43852552779). Vercel backend remains failed with `build-rate-limit`; no merge/deploy.
- Canonical production remains READY at SHA `1717965d5e6a000e1a97948e64237c6366076764`. Main's production-proof is stale: receipt source head `aaa160a2b79c8e62e363f3d5432e2fd8fb3736ea`, digest `616cfe9735e0af4a2ebcfdb994bb39f14b7be06d8ef9eda1fc2219fd6288b028`; current executable source digest was reported as `3965f6aa23fead1d7faae1ac6bd4d65989e86d9c9fa7f46d6780466a66c27656`. Do not bypass or repeat deployment attempts.
- Streaming screen rendered at the canonical URL and exposes shared MY rating/review/bookmark controls. It reports 2,833 availability-observed titles, a separate data set from the 463 premiere supplement; it must not be reported as a 463-card rendering acceptance. No visual claim is made for Proxies specifically.
- Next: allow normal Vercel rate limit reset; then reconcile exact-source receipt against the successfully tested executable source and perform one normal release path. Keep #244 open until a live candidate identity and production card are actually verified. No user storage or backup changes.


## Live correction — 2026-11-16 11:05 UTC

- Main and production streaming rows both contain candidate ID `1623160` and a TMDB URL for Proxies, but retain `poster_match_status=fuzzy_search_fallback`; this is not identity acceptance.
- PR #874 was amended to recheck the official Netflix alias even when a fuzzy ID is already present. It may replace the poster and clear the marker only when exactly one TMDB result has the official title, expected 2026 release year, poster path, and the same ID as the existing candidate. If the API returns a different ID or multiple/no valid results, the row’s existing poster and ID remain unchanged.
- Regression tests now cover same-ID verification and conflicting-ID preservation. Latest exact-head CI is pending on the changed PR head; do not treat older green runs as current.


## Live continuation checkpoint — 2026-11-16 11:10 UTC

- Latest main is `66b04cc44140346e5865c5fdd4679bacf42aaac7`. #239 and #244 are open; #593 is closed. Open PRs confirmed: #873 and #874. #873 is stale against main and its Vercel backend gate is rate-limited; do not merge it around that status.
- Public production boxoffice JSON: HTTP 200, generated 2026-09-27, 1,808 yearly rows + 100 all-time rows, zero posterless. #593 has not regressed.
- Public production streaming JSON: HTTP 200, 463 rows, 463 poster URLs, generated `2026-11-16T08:05:29.780681+00:00`. The Proxies row has a fallback poster and `fuzzy_search_fallback`, but no TMDB ID in this production snapshot. Main's current streaming JSON has candidate TMDB ID `1623160` and the same fuzzy marker; neither the candidate ID nor its poster is verified identity. Keep the row unchanged unless the official TMDB API proves the exact official alias, 2026 release year, poster path, and—when present—the same candidate ID.
- PR #874 (`fix/recheck-curated-fuzzy-streaming-id-20261116`) current code head before this checkpoint was `70aad988920dfed261766bed5af26f9a7939f287`; it adds strict alias/year/ID verification and preserves existing values on mismatch, ambiguity, API failure, missing key, or missing poster. Exact-head Actions at 11:10 UTC: 5/8 green, 3 in progress; the Vercel backend check is success. This checkpoint updates the work-state file in commit `9e014a62e9b795ee76b53e9e0eb8e3e7a4cb5e7d`; the new resulting PR head requires fresh exact-head checks.
- Canonical production remains READY at `dpl_3zN7iLYSBC59aFCsksxSk1keKmDM`, SHA `1717965d5e6a000e1a97948e64237c6366076764`. Actual card/image browser acceptance is still unverified because direct browser access previously reached Vercel login; do not claim the 463 JSON rows are rendered as 463 cards.
- Source registry has 0 confirmed public RSS/Atom catalogs; all 12 provider premiere auto-discovery flags remain false. The current PR is a bounded verification improvement using the existing official TMDB API job and Netflix's official announcement, not a claim of automated discovery coverage.
- No viewing history, ratings, reviews, bookmarks, or backups were changed. No manual updater dispatch, Neon retry, scraping, paid service, Vercel deployment, or quota bypass.

### Next concrete actions

1. Fetch all Actions for the resulting exact PR #874 head; continue only when required checks finish. If any fail, inspect the failing job/log and fix the cause without reducing assertions.
2. If required checks are green, use only the ordinary release path. Let the existing scheduled updater recheck Proxies; verify the final production identity and public JSON, then the actual card/image in an authorized browser session.
3. Keep #244 open until source coverage, LKG behavior, freshness, and rendered production acceptance are evidenced. Keep #593 closed while production posterless count remains zero.


## Live checkpoint — 2026-11-16 12:24 UTC

- Latest main: `66b04cc44140346e5865c5fdd4679bacf42aaac7`. Issue #593 remains closed/completed. Canonical production boxoffice JSON HTTP 200: 1,808 by-year rows and 100 all-time rows, zero posterless rows in both sets.
- Issue #244 remains open. Public production streaming JSON HTTP 200: 463 rows, zero missing poster URLs, generated at `2026-11-16T08:05:29.780681+00:00`. The Proxies image is present but `poster_match_status=fuzzy_search_fallback`; the production record has no TMDB identity. Main has candidate TMDB ID `1623160`, still marked fuzzy and unverified.
- PR #874 exact code head `a2be4de393a9d6d3d5d640ddfc4d364cca195f86`: all 8 GitHub Actions succeeded (Validate frontend 43855629549; Autonomous quality gate 43855629526; smoke 43855629552; Python contract 43855629561; mobile 43855629502; visual QA 43855629512; reproducible backend 43855629532; completeness scorecard 43855629536). PR's Vercel backend status is still failure `build-rate-limit`.
- Canonical production remains READY at `dpl_3zN7iLYSBC59aFCsksxSk1keKmDM`, SHA `1717965d5e6a000e1a97948e64237c6366076764`. The latest main build `dpl_FhuB6mS4dVCfo6JiJMC4C1jqmMsD` failed before publication: `verify-production-release.cjs` rejected the stale receipt (receipt head `aaa160a2b79c8e62e363f3d5432e2fd8fb3736ea`, verified digest `616cfe9735e0af4a2ebcfdb994bb39f14b7be06d8ef9eda1fc2219fd6288b028`) because current executable source digest is `3965f6aa23fead1d7faae1ac6bd4d65989e86d9c9fa7f46d6780466a66c27656`. Do not bypass or hand-edit the release gate.
- Provider audit remains 0 confirmed public RSS/Atom feeds and 12/12 premiere-discovery flags disabled. Six official Netflix/U-NEXT announcement rows were imported in the existing successful official workflow (run `43828393897`); five have TMDB identities, Proxies remains unverified. Netflix's Spanish title is an alias candidate only; TMDB's public movie path is robots-blocked in this environment, so no ID was guessed.
- Existing updater schedule: `17 18 * * * UTC`; next run is `2026-11-16 18:17 UTC`. No manual dispatch was issued. Prior Neon P1001 remains unretried.
- No viewing history, ratings, reviews, bookmarks, or backups changed. No paid plan, scraping, quota workaround, manual deploy, or CI bypass.
- Next: keep #874 and #244 open; reconcile the production CI receipt only via the repository's established exact-source process, then use one ordinary Vercel release after its gate permits it. Let the scheduled updater run and confirm whether the alias returns one exact 2026 movie/ID; re-fetch production JSON and verify the actual Proxies card/image before marking #244 complete. Rendered-card acceptance is currently unverified.


## Live checkpoint — 2026-11-16T13:11:49Z UTC

- Re-fetched live state. Main is `66b04cc44140346e5865c5fdd4679bacf42aaac7`; #239/#244 are open, #593 is closed. Open PRs are #873 and #874; #874 remains based on current main and its verified source head is `a843b1c5cc18d556f92298fdacf6174fd726d9de`.
- Production boxoffice JSON re-fetch: HTTP 200, generated 2026-09-27; 1,808 by-year rows and 100 all-time rows, 0 posterless in either set. #593 has not regressed.
- Production streaming JSON re-fetch: HTTP 200, generated `2026-11-16T08:05:29.780681+00:00`; 463 rows, 0 missing poster URLs. These are the announcement supplement, not the 2,833 availability-observed title count.
- PR #874's exact source `a843b1c5cc18d556f92298fdacf6174fd726d9de` has all 8 observed GitHub Actions successful (Autonomous 43866914679; smoke 43866914574; frontend 43866914636; backend 43866914645; visual QA 43866914643; mobile 43866914629; scorecard 43866914661; Python contract 43866914525). The source receipt is being refreshed to the exact tested executable tree `e1acb67e8a2cfaa6a4f45e5ed3e8f728adfd02b7`, digest `15b626893271be537de20d7cc32b8c4445a619479f03d8b21b41ebe984e7c899` across 1,399 relevant files. This is a proof/checkpoint-only commit; its new exact-head checks must pass before merge.
- The last main deployment `dpl_FhuB6mS4dVCfo6JiJMC4C1jqmMsD` for `66b04cc` failed before publish because its old source receipt/digest was stale. Canonical production remains READY at `dpl_3zN7iLYSBC59aFCsksxSk1keKmDM` on SHA `1717965d5e6a000e1a97948e64237c6366076764`. No manual deploy or quota workaround.
- Issue #244 remains open. Proxies has an official Netflix alias but still no verified TMDB identity; the fallback artwork is not accepted as identity evidence. Existing scheduled updater is the only permitted secret-backed lookup path. No manual dispatch; no Neon retry after P1001.
- Viewing history, ratings, reviews, bookmarks and backups remain untouched. No scraping, paid feeds, or changes to disabled auto-discovery flags.

### Next actions

1. Wait for fresh Actions on the receipt/checkpoint PR tip; don't merge on the prior head's success alone.
2. If final exact-head required checks and the normal release status are green, use the standard merge/release path once; otherwise record the precise blocker and leave #244 open.
3. After the next existing scheduled updater run, verify whether Proxies has a unique exact alias/year TMDB identity; then verify production JSON and the rendered streaming card/image. Keep #244 open until this evidence is complete.


## Live checkpoint — 2026-11-16T18:40:03Z UTC — CINELVA helper-copy cleanup

- Latest main is `4a19f628ddbf5b228e5518fd0ddfc9525db51ea7`. #593 remains closed and was not touched; #244 remains open and was not started in this UI-copy task. Open PRs before proof refresh: #873 only.
- PR #875 merged as `4a19f628ddbf5b228e5518fd0ddfc9525db51ea7`; exact tested source head `0aeeac274d48f572e27246602a500cb5812cbe79` has Git tree `03d5a71e2e85c0b79fb73b0b19f6d10304a51930` and executable digest `ddd9459c1790fb81b4e698405b9b2a9180634d5c3c034d2ed55561fe1ce81d63` across 1,400 relevant entries.
- Exact-head required Actions passed: Autonomous quality 43928544188, CINELVA smoke 43928544484, Validate frontend 43928544207, Reproducible backend build 43928544618. Supplemental backup, visual, mobile, scorecard, brand, Python-contract and isolated Pages checks also passed.
- Automatic production deployment `dpl_ET4MJ2daxx6vcwUVTYRHAQRyNMCy` failed before publishing. Exact log: old receipt head a843b1c5 had digest 15b626893271be537de20d7cc32b8c4445a619479f03d8b21b41ebe984e7c899; current tested source digest is ddd9459c1790fb81b4e698405b9b2a9180634d5c3c034d2ed55561fe1ce81d63. This is the release proof gate, not deployment quota. Old production remains READY at `dpl_CPZGWBYFcfR2UkNxnab9P6zocoCP` on `86a43264371c0e6b77a6980419f415ce7`.
- A receipt-only proof refresh is being prepared for already-tested PR #875 source head. Do not bypass the guard, manually deploy, or change saved viewing/rating/review/bookmark/backup data. After the proof PR’s exact-head checks pass and it is merged, let the normal Vercel integration build once; verify READY and affected public routes before marking this task production-verified.


## 2026-11-17 08:10 JST — official streaming feed activation

- Live main is `0482952604ec79b2bbde263ebfcba4eb5c595586`. Issue #593 remains closed/completed. Production boxoffice JSON is HTTP 200 with 1,908 rows and zero missing posters. Production streaming JSON is HTTP 200 with 463 rows and zero missing posters.
- Vercel production deployment `dpl_DmcgctfTBS5hRxUy16mC9s8cP399` is READY on that exact main SHA. No manual deployment was requested.
- PR #877 (`feat/official-streaming-feeds-20261117`) registers publisher-advertised RSS/Atom endpoints for Netflix Newsroom Japan, About Amazon Japan and Apple TV Press, connects registry changes to the existing discovery workflow, and adds zero-network RSS/Atom parser coverage.
- Feed entries are candidates only. `auto_premiere_discovery` remains false. Never publish until movie/series type, Japanese premiere date and a unique TMDB movie identity are independently verified.
- Existing PR #873 remains separate. Its browser jobs fail during Playwright browser preparation before app assertions; one targeted retry reproduced the infrastructure failure, so do not loop retries.
- No user records, ratings, reviews, bookmarks, backups, Neon data or production deployment were changed. No scraping or paid source was introduced.
- Next: read exact-head CI for PR #877. If green, inspect generated candidates, discard series and ambiguous matches, verify official Japanese dates and TMDB identities, then use the normal merge/release gate and perform production acceptance. Keep #244 open.

- CI follow-up at 10:00 JST: the only implementation-related Python failure was a stale audit assertion that all services had zero approved feeds. Commit `52bdb0ee586b135f2a694cee3ccffc9f379b25e8` now expects one approved candidate feed for Netflix, Prime Video and Apple TV+ while still requiring `automated_premiere_services == 0`. Browser failures remain in Playwright preparation, before application assertions.

## 2026-11-17 11:10 JST — official-feed CI compatibility

- PR #877 implementation head `693e10fb4c8597d22f7bb01f58c08b23cc512833` passes the full Python suite, deterministic shared quality gate, smoke tests and reproducible backend build.
- Browser workflows did not reach application assertions. GitHub's `ubuntu-latest` resolved to Ubuntu 26.04, while Playwright 1.59 stopped with `Playwright does not support chromium on ubuntu26.04-x64`.
- The five browser-bearing workflows are pinned to `ubuntu-24.04`, a supported hosted runner, instead of retrying the unchanged failure. Read the new exact-head checks before any merge.
- The three official feeds remain candidate discovery only. Automated premiere publication stays disabled, and movie type, Japanese premiere date and unique TMDB identity are still mandatory.
- Production remains READY on main `0482952604ec79b2bbde263ebfcba4eb5c595586`; public boxoffice is 1,908/1,908 postered and streaming is 463/463 postered. No production data or user storage changed.

## 2026-11-17 14:10 JST — verified FOD release and exact identity reuse

- Live main is `63d24b9af9dc59f7e8046e0f7b7ede7c5ebb3531`. Issue #593 remains closed. Production boxoffice JSON is HTTP 200 with 1,808 yearly rows plus 100 all-time rows and zero missing posters. Production streaming JSON is HTTP 200 with 463 rows and zero missing posters.
- FOD's official Help announcement lists `箱の中の羊` as a rental release on 2026-11-18. The existing U-NEXT row has the exact normalized title and date, one unique TMDB identity (`1553969`) and a valid TMDB-hosted poster. The reviewed FOD row therefore reuses that identity; no title-only or fuzzy identity was accepted.
- The candidate snapshot increases from 463 to 464 rows. The new row is not yet production evidence. Conflicting same-title/date identities fail closed and leave ID/poster unset.
- Focused importer tests passed 6/6. `scripts/quality_gate.py` passed, including 598 Node tests and all Python/contract checks. Viewing history, ratings, reviews, bookmarks and backups were not changed.
- PR #880 exact head `ffe13fd8e2545a131c2e0938dfa89026152c9fe9` now has all 9 observed Actions successful. It remains unmerged because the latest normal Vercel release attempt is blocked by the Hobby build-rate limit; prior production remains READY. No manual deploy, quota workaround, Neon retry, scraping or paid source was used.
- Next: open a separate small PR for the FOD change, read its exact-head CI, and merge only through the normal gate when Vercel permits one ordinary release. Then verify public streaming count 464 and the rendered FOD card. Keep #244 open until that evidence is complete.

## 2026-11-17 17:15 JST — PR #881 exact-source receipt

- PR #881 source head `e5a2fc6be8a4831e62e7ec290b8bb7e7f477b430` is mergeable and all eight observed Actions succeeded. Required runs: Autonomous `44036208100`, smoke `44036208150`, frontend `44036208149`, backend `44036208136`. Supplemental Python, mobile, scorecard and visual runs also succeeded. Vercel backend status is success.
- The executable source digest is `4b5e79e5d1fd7ecf2dc45788fe37898be5b979479961bdbbe29ec4b38b11edea`. `quality/production-proof.json` now points to the exact tested remote source head; this proof/docs-only commit does not change executable source or published data.
- Latest visible production remains READY on `c1ccdc084fd6ce8e3b0e9837b388ec06cac310a5`. The later `11eac0a8cc5ef81bb7212cba9c7a5c0e3af1ffa4` production attempt is ERROR; do not retry or merge around it without the normal gate. Public data last rechecked this run remains boxoffice poster gaps 0 and streaming 463 rows/0 poster gaps.
- Next: require fresh exact-head CI on the receipt-only PR tip. If successful and the ordinary frontend release gate is available, merge once and verify public streaming count 464 plus the actual FOD card in Chromium/WebKit. Keep #244 open until production evidence is complete.

## 2026-11-17 17:36 JST — WebKit CI stabilized on PR #881

- Receipt-only head `57b1c108711029aca9a2c09231e582fbd194f7ea` exposed two different serial WebKit timeouts: first the provider offline status, then global-search navigation. The first passed on the targeted rerun while the second timed out, confirming runner timing rather than an FOD data failure. No further retry was launched.
- Source head `658b0fe3f106b30c9477bce31c6cbfde41af68e3` now waits for `DOMContentLoaded` on the affected saved-director navigation. All nine Actions succeeded on this exact head, including frontend run `44047187540`; both provider-list and global-search Chromium/WebKit paths passed.
- Executable digest `3c703bf9e8255b3392b842356d01c2aabdff4a2b7deb95d7d9812d0fae2897c7` is recorded in the release receipt. Candidate streaming remains 464 rows; production remains 463 until merge and the ordinary automatic deployment complete.
- Next: require fresh exact-head checks on the proof/docs-only tip, merge only if green, then wait for the automatic Vercel production deployment and verify public streaming count 464 plus the rendered FOD card. Keep #244 open.

## 2026-11-17 22:10 JST — multi-service calendar card

- Live main is `01de2d1cf0e25f0f1f3c15d3146f27e1a1eac7e1`. #593 remains closed; production boxoffice JSON is HTTP 200 with 1,908 rows and zero poster gaps. #244 remains open.
- Production streaming JSON is HTTP 200 with 464 rows and zero poster gaps. `箱の中の羊` has two official announcement rows on 2026-11-18, FOD and U-NEXT, both with verified TMDB identity `1553969`; the current production UI only exposes the first service on its card.
- PR #882 source head `a48c0e0548221f28ffa173564dbe72526daeb6e7` groups only rows sharing the same positive TMDB identity inside the same date group, renders every service label on one card, and counts unique works instead of raw service rows. ID-less or conflicting-ID same-title rows remain separate.
- Focused Node tests passed 22/22. The complete local quality gate passed 599/599 Node tests and all Python, compliance, source and work-state checks. Local Playwright could not start because this runner has no browser binary; Chromium/WebKit coverage is required from exact-head CI.
- Vercel production is READY on main deployment `dpl_7cxoReLKpNLKBRbT9XVpdKPrB7Ly`. The latest updater saved JSON successfully but Neon sync failed P1001; no retry, paid action, manual deploy or quota workaround was attempted. User viewing history, ratings, reviews, bookmarks and backups remain untouched.
- First exact-head run found two infrastructure-only failures after application tests passed: backup run `44089721031` and isolated Pages run `44089720866` both resolved to Ubuntu 26.04, which Playwright 1.59 rejects before browser assertions. The two workflows are now pinned to supported `ubuntu-24.04`; no blind retry was issued.
- Exact tested head `4907bef30d7b9ff7d5e8bca47eaaa62d6f15086f` passed all 11 observed workflows. Required runs: Autonomous `44090187452`, smoke `44090187460`, frontend `44090187679`, backend `44090187606`. Supplemental Python, mobile, completeness, visual, backup, isolated Pages and brand checks also passed. Executable digest: `bde9a73fab335030d4316e054312959c7d7f3b041a3d7bd854ce0af6e903c97c`.
- Next: require fresh exact-head CI on the proof/docs-only tip, merge once if green, and verify the automatic READY deployment plus one live card showing both FOD and U-NEXT in Chromium/WebKit. Keep #244 open.

## 2026-11-18 04:12 JST — verified official-feed candidate dedupe

- Live main is `847c647263c2ffed269d5ffa6a88333239190d3f`; #593 remains closed. Public boxoffice JSON is HTTP 200 with 1,908 rows and zero poster gaps. Public streaming JSON is HTTP 200 with 464 rows and zero poster gaps, generated `2026-11-17T05:08:01.685949+00:00`.
- Existing PR #880 was rebuilt on live main rather than duplicated. Its code head `3f14be9b241dc84904018ac2007b4aee2cace4bd` changes only candidate classification/tests plus the pre-existing My Best 10 Python release-contract correction required by current main.
- A feed candidate becomes `already_in_verified_catalog` only when its official source URL matches after removing `utm_*` parameters only, service and normalized title match, the catalog date is a real ISO date, and exactly one positive TMDB identity remains. Candidates remain review-only; no movie row is published.
- All 22 observed exact-head checks succeeded. Required runs: Autonomous `44154596960`, smoke `44154597017`, frontend `44154597088`, backend `44154596926`. Supplemental Python, mobile, backup, completeness and visual checks also passed. Executable digest: `91956f9674d047a38d5c85874f388d3d94e07dc1e015ec071d2374ee4ce5dd38`.
- No viewing history, ratings, reviews, bookmarks or backups changed. No scraping, paid source, Neon retry, manual updater dispatch, manual Vercel deploy or quota workaround was used.
- Next: require fresh exact-head CI on the proof/docs-only tip. Merge only if it is unchanged, mergeable and all required checks are green; then confirm the ordinary automatic production deployment and re-fetch public JSON. Keep #244 open.

## 2026-11-18 05:07 JST — strict official-streaming poster identity

- Live main is `5ff369544df2e2b15029a0fba9a7bbafc0bbba6c`; #239/#244 are open and #593 remains closed. Vercel production deployment `dpl_FQrGSQh2ju44veo57avuN4aEA8Ka` is READY on that exact main.
- Public boxoffice JSON is HTTP 200 with 1,908 rows and zero poster gaps. Public streaming JSON is HTTP 200 with 464 rows and zero poster gaps, generated `2026-11-17T05:08:01.685949+00:00`.
- PR #885 code head `8184ff75e76220feff1f03caf4e365708c1ad19f` removes `CINELVA_ALLOW_FUZZY_POSTER_FALLBACK` from both official streaming enrichment passes. Existing verified-ID and unique title/year enrichment remains; unresolved rows now fail closed instead of receiving guessed artwork.
- A workflow contract test prevents fuzzy poster fallback from being re-enabled. Focused local verification passed 41 tests, and source/streaming coverage checks passed.
- Required exact-code-head Actions passed: Autonomous `44164733008`, smoke `44164733053`, frontend `44164732844`, backend `44164732945`. Full Python, mobile, visual and completeness scorecard `44164733155` also passed. Executable digest: `5d52805320aa5e31981738606397a3b308dfcf30b2b2f5fa1d1806e32ca087d8`.
- Latest scheduled updater run `44158083603` saved JSON successfully and failed only at direct PostgreSQL sync because Neon was unavailable. It was not retried. No manual updater dispatch, manual Vercel deploy, scraping, paid action or quota workaround was used; user viewing history, ratings, reviews, bookmarks and backups were untouched.
- Next: require fresh exact-head checks on this proof/docs-only tip, merge only if unchanged and green, then confirm automatic production READY and public JSON health. Keep #244 open.

## 2026-11-22 15:06 JST — official-feed health PR resumed on live main

- Live main is `98754aabfcebb3a65539d982272b824843972793`. Issue #593 remains closed. Canonical production is READY on the same SHA (`dpl_7TuysNXLoy73G8MoLVLSHmDxY3QG`).
- Canonical boxoffice JSON is HTTP 200 with 1,808 by-year rows plus 100 all-time rows and zero missing posters. Canonical streaming JSON is HTTP 200 with 464 rows and zero missing posters. Issue #244 remains open.
- Existing PR #886 was not duplicated. Its prior source had two cancelled long workflows and had become unmergeable after four days of main updates. The implementation was rebased onto current main; live source timestamps and counts won every data conflict.
- Source head `fffc3fd17b1efed50e2d80a45837a841923f2d6f` reports approved official RSS/Atom candidate discovery separately from reviewed publication, records check/candidate/catalog-match counts, and preserves last-known-good candidates/status after fetch failure. It does not auto-publish candidates.
- Focused verification passed 14 tests. `python scripts/quality_gate.py` passed the complete deterministic suite. No user history, rating, review, bookmark, backup, Neon data, paid service, scraper, manual updater dispatch or manual deployment changed.
- Next: move the existing PR #886 branch to the rebased commit, require fresh exact-head CI, then renew the release receipt only after the four required source-head workflows pass. Keep #244 open until production status and rendered acceptance are verified.

## 2026-11-22 15:26 JST — official-feed source head verified

- Existing PR #886 code head `7cf2f5ce922b64d983c77dc3c0bb304b32ae8c8a`; no duplicate PR or updater run was created. Executable digest is `b9a8384a4a740face46cea60b86fefc5fe4eaec2d903432f9b956f76d5ba06b0`.
- Newly published npm advisories were resolved without retry loops: Next.js is locked at 16.4.6, Prisma at 6.12.0 avoids the vulnerable `effect` graph, and `deepmerge-ts` 8.0.0 is explicit so the existing cyclic/config merge security regression remains installed.
- Local evidence: backend audit reports zero vulnerabilities; deepmerge security regression, backend production build and full quality gate pass. Required exact-code-head runs all passed: Autonomous `44993393756`, smoke `44993393746`, frontend `44993393773`, backend `44993393759`.
- #593 remains closed; production boxoffice remains 1,908 rows with zero missing posters. Public streaming remains 464 rows with zero missing posters. User history, ratings, reviews, bookmarks and backups remain untouched; no scraping, paid action, Neon retry, manual updater dispatch, manual deployment or quota workaround occurred.
- Next: require fresh final-head CI on this proof/docs-only tip, then merge normally and accept the automatic production deployment plus the rendered public source-status UI. Keep #244 open.

## Live checkpoint — 2026-11-22 13:35 UTC — December streaming gap

- Live main is `957829ca9a55714b812786be132e275d0c079951`. #593 is closed/completed; #244 and #239 are open. #886 is merged. The only live open PR is unrelated PR #879 (VIVANT movie-choice UI); no overlapping #244 PR exists.
- Production Vercel is READY on this exact main. Main Vercel backend and frontend checks pass. Production `boxoffice.json` is HTTP 200: 1,808 yearly rows + 100 all-time rows, poster gaps 0. #593 has no recurrence.
- Production `streaming.json` is HTTP 200, 464 rows, zero missing posters, generated `2026-11-17T05:08:01.685949Z`. It contains five December 2026 rows, all Netflix; no December films from other services are present.
- Source evidence: Netflix Tudum's official announcement lists `THE FURTHER MIS-ADVENTURES OF CLIFF BOOTH` for 2026-12-23 on Netflix; the official Japan title page is `https://www.netflix.com/jp/title/82054606`. The existing current production `data/movies.json` row provides one exact canonical identity: Japanese/original title, 2026 release year, David Fincher, TMDB movie ID `1457866`, and poster `https://image.tmdb.org/t/p/w500/gEqfmochcRmyDQFThatTKQfH9GT.jpg`. This uses the repository's existing unique identity; no ID/poster was inferred from a title search.
- Added one reviewed movie row to `data/streaming-2026-12-official-supplement.json`. It has not reached public JSON yet. Existing `refresh-official-streaming.yml` consumes monthly supplements on main push and on its normal schedule; after merge, observe one automatic run, do not manually dispatch.
- Local verification passed: 22 focused streaming tests, `scripts/quality_gate.py` (601 Node tests plus the repository's Python checks), and an isolated end-to-end run of both monthly supplements through refresh/import. The catalog went 464→465 with exactly one new Netflix row (2026-12-23, TMDB 1457866, poster present); tracked `data/streaming.json` was not changed during the test. The importer now retains the Japan-specific title-page URL on published records.
- PR #887 is open on `codex/244-december-netflix-movie-20261122`; current branch head before this checkpoint update is `c06351b2f62a8ddd0facb5ada386215c01d30db5`. Its PR-triggered Autonomous gate, frontend validation, backend build and smoke workflow were running; after this checkpoint commit, require the checks again on the new exact head. No #244 PR was already open when this branch began.
- Publication guard classifies the new monthly supplement as protected manual intake, not generated data. Therefore the four exact-head workflows and a renewed `quality/production-proof.json` receipt are required before publication; neither has been skipped. Exact-head PR CI, post-merge automatic refresh, public row/poster count, Vercel READY on the data-update main, and calendar rendering remain pending.
- User records, ratings, reviews, bookmarks and backups were not changed. No scraping, paid action, Neon retry, manual deployment, quota workaround or CI bypass.
- Next: wait for PR #887 checks, then confirm all four required workflows passed on the exact code head. Renew `quality/production-proof.json` only after that evidence, require fresh checks on the final receipt head, and merge only when green. Observe the ordinary refresh run and verify public JSON plus calendar rendering. Keep #244 open until production acceptance is evidenced.


## 2026-11-22 22:45 JST — #887 source CI passed; receipt renewed

- Live main remains `957829ca9a55714b812786be132e275d0c079951`; #593 is closed/completed, #244 and #239 are open. PR #887 is open and mergeable; #879 remains the unrelated open PR.
- Production boxoffice JSON remains HTTP 200 with 1,808 by-year + 100 all-time rows and zero missing posters. Production streaming JSON remains HTTP 200 with 464 rows and zero missing posters; December has five movie rows, all Netflix.
- All four required workflows succeeded on exact source head `ac66f62a718a9a0a12a0f8675de3b3813680c048`: Autonomous quality gate `45028311839`, Validate frontend `45028311840`, Reproducible backend build `45028311859`, and CINELVA smoke `45028311888`. Executable-source digest is `0cde4c8ca7e0b000b0774e5aede0d91040d97d51b66f4493d2f0a18b8e64c408`.
- Renewed `quality/production-proof.json` to bind those exact-head runs and digest. The only source-data addition remains the one Netflix Dec 23 film with official Japan source URL; the existing unique TMDB identity/poster is preserved. Local supplement/import verification is 464→465 exactly, 22 focused tests and the full quality gate passed.
- The receipt/docs-only PR tip still requires fresh exact-head CI; do not merge until its four required workflows pass and PR head is unchanged/mergeable.
- Production deployment remains READY on unchanged main (`dpl_5PZVhxZn4ns4SLJaSqyMyovWWVwf`, SHA `957829ca9a55714b812786be132e275d0c079951`). The new data is not live.
- After final-tip CI, merge normally once, then observe the normal automatic streaming refresh once. Verify public December count changes 5→6, row date/title/service/TMDB ID/poster/Japan source URL, Vercel READY on the resulting main, and calendar rendering. Keep #244 open until accepted. No manual dispatch/deploy, quota workaround, scraping, paid action, or user-storage change.

## 2026-11-22 23:06 JST — #887 merged; December Netflix row is live

- Live main: `35c74d1696434850bc7a999e1c299d59e5af2f72`. #593 remains closed; production `boxoffice.json` is HTTP 200 with 1,808 by-year + 100 all-time rows and **0** posterless rows. #244 and #239 remain open. PR #887 merged at `75a4667a7339ef95f3675e11c420ffa009a8c33e`; the only open PR is unrelated #879.
- Exact-head required CI passed on final PR head `9b498d352f32f5b6ae64a607b761cfa7ac1a3bf7`: Autonomous `45029542623`, frontend `45029542577`, backend `45029542553`, smoke `45029542570`; visual QA, mobile, Python, and scorecard checks passed too. Source receipt binds tested head `ac66f62a718a9a0a12a0f8675de3b3813680c048`, executable digest `0cde4c8ca7e0b000b0774e5aede0d91040d97d51b66f4493d2f0a18b8e64c408`.
- The official streaming refresh `45030064750` succeeded and committed `43ecb2bd805f4d42150262c3aab06ccd5c0abe12`. Public `streaming.json` is HTTP 200, generated `2026-11-22T13:56:27.688255Z`, 465 records; six December 2026 Netflix films now have posters. The new `2026-12-23` record is TMDB `1457866`, Japanese title `ザ・ファーザー・ミスアドベンチャー・オブ・クリフ・ブース`, 141 minutes, with Netflix Japan provenance `https://www.netflix.com/jp/title/82054606`.
- Live Vercel deployment `dpl_5NPj76MU3u8peyE61hRMcDDZmoHE` is READY on main `35c74d1`. On the production calendar's December view, the 12/21–12/27 section visibly/semantically shows the new poster, Netflix label, 12/23 date, title, runtime and review/bookmark controls. Remote browser acceptance passed; physical iPhone Safari was not tested.
- `Update movie data` run `45030064770` saved its JSON snapshots to main `35c74d1` but ended failed at the final Neon sync with Prisma `P1001`: `ep-snowy-wave-b4gwato2.c-6.us-east-2.aws.neon.tech:5432` unreachable. No retry was made; the published JSON is live and DB sync remains unverified.
- #244 remains open: this is one confirmed December Netflix improvement, not proof of complete service/category coverage or freshness. No viewing history, ratings, reviews, bookmarks or backups changed; no scraping, paid action, manual dispatch/deploy, quota workaround, or CI bypass.
- Next: audit the next source/category gap from live registry/workflows, verify official-feed terms and existing normalized path, then make another bounded improvement. Do not retry Neon until the endpoint is confirmed reachable.


## 2026-11-22 23:11 JST — live state reconfirmed; candidate screened

- Re-read live GitHub: main `35c74d1696434850bc7a999e1c299d59e5af2f72`; #239 and #244 open; #593 closed. The sole open PR is unrelated #879 (VIVANT selection UI). Exact PR #887 head `9b498d352f32f5b6ae64a607b761cfa7ac1a3bf7` has the required four CI runs successful and was merged at `75a4667a7339ef95f3675e11c420ffa009a8c33e`.
- Production Vercel frontend and backend are READY on main `35c74d1`; main combined status is success. Public boxoffice JSON HTTP 200: 1,808 yearly + 100 all-time records, 0 poster gaps. Public streaming JSON HTTP 200: 465 records, 0 poster gaps; six December 2026 entries, all Netflix and postered. The new Dec 23 Cliff Booth entry is among them.
- Screen acceptance on the production calendar remains verified for Dec 23: poster, Netflix, date, title, runtime and review/bookmark controls. Remote browser tested; physical iPhone Safari not tested.
- Screened the candidate `Bad Day`: official Netflix Japan title page confirms Japan catalog presence/title, but Netflix Media/Tudum's Dec 11 date is explicitly US-only. It was excluded rather than treating the US premiere date as Japanese. Other feed results were not promoted because they were series, non-film events, or lacked a verified Japan date.
- Official discovery remains 3 feeds / 26 candidates / 1 catalog match in last successful snapshot. This is discovery, not complete service coverage. #244 remains open. The update-movies run saved its JSON snapshot but failed at final Neon sync with P1001 (`ep-snowy-wave-b4gwato2.c-6.us-east-2.aws.neon.tech:5432` unreachable); no retry.
- No viewing history, ratings, reviews, bookmarks or backups changed; no paid source, scraping, manual workflow dispatch/deploy, quota workaround or CI bypass.
- Next: audit the next provider/category against explicit official Japan release evidence and current source registry, then make one safe, bounded improvement if identity/date are unambiguous. Keep #244 open; do not retry Neon until endpoint availability is confirmed.


## 2026-11-22 23:16 JST — docs-head checks and release guard result

- Live main before this checkpoint is docs-only `5be8fd5a9b573c5eeb8eaed67080c4d93e70bd53`; the application/data main remains `35c74d1696434850bc7a999e1c299d59e5af2f72`. #593 closed; #244/#239 open; only open PR #879 is unrelated.
- Post-checkpoint main Actions: smoke `45031567290` succeeded, completeness scorecard `45031567253` succeeded, Pages build/deploy `45031566534` succeeded. The Pages publication guard `45031567246` failed closed: `verify-production-release.cjs` received GitHub REST HTTP 403 rate-limit exceeded while verifying the CI proof for `ac66f62`; deploy was skipped. Do not retry or bypass until the external API limit recovers.
- Vercel frontend/backend checks report success as `Canceled by Ignored Build Step`; no app build/deploy was needed for docs-only changes. Production remains READY on the preceding product/data SHA `35c74d1` (`dpl_5NPj76MU3u8peyE61hRMcDDZmoHE`), which is the unchanged executable/data tree.
- Public data still checks out: boxoffice 1,808 yearly + 100 all-time / 0 poster gaps; streaming 465 / 0 poster gaps, six December Netflix entries. The Dec 23 Cliff Booth item remains in the production calendar.
- Official Netflix `Bad Day` candidate was rejected: the Japan title page exists but the only located Dec 11 release date is explicitly US-only. No Japan date was inferred.
- No user storage, paid source, scraper, manual workflow/deploy, quota workaround, CI bypass or Neon retry. The `Update movie data` run remains blocked only at final Neon sync with P1001.
- Next: continue source-by-source #244 audit; promote only official Japan-dated film items with unique TMDB IDs. Wait for external Neon/API recovery rather than retrying. Keep #244 open.


## Live checkpoint — 2026-11-23 02:07 JST — official-source host enforcement

- Live main is `e70d82cf358f362bd74950a8149fe9ffb987071e`. #239 and #244 are open; #593 remains closed. PR #888 is the only #244 implementation PR; unrelated PR #879 remains open.
- Production `boxoffice.json` remains HTTP 200 with 1,808 by-year + 100 all-time rows and zero missing posters. Production `streaming.json` remains HTTP 200 with 465 rows, zero missing posters, and six December 2026 rows. #593 has not recurred.
- The reviewed supplement validator previously accepted any syntactically valid HTTPS source for a registered service. PR #888 now binds `source_url` and optional `region_source_url` to that service's existing `reviewed_premiere_hosts` policy. Arbitrary HTTPS and a different provider's official host are rejected before atomic replacement, preserving last-known-good bytes.
- Local verification passed: 10 focused refresh tests, the full quality gate, the strict full Python suite (431 tests), and an isolated refresh of all current monthly supplements. The first PR head exposed stale test fixtures and a December import test that assumed the already-published row was absent; those fixtures were corrected, not retried blindly.
- Exact source head `e9b08ad7823d56011e8885627ee71d2e30a4b936` passed Autonomous quality gate `45036702530`, CINELVA smoke `45036702463`, Validate frontend `45036702426`, Reproducible backend build `45036702589`, and Full Python contract suite `45036702472`. Executable digest: `c4e0c991482836ce2af8b29ce3d5b0b025252646c30e99b398017dad84d6c702`.
- `quality/production-proof.json` now binds that exact tested source. The receipt/docs-only final tip still requires fresh exact-head CI before merge.
- Vercel production remains READY on `dpl_5NPj76MU3u8peyE61hRMcDDZmoHE`, product/data SHA `35c74d1696434850bc7a999e1c299d59e5af2f72`. This guard does not alter visible data; after merge, observe the ordinary `refresh-official-streaming` push run once and confirm all current supplements remain accepted. Do not manually dispatch or deploy.
- No viewing history, rating, review, bookmark or backup changed. No scraping, paid action, Neon retry, manual deployment, quota workaround, or CI bypass occurred.
- Next: require fresh exact-head CI on PR #888's final proof/docs tip. Merge only if the same head is mergeable and green; then verify the automatic refresh, unchanged public counts/poster coverage, and Vercel READY. Keep #244 open.


## Live checkpoint — 2026-11-23 02:16 JST — source guard accepted

- Live main is `49826243044a4df88ba9542fc86691edd29a7a91`, after the normal now-playing and anime-TV generated-data writers. #239 and #244 remain open; #593 remains closed.
- PR #888 merged as `5301f58ea42d2c5cfe742a702a9778dd83fe0aa9`. Reviewed streaming supplement `source_url` and optional `region_source_url` must now match the selected service's registered `reviewed_premiere_hosts`. Arbitrary HTTPS and cross-service official hosts are rejected before atomic replacement, preserving last-known-good bytes.
- Exact-head verification passed. Source `e9b08ad7`: Autonomous `45036702530`, smoke `45036702463`, frontend `45036702426`, backend `45036702589`, Full Python `45036702472`. Final tip `dda9a75d`: Autonomous `45047596032`, smoke `45047596112`, frontend `45047596026`, backend `45047596192`, Full Python `45047596036`, mobile `45047596028`, scorecard `45047596050`, visual QA `45047596075`.
- Vercel production deployment `dpl_CH7h1Hbyz9iJ5gqAvzWrhhaVGgpR` is READY on exact merge SHA `5301f58e`; no manual deployment was used.
- Public acceptance: `boxoffice.json` HTTP 200, 1,808 by-year + 100 all-time rows, poster gaps 0. `streaming.json` HTTP 200, 465 rows, poster gaps 0, six December 2026 rows. `source-status.json` HTTP 200, generated `2026-11-22T17:14:35.192Z`.
- Ordinary push run `45048269309` succeeded through official supplement validation, poster/runtime enrichment, catalog import, backfill, candidate discovery and source-status generation. The final generated-data commit alone failed because concurrent now-playing writer commit `2b9a07a4` moved main and caused the guarded rebase to stop. The failed writer was not manually retried; last-known-good public data remains intact.
- No viewing history, rating, review, bookmark or backup changed. No scraping, paid action, Neon retry, manual updater dispatch, manual Vercel deploy, quota workaround or CI bypass.
- Blocker: December coverage remains six Netflix movies. No further non-Netflix movie has yet met Japan-specific official release-date evidence and unique identity requirements.
- Next: observe the next ordinary scheduled official refresh and confirm its final atomic publish succeeds on a quiet main. Continue reviewing official Japan December announcements for non-Netflix movies; do not infer dates or identities. Keep #244 open.
