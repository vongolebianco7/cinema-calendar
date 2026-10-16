# Cinelva branded URL release — 2026-10-16

- New public URL: https://cinelva.vercel.app/
- Retained production/fallback: https://vongolebianco7.github.io/cinema-calendar/
- Existing Vercel frontend project: cinema-calendar, prj_BPmpSaJmKfVDQpVWOFKaoXHS1eeD, vongole1.
- Initial source: main 96109f0d0a48a30b811bb519d21834f48a229c2d. The verified automatic Git release is main 87300d991440d466d724d714f166cb91a8c9c7c8; no unrelated development branches merged.
- Preview dpl_G1Xx6k7caifMBmXGv358NiTcZN7S reached READY and rendered Cinelva before production.
- Production dpl_6YU4nkncJnQkiFHJtv5cCSqgg8o9 reached READY. The branded alias is verified and attached to this project.
- Anonymous HTTP requests returned the app directly. Calendar, discovery, rankings, theaters, critic, My Cinelva, backup, manifest, backup module, backend config and original graphic matched reviewed main bytes.
- The new-origin browser rendered calendar, My Cinelva, and backup/restore. Backend health returned 200 with wildcard CORS. This does not replace a full feature regression or real iPhone Safari test.
- User billing response reports active Hobby, no trial, and excess billing disabled. No paid service, plan upgrade, paid API, or new billing credential was introduced. Hobby exhaustion can pause service rather than guarantee availability.

## Data preservation

No automatic redirect, storage rewrite, or deletion. Local storage is separate between the two hosts. On the same browser that holds the original records, save JSON at the old data-backup.html, then restore at the new data-backup.html. Existing destination keys are preserved; lists from two independently edited origins are not merged. Keep the old site and backup until records and Ocean are confirmed.

## Ongoing releases

The root vercel.json enables only main for Git deployment. Public HTML/icons, assets, JS, data and preview files are copied to public; backend, scripts, tests and docs are excluded. Documentation/test-only commits skip the frontend build. Backend has its own root/config and is not modified. Existing GitHub Actions update the same main data files, so Vercel Git integration can deploy those changes without a new token or billable API.

Verified: after all seven PR #225 workflows succeeded, merging main 87300d991440d466d724d714f166cb91a8c9c7c8 automatically created Vercel production deployment dpl_DWEAmGhuxEw2ihFrxKu39QiNaSQa (source=git, READY, alias cinelva.vercel.app). Eight public files matched final reviewed source bytes. The retained GitHub Pages run 38906882504 also succeeded, and four files there matched the final source. Live My Cinelva and backup migration screens were checked. Revert only the hosting configuration to disable automatic releases; the old GitHub Pages URL remains usable throughout.

## Remaining limits

Cloudflare login failed in the cloud browser; no Cloudflare project/domain was created. is-a.dev was not requested because of its application rules and use restrictions. System/light/dark mode is implemented and passed Chromium/WebKit CI in PR #225. Independent trademark clearance and real iPhone Safari testing remain unconfirmed. This release changes hosting and does not resolve pre-existing feature/data-quality issues.

References: https://vercel.com/docs/plans/hobby ; https://vercel.com/docs/project-configuration/git-configuration
