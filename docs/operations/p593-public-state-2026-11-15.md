# Issue #593 public data checkpoint — 2026-11-15

This checkpoint records the public state after PR #856 was merged. It does not close Issue #593.

## Measured public JSON

Source: [GitHub Pages boxoffice.json](https://vongolebianco7.github.io/cinema-calendar/data/boxoffice.json), fetched in Chromium on 2026-11-15.

- HTTP response: 200
- `by_year` entries: 1,811
- Rows with a non-empty `poster` field: 1,811 (literal blank-field count: 0)
- `poster_match_status=matched`: 1,770
- `poster_match_status=fuzzy_related_title_or_screening_group`: 41
- `generated_at`: 2026-09-27

The literal blank count is not a valid completion signal by itself. The 41 fuzzy/group fallback rows are not confirmed title-to-film matches. At least one public row, `騎士竜戦隊リュウソウジャー THE MOVIE` (market year 2019), still carries a poster URL also used by a different Kamen Rider row while its status is `fuzzy_related_title_or_screening_group`. That is evidence of a sibling-image fallback, not a verified poster. Do not count these rows as recovered until their own identity and poster are confirmed or the row is represented without a misleading image.

## Change already merged

- PR #856 merged as [`c436a3662ff060c465ef444439f1246f50ac0ebb`](https://github.com/vongolebianco7/cinema-calendar/commit/c436a3662ff060c465ef444439f1246f50ac0ebb).
- It adds source-reviewed fragment identities and group reconciliation to the existing `scripts/backfill_boxoffice_posters.py`.
- Confirmed multi-film fragments remain separate by actual film identity; shared source gross is retained on each row. Sibling posters are not transferred as a match.
- The existing daily lookup cap (100) remains unchanged. No duplicate backfill implementation was added.
- GitHub Pages build/deploy run 43718831843 succeeded, but it deployed the existing snapshot; the JSON above still has `generated_at=2026-09-27`.

## Release gate and next safe action

- Main's `quality/production-proof.json` still references tested source `5630ebdd4574ec2613aaa54ca1898fdcf5887c8b`; current executable source has changed since then. The existing `update-movies.yml` begins with `check_sources.py` and `verify-production-release.cjs --require`, so the scheduled updater must not be dispatched until this source is re-verified and the receipt is refreshed.
- This documentation-only checkpoint PR is intentionally being used to run the four required exact-head CI workflows against the current main source. If those checks pass, refresh the receipt through a follow-up receipt-only commit that references the successful tested source head. Do not bypass the gate.
- After the next scheduled official update completes, re-fetch the public JSON and verify actual resolved rows, distinct per-film TMDB IDs/posters, unchanged shared grosses, and the production page image render. The next updater run must not overlap another database writer.
- Preserve all user watch history, ratings, reviews, and bookmarks. Do not change or write user storage.
- Keep #593 open and #244 untouched until public data and production acceptance meet the requested standard. Keep Vercel on Hobby; no paid upgrade or manual deploy.

Evidence:
- PR #856 and merged code: https://github.com/vongolebianco7/cinema-calendar/pull/856
- Public data: https://vongolebianco7.github.io/cinema-calendar/data/boxoffice.json
- Required update gate: https://github.com/vongolebianco7/cinema-calendar/blob/main/.github/workflows/update-movies.yml
