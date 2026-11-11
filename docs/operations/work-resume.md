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
00ec6b2bf418ffe96e3eb69bfa59a72d8cd0ef75

## 2026-11-11 P0 resume checkpoint

- Latest main is `f83530426aebd27baf27093b9964af28c29a04e3`. PR #796 was squash merged with the empty-poster image fix, stricter production poster acceptance (detects images without a src), safe TMDB alternative-title matching, and the #795 Neon direct-connection sync fix. PR #795 is closed as included in #796.
- PR #796 exact source `94970b7b2fb0e6f84ff133e910922a75a6b2ea77` passed all 4 required workflows and the listed extra checks; full local quality gate passed (584 Node tests, 18 focused tests). Its Vercel preview was READY.
- Main production deployment `dpl_EzfkQh2yGCkpoqpfhuYencddbBqW` failed at the source-bound publication gate, not at quota. Main executable-source digest is `02898cf0810a7ca7022fab1741256884f0f3e61632386d6bde12b7244b9469fe`; old receipt at `c0151084f048c0ae7911bcf13a3156595dd712ba` verifies a different source. Do not weaken or bypass the gate.
- Previous production counts: boxoffice 1,383/1,647 (264 missing; +499 vs 884 baseline), streaming 430/457 (27 missing), TV 20/23 (3 missing), movies 1,356/1,383 (27 missing), now-playing 88/89 (1 missing), theatrical 926/926, directors 9,980/10,673 (693 missing). Chromium had zero HTTP failures for images with URLs, but 3 ranking cards rendered empty image src. These are last measured before #796 production publication; not new post-merge counts.
- #593 and #244 remain open; #244 remains queued behind #593. No additional production poster recovery is counted yet. No official data/backfill workflow has been rerun after merge.
- Next exact operation: make a docs-only checkpoint PR from this main so required PR workflows attest to the current executable-source tree; after they pass, update `quality/production-proof.json` to that verified PR source SHA (receipt excluded from executable digest), run its required workflows, merge once, then allow only the merge-triggered frontend/backend production deploy. Recount public routes and data after READY. Dispatch the post-deploy Chromium/WebKit poster acceptance once; retain physical iPhone Safari as a separate unverified acceptance item.
