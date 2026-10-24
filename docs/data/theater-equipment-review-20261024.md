# Kanagawa IMAX equipment review — 2026-10-24

The equipment directory has five verified Kanagawa venues. This is equipment coverage, not the number currently screening IMAX films. The former snapshot omitted Yokohama Burg13 entirely from IMAX and mislabeled three 109 venues as unspecified IMAX rather than laser.

| Venue | Reviewed equipment | Official source |
| --- | --- | --- |
| TOHOシネマズ ららぽーと横浜 | IMAX (laser subtype not claimed) | https://www.tohotheater.jp/theater/find.html |
| 109シネマズ川崎 | IMAXレーザー | https://109cinemas.net/kawasaki/establishment.html |
| 109シネマズ湘南 | IMAXレーザー | https://109cinemas.net/shonan/establishment.html |
| 109シネマズゆめが丘 | IMAXレーザー | https://109cinemas.net/yumegaoka/establishment.html |
| 横浜ブルク13 | IMAX screen 7; temporarily suspended for renovation | https://tjoy.jp/yokohama_burg13/theater_news/detail/44697 |

IMAX's own venue directory independently lists Burg13: https://www.imax.com/theatre/yokohama-burg13-imax . The dated operator notice (2026-10-21) is authoritative for its current suspension: IMAX laser preview is scheduled for November 1–2, with formal opening November 3. The facilities page already describes laser, so that undated page must not override the dated opening notice. Retain the current IMAX label and explicit status note until a fresh review confirms reopening; do not silently treat an announced upgrade as active.

## Refresh and compliance

This uses the existing `premium_format_official_pages` manual-curation policy in `data/source_registry.json`. Store minimal factual venue/equipment/status/date labels with official source URLs. No page collector, scraping, new API, image reuse, or paid service is introduced. Search/manual review is separate from production collection.

`data/theater_formats.json` is the authoritative curated snapshot. Wikidata/OSM directory refreshes do not replace it. The historical IMAX bootstrap now only adds missing baseline venues and preserves later reviewed equipment rows, dates, provenance and status. The historical table generator also preserves the status display and official prefecture fallback. Removing or upgrading a curated venue needs explicit review with dated evidence; do not regenerate it from a chain-only list. Existing venue/equipment rows remain intact.

Equipment-mode filtering uses the official equipment prefecture even when a matched general directory row contains a municipal admin label or lacks prefecture. Every equipment family remains attached after filtering, so IMAX selection also shows Burg13's already recorded ScreenX and Dolby Atmos. Its status note links to the dated notice.

No claim of exhaustive nationwide coverage is made. Recheck the Burg13 reopening before promoting its label to IMAXレーザー.
