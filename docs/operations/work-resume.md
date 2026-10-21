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
