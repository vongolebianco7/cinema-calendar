# Cinelva mobile screenshot feedback — 2026-10-31

Scope: the five supplied screenshots, rather than the unrelated cinema-price PR #582.

- Best 10 editor cards follow the selected theme instead of combining a fixed black background with light-theme dark text.
- All editorial and cinema export templates share the poster/title row renderer. Year/director remain in saved records for identity matching, but are never drawn or included in the exported accessibility text.
- Export uses the existing approved emblem image with the shared Georgia wordmark. Cross-origin poster requests use anonymous CORS; failures retain the title and do not prevent export. A request timeout bounds loading. No new API/provider or storage migration.
- Existing drawer routes include exactly one My Best 10 link, with relative paths for nested pages; header/drawer wordmark typography is shared.
- Review captions are MY/TMDB, preserving descriptive titles and accessible labels. Light watched state highlights the entire personal row through the eye icon; TMDB/bookmark stay separate.
- Mobile summary Top 10 uses three columns (two at <=360px), leaving space for labels, scores and actions.

Validation: template regression first failed for missing posters; after implementation all six templates verify poster/emblem drawing and absence of saved year/director. Missing/failed artwork is covered. Personal-rating tests preserve zero, unrated, absent and explicitly unwatched distinctions and check the watched class. Local shared quality gate passed. Chromium/WebKit screenshot/contrast/overflow/export regressions are in Validate frontend; those CI results and the exact-source production receipt are required before merge/publication. Physical iPhone Safari remains a separate check.
