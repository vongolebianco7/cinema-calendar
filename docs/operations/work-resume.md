# CINELVA Work restart guide

Use this guide whenever a Work session ends, loses context, or reaches a usage limit. GitHub issue [#239](https://github.com/vongolebianco7/cinema-calendar/issues/239) is the single progress hub; this guide and `work-state.json` carry the durable checkpoint.

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


## Live checkpoint — 2026-11-16 01:45 UTC

- Latest main `0877129eaa1b84fafb01f4d0d99369a35a8ab392`; production Vercel READY at `dpl_F81ij6fXoJut4du6dN8oLgDrxbf9`. #593 closed/completed with live public boxoffice JSON HTTP 200 and zero missing posters (1,808/1,808 yearly, 100/100 all-time). #244 reopened and remains Open until production streaming data/display acceptance.
- Public streaming JSON remains 457 rows (generated 2026-11-15T08:42:39.808Z); six officially verified announcement records remain absent. Confirmed official RSS/Atom feeds: 0. No RSS automation claim; use existing official-announcement import path.
- PR #869 (official provenance refresh) current head `7bf88ce6eb4b1a98fa2511090b2d0d2f98b42f94`: 18 check runs, 11 success and 7 in progress at the latest read. #870 (unit-test isolation) current head before this checkpoint update `333073259cf7719c791076ef4ffd7c1c65d15660`: 15 checks, 5 success, 9 running/queued, 1 skipped. Re-fetch latest head/checks; require green exact-head CI before merging either.
- Root cause from failed Autonomous quality gate run 43786347481/job 133034732324: three tests of `merge_tv_snapshot`/catalog matching unexpectedly called the remote TMDB metadata helper when the Actions secret was present; response added poster/runtime fields and broke local-only expected output. PR #870 stubs that external boundary in those unit tests; production TMDB code is unchanged. Separate test-only reliability fix.
- Last update-movies run 43784784850 stopped before collection because the source-proof receipt was stale; it wrote no JSON and made no DB call. #868 resolved the receipt gate. No updater overlap is active. After #869 final-head CI passes, allow exactly one normal push-triggered update-movies run; never manually dispatch or retry.
- Separate now-playing snapshot failure: run 43786347481 passed observation but failed its validated snapshot publish step; job log shows only Python test errors above, not a precise publish exception yet. Inspect the end-of-job error after the test PR and classify/fix independently.
- No user data or backups changed. No paid API, scraping, manual deployment, or quota workaround.
