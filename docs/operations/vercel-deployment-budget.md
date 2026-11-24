# Vercel deployment budget

## Audit (2026-11-24)

The latest 100 deployment records returned for this Vercel team were created between 2026-11-22 18:10 UTC and 2026-11-23 05:59 UTC (2026-11-23 03:10–14:59 JST).

| Project / ref | Created deployments |
|---|---:|
| backend | 73 |
| cinema-calendar | 27 |
| main production deployments | 55 (backend 28, cinema-calendar 27) |
| backend preview deployments from non-main branches | 45 |
| READY / CANCELED / ERROR | 69 / 29 / 2 |

The records point to Git commits. Main deployments include repeated generated-data commits such as `Update movie data`, `Refresh nationwide now-playing snapshot`, and `Refresh anime-related movie TV broadcasts`. The backend preview records came from repeated pushes to feature branches, including the VIVANT, calendar, feedback and Filmarks branches.

This burst is consistent with exhausting the Hobby plan's 100 deployments per 24-hour limit, but it does not by itself prove why Vercel returned `resource_creation_blocked`. That error continued after the visible deployment window had passed, so the account-level block still requires Vercel's review.

## Deployment controls

- `cinema-calendar` already disables deployments from all branches except `main` and the explicit demo preview branch.
- `backend` now disables Git deployments from all branches except `main`. Its repeated PR previews accounted for 45 of the latest 100 deployment records.
- Keep production changes grouped into one PR per coherent change and merge once after review. Avoid pushing one small fix per commit when several can be reviewed together.
- Keep scheduled data writers idempotent and commit only when generated content changes. A data update that changes the public application still needs a production deployment.
- Ignored Build Step cancellations are not a deployment-quota control: Vercel documents that these canceled deployments still count toward deployment/concurrent-build limits. Use branch deployment controls to prevent creating unnecessary preview deployments.
- Do not retry production deployments while Vercel returns `resource_creation_blocked`. After Vercel clears the block, deploy the current `main` once and verify the canonical site.

## References

- [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
- [Vercel monorepos: ignored build step and unaffected projects](https://vercel.com/docs/monorepos)
- [Vercel Hobby and general limits](https://vercel.com/docs/limits)
