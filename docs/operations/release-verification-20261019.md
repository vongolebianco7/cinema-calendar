# Canonical production verification — 2026-10-19

Canonical URL: https://cinelva.vercel.app/ . Vercel deployment `dpl_CMGesLg49kxQmdVvpfXexPQDZwnh` is READY and explicitly aliases this domain at released SHA `bd6a1c9972434c125128af2f424f3bde9340aabd`.

## Verified evidence

- [#394](https://github.com/vongolebianco7/cinema-calendar/pull/394) integrated director-profile work and passed all15check-runs at `7958f2a90cd19285978bb336818535d3566c3925` before merge `d07eb073`. Node146 and Python133passed. Existing390px Chromium/WebKit tests verify original release metadata, imported canonical IDs, offline review targets, storage and backup behavior.
- [#396](https://github.com/vongolebianco7/cinema-calendar/pull/396) passed all10check-runs at `3193c3b15820251f4d4867026e223552345ae833` before merge `bd6a1c99`. Node147 and Python133passed. The actual static build and29real source HTML pages are covered by the publication regression.
- [Canonical HTTP audit](canonical-http-audit-20261019.json): all29declared routes resolve to200 and exact released HTML bytes. The14nested `cinelva/*.html` routes previously returned404; they now temporarily redirect to their current canonical root pages.
- Actual HTTP307 from `/cinelva/search.html?id=157336&search=test` retains both query parameters. Cloud Chrome verified the actual legacy search URL retains ID, Japanese search term and `#review`, and opens the2014Interstellar detail. Search no longer presents its2026streaming premiere as the film year.
- Actual canonical MyCinelva → search → detail → shared review dialog was exercised. The dialog contains close/save and no next action; no synthetic record was saved. This does not claim a live real-user storage upgrade test.
- All8retired Ocean redirect documents returned200 and exact released bytes. Cloud Chrome verified an old Ocean URL lands on `/my-cinelva/`. CI separately covers8routes ×0/1/1000records in Chromium/WebKit with unchanged saved bytes. Old issues111/113/143 were closed as `not_planned`, superseded by239.
- Deployment boundary tests cover root/backend working directories and actual script execution. The first long command failed Vercel's256character schema constraint; the corrected short command and actual script are tested. Automatic production deployment succeeded; no manual retry or hosting/origin migration occurred.

## Remaining acceptance work

This is evidence for the listed fixes, not completion of every issue239bullet. Real iPhone Safari,5–10independent user tests, complete closed-cinema/source/license coverage, comprehensive external-link checks, and measured layout-shift/interaction performance remain unverified or partial. CI WebKit is not a physical iPhone test. Naming clearance is unchanged.

## Rollback readiness

Keep the canonical origin and all storage keys. For a confirmed route regression, prepare a reviewed PR reverting only the relevant configuration change, run the quality gate, then verify the resulting automatic deployment. `d07eb073` is the prior observed READY release; it has the fixed review/date/schema behavior but lacks14legacy route redirects. Do not revert to `0adf128` or `04d4b3f`, which contain the oversized command. No rollback or user-data rewrite was performed in this verification.
