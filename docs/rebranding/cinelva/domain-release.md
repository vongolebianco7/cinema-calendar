# Cinelva branded URL release — 2026-10-16

- New public URL: https://cinelva.vercel.app/
- Retained production/fallback: https://vongolebianco7.github.io/cinema-calendar/
- Existing Vercel frontend project: cinema-calendar, prj_BPmpSaJmKfVDQpVWOFKaoXHS1eeD, vongole1.
- Current source: main 96109f0d0a48a30b811bb519d21834f48a229c2d; no unrelated development branches merged.
- Preview dpl_G1Xx6k7caifMBmXGv358NiTcZN7S reached READY and rendered Cinelva before production.
- Production dpl_6YU4nkncJnQkiFHJtv5cCSqgg8o9 reached READY. The branded alias is verified and attached to this project.
- Anonymous HTTP requests returned the app directly. Calendar, discovery, rankings, theaters, critic, My Cinelva, backup, manifest, backup module, backend config and original graphic matched reviewed main bytes.
- The new-origin browser rendered calendar, My Cinelva, and backup/restore. Backend health returned 200 with wildcard CORS. This does not replace a full feature regression or real iPhone Safari test.
- User billing response reports active Hobby, no trial, and excess billing disabled. No paid service, plan upgrade, paid API, or new billing credential was introduced. Hobby exhaustion can pause service rather than guarantee availability.

## Data preservation

No automatic redirect, storage rewrite, or deletion. Local storage is separate between the two hosts. On the same browser that holds the original records, save JSON at the old data-backup.html, then restore at the new data-backup.html. Existing destination keys are preserved; lists from two independently edited origins are not merged. Keep the old site and backup until records and Ocean are confirmed.

## Ongoing releases

The root vercel.json enables only main for Git deployment. Public HTML/icons, assets, JS, data and preview files are copied to public; backend, scripts, tests and docs are excluded. Documentation/test-only commits skip the frontend build. Backend has its own root/config and is not modified. Existing GitHub Actions update the same main data files, so Vercel Git integration can deploy those changes without a new token or billable API.

This configuration must pass the repository quality gate and then be observed deploying from merged main before automatic reflection is reported complete. Revert only the hosting configuration to disable automatic releases; the old GitHub Pages URL remains usable throughout.

## Remaining limits

Cloudflare login failed in the cloud browser; no Cloudflare project/domain was created. is-a.dev was not requested because of its application rules and use restrictions. Independent trademark clearance, light mode and real iPhone Safari testing remain unconfirmed. This release changes hosting and does not resolve pre-existing feature/data-quality issues.

References: https://vercel.com/docs/plans/hobby ; https://vercel.com/docs/project-configuration/git-configuration
