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

- Latest GitHub `main`: `e8e292251c8b91c4722eaf5805685562653ba233`. PR #757 and PR #756 are merged; PR #759 is open at source `c94d26ed89f7c704afe78e27b8b8d921eda52ce1`.
- All eight listed Actions succeeded on PR #759 source c94d26e, including Chromium/WebKit frontend and visual checks, mobile layout, Python contract suite, backend build, quality gate and completeness scorecard. The dedicated calendar browser journey asserts Sirat appears on 11/05, uses the canonical TMDB poster, shows 115 minutes, and links to the Netflix title page.
- Local focused tests (33 Python), `scripts/quality_gate.py`, `scripts/check_release_data.py`, `scripts/check_streaming_coverage.py`, work-state validation and `git diff --check` passed. Local Playwright could not launch because its Chromium binary is not installed; CI browser checks passed.
- Sirat is manually registered from the Netflix Japan 10/29 announcement: TMDB 1151272, film year 2025, runtime 115 minutes, poster retained, Netflix title URL. Netflix's official Japan account announced the 11/5 date; the title page confirms the 2025 title. The current public `streaming.json` generated on 11/08 still lacks Sirat.
- November coverage: 181 cited official-announcement subset rows, 181 registered; 154 matched TMDB identities/posters, 27 poster/identity gaps. This is not an exhaustive census. All 12 premiere-discovery flags are false and the approved feed registry is empty; the daily job refreshes reviewed supplements, not new discoveries. Do not claim automatic discovery is active.
- PR #754 was already merged. PR #756 was merged after all exact-head CI passed. PR #759 has not yet merged; rebase was completed after #756. The initial frontend check found stale expected poster count (4 vs 6 after metadata restoration); the regression test was updated and passed on c94d26e.
- Vercel canonical alias answers HTTP 200 but serves old source `f6cd6c6`; the latest production build for `d0c3c5b` failed closed because current executable source did not match `quality/production-proof.json` (receipt head d4948186). The receipt now points to tested source c94d26e in the pending PR. Do not retry or claim production until the receipt/checkpoint commit passes final-head CI and one automatic deployment is verified.
- Next: confirm final CI on the receipt/checkpoint commit; merge PR #759 if all required checks remain green; verify Vercel READY for the merged source and fetch public `data/streaming.json` to confirm Sirat. #244 and #593 remain open because provider discovery, exhaustive coverage, 27 poster gaps, and physical-device acceptance are not complete.
