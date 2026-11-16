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
- #870's test-only patch passed its Python suite and was consolidated into #871 so its source digest is covered with the workflow change. #870 is closed as superseded. #871 source commit before this checkpoint: `c5db137a082062d4687cb4ed55ba7f299964b40a`. It adds the proof file as an existing updater push trigger and mocks TMDB only in three local tests. Production TMDB behavior is unchanged.
- #871's exact CI is running on the latest docs head. First require it green; then write proof receipt `head_sha` = tested source commit c5db137 with the digest printed by the exact gate; run all required checks again on the final PR head. Merge only after all current-head checks pass. On merge, the proof path triggers one normal update-movies run; no manual dispatch or retry loop.
- After that one run, verify per-title resolver results, public JSON count, backend sync outcome, READY deployment and real calendar card/image rendering. Keep #244 open until all pass.
- Watch history, ratings, reviews, bookmarks and backups are untouched. No paid service, scrape, deployment bypass, or quota workaround.


## Live checkpoint — 2026-11-16 02:21 UTC (authoritative)

- Live main is `bf502c0e5e474d32f5e15e406f223cc942ca093b`. Issue #593 remains closed/completed: public production JSON is HTTP 200 with 1,808/1,808 by-year poster rows and 100/100 all-time rows. Issue #244 is open/reopened; its production acceptance is still unmet.
- Only open PR is #871, branch `fix/trigger-update-after-source-proof-20261116`. Exact source head `aaa160a2b79c8e62e363f3d5432e2fd8fb3736ea` has verifier-compatible digest `616cfe9735e0af4a2ebcfdb994bb39f14b7be06d8ef9eda1fc2219fd6288b028` over 1,399 relevant source entries. All seven required workflows succeeded (runs 43790546117, 43790545949, 43790546037, 43790545998 plus visual/mobile/completeness 43790545903/43790545948/43790545955); full Python contract run 43790546151 also passed. Across eight workflow runs, all 19 jobs succeeded. The WebKit offline-provider timeout was corrected by making the fixture use one deterministic route with explicit offline state; assertions remain intact.
- A checkpoint-only proof/docs commit now follows on the same PR. Its source digest is unchanged because the proof and docs paths are excluded from the executable-source digest. Run exact-head required CI again on that final PR head before merge.
- Public streaming JSON is HTTP 200, 457 rows, generated `2026-11-15T08:42:39.808Z`. Six officially announced works remain absent: Steps (Netflix 2026-11-20), In Waves (Netflix 2026-12-11), Ray Gunn (Netflix 2026-12-18), Proxies (Netflix 2026-12-11), Secrets (Netflix 2026-12-03), and ミニオンズ＆モンスターズ (U-NEXT 2026-11-11). Their source-reviewed entries are present in the 71-row announcement intake; no official RSS/Atom feeds are confirmed and all 12 services have auto-premiere discovery disabled. Do not invent TMDB IDs or posters.
- The normal updater run 43788084251 stopped at the exact-source proof gate before collection; import, TMDB resolution, JSON write, and Neon sync were skipped. Vercel production attempt dpl_H232... on bf502 is ERROR for the same proof mismatch. Previous READY production dpl_F81... on SHA 0877129e remains the public source. No manual dispatch/deploy or repeated DB attempt.
- After #871’s final exact-head CI passes, merge only if main is still bf502c0. The proof receipt path then triggers exactly one existing push-based update-movies run. Inspect each title’s identity result, public streaming JSON delta, Neon sync, Vercel READY deployment and actual calendar card/poster. Keep #244 open until these gates pass.
- User watch history, rating, review, bookmark and backup data are unchanged.


## 2026-11-16 02:48 UTC — Official streaming import checkpoint

- Latest main data commit: `8229b678b9c0730a5d412305fd4138a3d844d2e4` (official update-movies snapshot). PR #871 and its exact-source release receipt are already merged; open PRs: 0. Exact-source receipt still describes executable head `aaa160a2b79c8e62e363f3d5432e2fd8fb3736ea`; all seven release-required workflows and full contract suite passed there. Main since then has data-only commits.
- #593 remains closed. Main and canonical Vercel box-office JSON each contain 1,908 rows across `all_time` + `by_year`; all 1,908 have posters. Vercel returns HTTP 200 and its generated date is 2026-09-27.
- #244 remains open. The existing official updater run [43793292311](https://github.com/vongolebianco7/cinema-calendar/actions/runs/43793292311) added six verified announcements to the main catalog. Five resolved to distinct TMDB IDs with posters. `Proxies` remains without an ID/poster because TMDB title candidates are ambiguous. Main streaming JSON is 463 rows / 1 missing poster; canonical Vercel is still 457 rows (generated 2026-11-15) and does not include the six-item batch.
- The updater’s official import, provenance/compliance gates, TMDB enrichment, data validation and JSON snapshot completed. The final Neon sync failed once with Prisma P1001 at `ep-snowy-wave-b4gwato2.c-6.us-east-2.aws.neon.tech:5432`; do not retry until the endpoint state changes. No user records were modified.
- GitHub Pages build/deploy [43793646553](https://github.com/vongolebianco7/cinema-calendar/actions/runs/43793646553) succeeded on `8229b678`. Its direct public URL/JSON was not independently confirmed in this run. Vercel’s canonical alias `https://cinelva.vercel.app/` remains READY on `f7c964a72b605693bc08bc24c4f855bc9463e566`, but the JSON is stale; no manual deploy was attempted, preserving Hobby limits.
- Source audit still records 0 confirmed official RSS/Atom feeds and 0 of 12 services with approved automatic premiere discovery. These six were manually curated from official provider announcements; no scraping or unsupported automation is claimed.

Next: establish which published origin is the actual canonical user-facing site and confirm its public JSON/UI; inspect the Vercel proof gate and observable Hobby usage before considering one planned release; review permitted official feed sources and pursue `Proxies` only with a unique TMDB identity. Do not repeat the updater or Neon call. Keep #244 open until production JSON and calendar cards/images are verified. Watch history, ratings, reviews, bookmarks and backups remain untouched.


## Documentation checkpoint PR

The live-state documentation update is in [PR #872](https://github.com/vongolebianco7/cinema-calendar/pull/872). It refreshes the current main/production comparison and records the post-import Neon blocker. Check the PR page for its latest head SHA, require exact-head CI, merge only if all required checks pass, and do not trigger an application deployment from this documentation-only PR.


## Live checkpoint — 2026-11-16 03:06 UTC

- Current main is `8229b678b9c0730a5d412305fd4138a3d844d2e4`. Open issues are #239, #242, #243, #244, #585 and #683; #593 is closed after public production JSON reached 0 missing posters.
- Box-office proof was freshly re-fetched: main and canonical Vercel production each return HTTP 200 with 1,908 rows across all-time/by-year and 0 missing posters (generated 2026-09-27).
- #244 data import is in main: 71 official-announcement intake records are all represented in the 463-row main streaming catalog. Five of the six newly imported announcements have distinct TMDB IDs and posters; Proxies has no poster because identity is unresolved. Main has 462/463 posters.
- The canonical Vercel streaming JSON is still 457 rows (generated 2026-11-15T08:42:39.808Z) and does not show the six new titles. On `https://cinelva.vercel.app/streaming.html`, Chrome displayed 90 theatrical and 3,047 streaming-provider entries; none of the six new announcements appeared. The page update label read 2026/11/16 7:50:37. Image sample: 122 present, 17 complete, 0 broken, 105 pending/lazy. This is partial observation, not complete image acceptance.
- Existing update-movies run [43793292311](https://github.com/vongolebianco7/cinema-calendar/actions/runs/43793292311) committed the six entries but exhausted its TMDB request budget (180/180) and failed once at final Neon sync with Prisma P1001. No retry, no manual dispatch, and no user data was changed.
- Official feed inventory remains 0 confirmed RSS/Atom feeds; 12 services have auto-premiere discovery disabled. Targeted newsroom search of Netflix, Amazon Japan, U-NEXT and Hulu found no confirmed approved feed endpoint; this does not establish that no such feeds exist. No source was enabled.
- Documentation PR [#872](https://github.com/vongolebianco7/cinema-calendar/pull/872), exact head `401e4f94d2c399dc3efc66182b3c9b1baf5e8870`: four GitHub Actions passed (runs 43794843140, 43794843095, 43794843071, 43794843044). Separate Vercel backend status failed with “Deployment rate limited — retry in 24 hours” at 2026-11-16T02:53:22Z. Canonical production remains READY on old source `f7c964a72b605693bc08bc24c4f855bc9463e566` / deployment `dpl_8C9oBim8Cvnuiu33gTnjGB6XEpDn`. No paid upgrade, bypass, or retry.
- Netflix’s official announcement confirms Proxies date 2026-12-11, director Oriol Paulo and cast, but the official TMDB search was blocked/unavailable and the updater budget is spent. Do not guess the TMDB identity/poster.

### Next action

Keep #872 open. Continue reviewing official-provider source pages for a permitted feed without scraping; leave the registry unchanged until a documented endpoint and terms are confirmed. Resolve Proxies only through the existing official TMDB workflow at its next scheduled allowed run. Wait until Vercel reports the rate limit cleared before rechecking its status; then make one planned normal release and verify the public JSON plus rendered cards/images. Keep #244 open until canonical production data and full browser image acceptance pass. Watch history, ratings, reviews, bookmarks and backups remain untouched.


### Live checkpoint — 2026-11-16 03:23 UTC

- Live main remains `8229b678b9c0730a5d412305fd4138a3d844d2e4`. Issue #593 is closed and has not regressed: main and canonical production box-office JSON are HTTP 200, 1,908 rows, 0 missing posters. #244 remains open. The only open PR is #872; its parent head is `193bae2b9417edd6a705c40f52f4cb342fd2ddd0`.
- Main streaming JSON is HTTP 200 with 463 rows, 462 posters, generated `2026-11-16T02:37:34.045085+00:00`. Canonical production is HTTP 200 with 457 rows, all postered, generated `2026-11-15T08:42:39.808Z`. Six official records are in main but absent in production; five have unique TMDB IDs/posters: ミニオンズ＆モンスターズ 1315772, Steps 1595124, Secrets 1616675, In Waves 947502 and Ray Gunn 940009. Proxies remains unresolved. This is a real main-data improvement, not production acceptance.
- Update-movies run [43793292311](https://github.com/vongolebianco7/cinema-calendar/actions/runs/43793292311) committed its validated JSON snapshot after importing six source-reviewed announcements, then failed only at the final Neon sync with Prisma P1001 at `ep-snowy-wave-b4gwato2.c-6.us-east-2.aws.neon.tech:5432`. No retry; user data and backups were not changed.
- Netflix’s own Spanish newsroom calls Proxies **En nombre de otro** and confirms the 2026-12-11 premiere. This is a safe search-alias lead only. The current resolver prefers `original_title: Proxies` over its alias table; a small follow-up should prioritize the reviewed Spanish alias for the API search and keep the exact title + 2026 release-year check. Official TMDB search was blocked by robots; no ID/poster is assigned. Source: https://about.netflix.com/es_es/news/oriol-paulo-returns-to-netflix-with-proxies-premiering-on-11-december
- Official-feed audit: `data/streaming-official-feeds.json` remains empty and all 12 services keep automatic discovery disabled. Apple TV Feed is a real bulk catalog feed but its official docs require Apple Services Performance Partners Program membership; CINELVA has no approved access. Do not enable it. Official docs: https://developer.apple.com/jp/documentation/appletvfeed/
- Exact #872 head `193bae2b9417edd6a705c40f52f4cb342fd2ddd0` has successful latest quality, smoke, mobile-layout and visual-QA workflows (43796396608, 43796396566, 43796396563, 43796396569). The Vercel backend status is success on this docs-only head; it did not publish the newer main JSON. Current canonical READY remains `dpl_8C9oBim8Cvnuiu33gTnjGB6XEpDn` on source `f7c964a72b605693bc08bc24c4f855bc9463e566`.

### Next actions

1. Run exact-head checks for the updated checkpoint and merge only if they are green.
2. Implement a focused resolver regression for the verified Spanish title, preserving exact-title/year identity gates. Use the next existing update-movies schedule; no manual dispatch and no guessed TMDB identity.
3. Keep #244 open until a proof-valid main release is READY, production JSON contains the new items, and browser acceptance sees the real cards/posters. Do not retry Neon or start a manual Vercel deployment.


## 2026-11-16 03:29 UTC — Proxies alias regression and live acceptance

- Re-read live main `8229b678b9c0730a5d412305fd4138a3d844d2e4`, #239, #244, #593, open PRs, latest Actions, workflow schedule, and current public JSON. #593 remains closed; main and canonical production box-office JSON are 1,908 rows with 0 poster gaps.
- Main streaming JSON: 463 rows, 462 posters; only `Proxies` has no poster/TMDB identity. Canonical `https://cinelva.vercel.app/data/streaming.json` was fetched again (HTTP 200): 457 rows, 457 posters, generated 2026-11-15. The six official announcements present in main remain absent from production.
- Netflix’s official Spain newsroom identifies `En nombre de otro` as the Spanish title and confirms the 2026-12-11 release. Added it as a search alias only. The resolver now prefers the reviewed alias over literal `original_title: Proxies`; it still writes identity/artwork only for one exact normalized TMDB movie title with release year 2026. Added a mocked regression with a same-year literal-title decoy. No ID/poster is assigned from title intuition.
- Code and regression are in the already-open PR #872; no duplicate PR. Exact-head checks for the new source are pending. The branch’s previous docs-only head passed smoke, mobile and visual QA; quality gate was still running when this update began.
- Vercel main status presently includes `build-rate-limit`; canonical production remains on an older READY deployment. Keep Hobby and do not manually deploy. Update-movies run 43793292311 committed validated JSON but failed once at final Neon sync with P1001; no retry. Official feed registry still has no approved automatic feeds.
- Next: let exact-head Actions finish; the scheduled update-movies cron is `17 18 * * *` UTC (18:17 UTC daily). After exact-head code passes and normal release proof permits publication, verify the new items in public JSON and their actual calendar cards/posters. Keep #244 open until those production checks pass and source-coverage acceptance is complete; user data and backups remain untouched.


## 2026-11-16 04:02 UTC — Exact checks green; production gate still blocked

- Latest main is `8229b678b9c0730a5d412305fd4138a3d844d2e4`; Issues #239/#244 are open, #593 remains closed. The only open PR is #872.
- Exact PR source `23f48d7f67e59e618a27b0a3b593f806acdbe341` passed all eight GitHub Actions: Validate frontend `43798855957`, visual QA `43798855956`, Autonomous quality `43798855949`, Full Python `43798855947`, completeness `43798855883`, smoke `43798855881`, reproducible backend `43798855820`, and mobile layout `43798855819`. The mocked same-year decoy regression was included in the Python suite.
- Production JSON re-fetch: boxoffice HTTP 200, 1,908/1,908 posters; streaming HTTP 200, 457/457 posters (0 gaps), generated 2026-11-15. Main streaming is 463/462; the only unposterized record is Proxies. The six reviewed official announcements in main remain absent from production.
- Current canonical READY deployment is `dpl_8C9oBim8Cvnuiu33gTnjGB6XEpDn` on `f7c964a72b605693bc08bc24c4f855bc9463e566`. Main Vercel frontend/backend statuses still fail with `build-rate-limit`; no manual deployment or quota workaround. Existing update run `43793292311` has the JSON snapshot but one final Neon P1001 failure; no repeat attempt.
- PR #872 remains open. GitHub branch-protection API returned 403 to the connected integration, so the Vercel status's requiredness cannot be checked; do not merge around a failing release status. Code source `d88d523` passed exact-head GitHub Actions on PR head `23f48d7`.
- Next: recheck the Vercel status and public JSON after the provider limit clears. Use only the standard merge/release path, then the next scheduled update-movies run for the official TMDB alias and verify actual production calendar cards. No TMDB identity is guessed; user data/backups remain untouched.


## Live checkpoint — 2026-11-16 04:16 UTC

- Re-fetched main `8229b678b9c0730a5d412305fd4138a3d844d2e4`, issues #239/#244/#593, open PRs, Actions, Vercel and public JSON. #593 is closed; production boxoffice is HTTP 200, 1,908 rows, 0 posterless. #244 remains open. Only PR #872 is open.
- Public streaming JSON is HTTP 200 with 457 rows / 457 posters (generated `2026-11-15T08:42:39.808Z`). Main streaming has 463 rows / 462 posters; the single unresolved row is Proxies. Six official announcements in main remain absent in production.
- On exact PR head `81efe523286a590027aea4c867c9f306787689b6`, seven checks passed. Validate frontend attempt 1's Chromium/WebKit and product checks passed, but the comparative performance step failed on `git fetch` HTTP 503 from GitHub. A single targeted job retry is running as attempt 2; do not start another full rerun.
- Vercel's latest bot result is `api-deployments-free-per-day` (>100 deployments), with “try again in 1 day” at 2026-11-16 02:53 UTC. Canonical production remains READY on older SHA `f7c964a72b605693bc08bc24c4f855bc9463e566`. No manual deploy, paid plan, quota workaround, or merge around the release blocker.
- Official source check: Netflix newsroom supplies individual announcement pages, not a verified public catalog feed; Prime Video mRSS is for partner content delivery into Prime Video and its APIs are managed-partner-only; U-NEXT help documents its customer-facing catalog and does not grant ingestion API/feed access. Approved public feeds remain 0. Sources: https://videocentral.amazon.com/support/mrss-delivery?language=en_US ; https://videocentral.amazon.com/support/prime-video-apis?language=en_US ; https://help.unext.jp/guide/detail/content-being-delivered-of-vod ; https://developer.apple.com/jp/documentation/appletvfeed
- Updater run `43793292311` committed validated JSON, then failed once at the final Neon sync with Prisma P1001; no retry. Viewing history, ratings, reviews, bookmarks and backups were not modified.
- Next: finish the targeted Validate retry. Keep #872 open while the Vercel rate limit is active. After normal release access resumes, follow the standard release and scheduled updater path, then verify new IDs/posters in public JSON and actual calendar cards. Keep #244 open until production data and rendered-card acceptance pass.


## Checkpoint validation correction — 2026-11-16 04:20 UTC

- The documentation refresh initially marked the PR work item `ci_pending`, which the repository's durable-state validator does not permit. Exact-head Python test `test_checkpoint_is_valid` correctly failed on that schema mismatch.
- Corrected the item to allowed status `in_progress` in the following checkpoint commit. Re-run the exact-head suite and confirm `test_checkpoint_is_valid` passes before considering the receipt current.
- No application or user data changed. Vercel remains blocked by the documented daily deployment limit; do not deploy/merge around it.


## Live continuation checkpoint — 2026-11-16 04:34 UTC

- Re-read live main `8229b678b9c0730a5d412305fd4138a3d844d2e4`, Issues #239/#244/#593, the only open PR, exact-head Actions, updater workflow schedule, Vercel production, public JSON, and both operation checkpoint files. #593 is still closed.
- Public production boxoffice JSON is HTTP 200: by-year 1,808 rows with 0 missing posters; all-time 100 rows with 0 missing posters (generated 2026-09-27). Main boxoffice has the same counts.
- Main streaming JSON: 463 rows, 462 with posters. Only Proxies is unresolved. The six official announcement records in main are Minions & Monsters, Steps, Secrets, In Waves, Proxies, and Ray Gunn; five have distinct TMDB IDs/posters. Public production streaming JSON remains HTTP 200 at 457/457 postered, generated 2026-11-15T08:42:39.808Z, and contains none of those six. This remains a production data gap; no new card is accepted as live.
- PR #872 at exact head `55db68fc114ce54b6d9e9c849b4dfffe3420b5fb` adds Netflix Spain's official alias `En nombre de otro` for Proxies, prioritized over the literal title in poster lookup, while preserving strict exact normalized TMDB title + 2026 release-year matching. Regression includes a same-year literal-title decoy. Netflix official announcement: https://about.netflix.com/es_es/news/proxies-is-coming-to-netflix-on-december-11 . TMDB official search is blocked in this environment; no ID/poster was guessed.
- Exact-head Actions are 8/8 green. Validate frontend run 43803389009 attempt 1 timed out at the unchanged provider-list offline test line 46; one targeted retry (attempt 2) passed. Seven other workflows passed.
- Canonical Vercel remains READY at `dpl_8C9oBim8Cvnuiu33gTnjGB6XEpDn`, SHA `f7c964a72b605693bc08bc24c4f855bc9463e566`. New deployments hit Hobby's `api-deployments-free-per-day` limit (>100/day; error at 2026-11-16 02:53 UTC). No manual deployment, upgrade, bypass, or merge around the failing release gate.
- Existing update-movies run 43793292311 committed the validated six-entry JSON snapshot to main; its final Neon direct sync failed once with Prisma P1001. No retry. No update-movies run is active; the existing cron is `17 18 * * *` UTC. Do not dispatch manually.
- User viewing records, ratings, reviews, bookmarks and backups remain untouched. No scraping or paid sources enabled; official public RSS/Atom catalog feeds confirmed: 0.

### Next concrete actions

1. Require exact-head CI for this checkpoint update; leave #872 open while Vercel's normal Hobby rate limit blocks release.
2. After the normal release gate clears, make only one standard release and let the existing scheduled updater run once on the approved path. Do not repeat the Neon sync.
3. Confirm Proxies only if the official API returns one exact title/year identity; then re-fetch production JSON and verify the actual streaming calendar cards and images. Keep #244 open until this production acceptance is complete.


## Live production acceptance checkpoint — 2026-11-16 04:46 UTC

- Live main: `8229b678b9c0730a5d412305fd4138a3d844d2e4`. #593 remains closed: production boxoffice HTTP 200, 1,808 by-year rows + 100 all-time rows, 0 missing posters. #244 remains open; only open PR is #872 at `6486cff7e420bf2a25ad90cb5254558d8eb832ed`.
- Public streaming JSON: HTTP 200, 457 rows / 457 posters, generated `2026-11-15T08:42:39.808Z`; six reviewed official announcements remain absent. Main streaming JSON: 463 rows / 462 posters; only unresolved poster is Proxies.
- Inspected the live production streaming page in Chrome. Searching `Proxies` returned 0 works. The page itself reports 90 theatrical and 2,783 current streaming-provider items. This confirms the new announcement is not yet presented in the user-facing current-streaming search; it is not a passing acceptance.
- PR #872 exact head `6486cff7e420bf2a25ad90cb5254558d8eb832ed`: seven workflows passed; Validate frontend still has its reported-regression Chromium/WebKit subjob running. Do not merge until all required checks on the final head are green.
- Canonical Vercel production stays READY on `f7c964a72b605693bc08bc24c4f855bc9463e566`; new deployment is blocked by Hobby's daily cap. Existing update-movies run `43793292311` committed main JSON but failed once at final Neon sync with Prisma P1001. No retry or manual dispatch.
- No guessed TMDB ID/poster. No user history, rating, review, bookmark, or backup mutation. No paid service, scraper, or quota workaround.

### Next action

Finish the exact-head Validate job, leave #872 open while deployment quota blocks a normal release, and after the cap clears use one standard release plus the existing scheduled update workflow. Re-fetch public data and verify the actual card/poster before advancing #244.


## Live checkpoint — 2026-11-16 05:07:58 UTC

- Live main is `8229b678b9c0730a5d412305fd4138a3d844d2e4`. Open issues: #239, #242, #243, #244, #585, #683. #593 remains closed.
- Canonical boxoffice JSON was fetched again: HTTP 200, generated `2026-09-27`; 1,808 by-year rows and 100 all-time rows, zero missing posters in either set.
- Streaming JSON comparison by title + service + TMDB identity: main 463 rows / 462 posters; production 457 / 457 posters, generated `2026-11-15T08:42:39.808Z`. These six main rows are absent from production: `ミニオンズ＆モンスターズ` (U-NEXT), `Steps`, `Secrets`, `In Waves`, `Proxies`, `Ray Gunn` (Netflix). Five have their verified TMDB ID/poster in main; Proxies still lacks an ID/poster.
- PR #872 source head `1b7142e530f1bab7e2aa89c238c95c71bcc05c3c` has all eight GitHub Actions successful (runs 43805855435, 43805855531, 43805855445, 43805855462, 43805855491, 43805855476, 43805855466, 43805855478). Its Vercel backend check is still failing; main frontend/backend statuses also fail with `build-rate-limit`. Canonical production remains READY on old SHA `f7c964a72b605693bc08bc24c4f855bc9463e566` / deployment `dpl_8C9oBim8Cvnuiu33gTnjGB6XEpDn`. Do not merge/deploy around the failed release gate.
- Netflix’s official source confirms Proxies’ alias `En nombre de otro`, director Oriol Paulo and global release date 2026-12-11: https://about.netflix.com/es_es/news/proxies-is-coming-to-netflix-on-december-11 . TMDB movie pages are blocked by robots in this environment; the official API identity remains unverified, so no ID/poster is invented.
- Latest official update-movies run `43793292311` committed its JSON snapshot but failed once at the final Neon sync (Prisma P1001). No retry or manual dispatch. Last recorded updater state was idle; next cron is `17 18 * * * UTC`.
- No user watch history, ratings, reviews, bookmarks or backups changed. No paid source, scraper, or quota workaround was used. The prior approved-feed inventory recorded zero confirmed public RSS/Atom catalogs and discovery disabled for 12 services.

### Next action

Keep #872 and #244 open. Require fresh exact-head CI after this documentation checkpoint; leave the release blocked until the normal Vercel Hobby limit clears. Then make one standard release only, allow the existing scheduled updater to run normally, and verify the production JSON and actual streaming cards/images. Do not retry Neon or dispatch the updater manually.


## Live checkpoint — 2026-11-16T06:15:37Z UTC

- Live main: `8229b678b9c0730a5d412305fd4138a3d844d2e4`. Issue #593 remains closed. Canonical Vercel box-office JSON HTTP 200: 1,808/1,808 by-year rows and 100/100 all-time rows have posters (0 missing).
- Issue #244 remains open. Main `data/streaming.json` is generated at `2026-11-16T02:37:34.045085+00:00`, 463 rows / 462 posters. All six manually reviewed official announcements are in main; five have verified TMDB identities/posters. Proxies remains without a verified TMDB identity/poster. Canonical production streaming JSON is HTTP 200, generated `2026-11-15T08:42:39.808Z`, 457 rows / 457 posters; the six additions have not reached production.
- PR #872 remains open. Exact head `759652a234efcfa8be9119d13a5f7532b0ef8ef3` passed all eight Actions (43808248743, 43808248752, 43808248785, 43808248806, 43808248859, 43808248866, 43808248807, 43808248881). The branch has since received an operations checkpoint commit; re-fetch exact-head Actions before any merge. Combined Vercel statuses still fail with `build-rate-limit`. Canonical production stays READY on old SHA `f7c964a72b605693bc08bc24c4f855bc9463e566` / `dpl_8C9oBim8Cvnuiu33gTnjGB6XEpDn`.
- Existing updater run `43793292311` imported/validated official announcements, resolved unique TMDB identities, validated and committed the JSON snapshot to main. Only the final Neon direct sync failed with Prisma P1001; no retry or manual dispatch.
- Official Netflix announcement verifies Proxies / `En nombre de otro`, director Oriol Paulo and 2026-12-11. The official TMDB identity remains unavailable here; no ID/poster was invented. The provider registry has 0 confirmed public catalog RSS/Atom feeds and all 12 provider auto-discovery flags remain disabled.
- A documentation tree commit briefly created a deletion-heavy diff on PR #872 due a missing base-tree parameter. It was inspected before merge and reverted with a force-with-lease to the verified parent `759652a`; main, production and user data were untouched. Subsequent docs are being updated through the GitHub Contents API, which preserves the full repository tree.
- Watch history, ratings, reviews, bookmarks and backups remain untouched. No scraping, paid service, Vercel quota workaround, manual updater dispatch, or repeated Neon attempt.

### Next concrete actions

1. Fetch PR #872's new exact-head Actions after the checkpoint updates; do not merge while Vercel's release check fails.
2. Recheck the Vercel Hobby build limit on a later run and release only through the normal path after all exact-head checks are green.
3. Let the existing scheduled updater run normally once after release, then verify all six canonical production JSON entries, the Proxies identity/poster result, calendar cards and image requests. Do not dispatch manually or repeat Neon sync.
4. Keep #244 open until permitted source coverage, freshness, error retention, public data and production rendering all meet the issue's completion criteria.


## Live checkpoint — 2026-11-16 09:23 UTC (authoritative)

- Current main is `1717965d5e6a000e1a97948e64237c6366076764`. Issue #593 is closed/completed. Production boxoffice JSON is HTTP 200: 1,808 by-year and 100 all-time rows, with no posterless rows.
- Issue #244 remains open. Streaming production moved from 457/457 posters (2026-11-15) to 463/463 (2026-11-16), six added rows and no removals; generated at `2026-11-16T08:05:29.780681+00:00`. Existing scheduled refresh run `43828393897` succeeded, and latest production deployment `dpl_3zN7iLYSBC59aFCsksxSk1keKmDM` is READY on main.
- The six live rows are Minions & Monsters (U-NEXT), Steps, Secrets, In Waves, Proxies, and Ray Gunn (Netflix). All have poster URLs; five have explicit TMDB IDs. Proxies has `fuzzy_search_fallback` and no TMDB ID; do not treat the image as an identity match. PR #872 adds an official Spanish-title alias with strict exact-title/year/unique-result checks, but the API result still needs the normal scheduled run.
- U-NEXT’s official November lineup was audited: listed films are present. Ballerina (Nov 18) has TMDB ID 541671 and a poster. Trenque Lauquen Part 1/2 have posters but no explicit TMDB IDs; do not infer identity. Source: https://www.unext.co.jp/ja/press-room/2026-11-unext-lineup.
- Source registry remains 0 confirmed public RSS/Atom feeds; all 12 service auto-premiere flags are false. Manual official-announcement intake is not automated discovery.
- PR #872 old exact head `96a31be3a7646f3f6d1d137b44a8f8636fded89f`: 8/8 Actions and Vercel backend status success. PR #873 exact head `ca277758491a5ea28f1fcfd2132fd57e1c1aed7d`: 9/9 Actions but Vercel backend status `build-rate-limit`; source-link UI is not production-deployed. Current main deployment is READY, but do not bypass the failing PR gate.
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
