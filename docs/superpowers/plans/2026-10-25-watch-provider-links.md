# Movie watch-provider links

Goal: all movie-list routes lead to the shared detail page, where Japanese availability is grouped as subscription, free, rental and purchase and links open the provider.

Architecture: retain the existing movie-detail API and JustWatch/TMDB names. Add a pure HTML renderer in search.html and its /cinelva mirror. Use official title-search links for known providers and clearly labelled official homepages where a stable search link is unavailable. Preserve the supplied TMDB watch link as the route to exact content links; never fabricate provider content IDs. No paid APIs, scraping, new tracking or storage changes.

Acceptance: matching Japanese availability only; safe escaped output/HTTPS URLs; duplicate names within each offer removed; no unknown-provider misrouting; empty/error availability says unconfirmed; JustWatch attribution; mobile wrapping and 44px actions; identical root/prefix behavior.

- [ ] Write renderer unit regressions for grouping, title encoding, unknown providers, unsafe source links and empty availability; observe failure.
- [ ] Add renderer and compact styles before the existing viewing timeline; mirror search.html.
- [ ] Run units and full quality gate. Verify real shared detail in browser, light/dark and root/prefix; CI checks source and final proof.
- [ ] Renew source receipt only after exact-source CI. Merge after final CI and verify canonical files.

Review focus: same-name films must keep ID, rental never labelled subscription, unknown providers must not point to another provider, injected title/URLs escaped, backend error must not invent access.
