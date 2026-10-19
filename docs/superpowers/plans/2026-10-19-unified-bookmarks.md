# CINELVA unified movie operations

Goal: apply the user's four approved operations to every identified film surface, without changing existing record or bookmark data.

Architecture: one local bookmark store retaining `cinelva-want-to-watch-v1`, canonical TMDB identity with legacy local-ID resolution, one shared movie-control renderer. No new service, origin, storage migration, logo or navigation entry. Wanted films remain in the existing dedicated tab beside watched films.

Acceptance: poster/title opens independent detail; range saves directly; eye opens shared review; bookmark toggles independently; same-film controls and tabs synchronize; malformed storage is never overwritten; legacy bookmarks/unknown metadata survive; mobile has no document overflow. All active routes' buttons/icons/save operations must have a source inventory.

- [ ] Add failing bookmark model tests for independence, aliases, legacy preservation, corruption, quota failure and latest storage reads. Implement `CinelvaBookmarks.{all,has,toggle,identity,bind}` in `js/cinelva-bookmarks.js`, load before quick rating on canonical pages.
- [ ] Replace duplicate bookmark writes in quick rating, records and wanted tab. Reuse `CinelvaQuickRate.mountInline` for record/award/wanted/detail surfaces; retain delete as a separate record-only operation. Link posters/titles to detail.
- [ ] Generate source inventory of HTML/JS buttons, icons, handlers and storage writes for all route-manifest entries; document common contracts and applicable surfaces.
- [ ] Run model tests, real browser flows at 390/1280px, quality gate and CI. Confirm cross-page/tab state, unchanged raw records, existing bookmarks, backup compatibility, and shared eye/range controls.
- [ ] Review diff, create PR, await required checks, merge only if green, verify exact released source and production browser behavior. Persist exact blockers if hosting/environment prevents verification.

Review focus: imported local IDs; explicitly invalid TMDB IDs; corrupt bookmark JSON; storage quota exceptions; detached/repeated card rendering and global listener growth. Tests must exercise these conditions. Existing concurrent summary PR is outside this change; preserve its contents when integrating.
