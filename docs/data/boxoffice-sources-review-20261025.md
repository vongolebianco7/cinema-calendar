# Additional box office sources, 2026-10-25

## Worldwide

Uses the existing approved non-commercial TMDB API and existing server credential. Official discovery supports revenue.desc; exact movie details provide revenue in US dollars. Sources: https://developer.themoviedb.org/reference/discover-movie and https://developer.themoviedb.org/reference/movie-details. Existing TMDB credits remain required. No other movie service, scraping, database access, payment or new subscription is introduced.

/api/boxoffice-world performs one discovery call and at most ten detail calls per UI page. Each upstream fetch explicitly revalidates after 86400 seconds through the shared Next cache. Eight UI pages (80 positions) maximum; numeric year/page validation precedes requests. An incomplete or zero-revenue detail is omitted, never converted into a real zero. Rank positions retain the source order rather than compressing missing positions. The UI labels USD worldwide lifetime cumulative revenue, without inflation or currency conversion. Annual filter uses worldwide primary release year, never Japanese release year or revenue earned only within that calendar year. Data can be community-maintained and incomplete; it is attributed to TMDB.

## Japan current year

Manually reviewed factual numeric snapshot from TOHO's official interim results, published 2026-10-15, PDF page49 (PDF sheet50), as of2026-09-30:
https://www.toho.co.jp/ir/2026/1015-ir-2.pdf#page=50

Only12 rows are recorded (9 Japanese/3 foreign films distributed by TOHO and TOHO-TOWA etc with Japanese gross at least1billion yen). Independent JSON keeps this partial sample out of the historical nationwide Eiren source. No automated scraping, PDF ingestion, article replication or third-party ranking reconstruction is enabled. Only factual film names/dates/amounts, own coverage note and original source link are retained. Official images are not copied. Posters/IDs come from matching existing approved TMDB catalog by exact title/release date; the Shin-chan title prefix was manually reconciled against the same July31 movie. No fuzzy/remake substitutions.

The UI explicitly states this is the announced subset, not a complete nationwide annual ranking. Gross is in hundred-million yen; historical Japan-market totals and all-time order remain unchanged. Fiscal-year2027 is not mislabeled as calendar2027: these12 films were released during calendar2026. Values may have increased since September30; do not present them as October25 totals.
