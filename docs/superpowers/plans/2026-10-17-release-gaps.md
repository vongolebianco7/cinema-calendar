# CINELVA release gap implementation

Approved scope: integrated user specification, plus all seven outstanding audit items.
Use existing static data and approved free APIs; no automatic provider scraping.

## Boundaries and acceptance criteria
1. `cinelva-library-records.js`: preserve country, format, original title, runtime and legacy dates; atomic multi-record restore; unrated counts included; failed writes preserve both keys.
2. `cinelva-insights.js`: separate narrative/medium/work form, accept TMDB numeric IDs, ID-first award matching with conservative year-aware fallback, deduplicate awards per movie/decade; expose all known award films with watched state and explicit coverage.
3. `cinelva-records-page.js` and My Cinelva HTML: independent classification filters and breakdowns; sourced award details; director nodes operable even when absent from calendar catalog; award and rating-backed highlights; keyboard/touch map controls and explicit 2D fallback.
4. Award enrichment script: retain official evidence, preserve raw recipient titles, deterministic work identities, assign TMDB IDs only for unambiguous catalog matches; add Japanese award records only from reviewed primary sources. Unknown totals remain unknown.
5. Streaming: official on-demand listings kept separate from premiere dates and TV; expire stale observations in discovery; no-data is distinct from unavailable; preserve last successful update on total API failure. WOWOW is curated until a permitted API returns it.
6. Discovery/rankings: title/year-aware duplicate checks, minimum rating samples, past release coverage, source/measurement honesty; no current-availability claims based only on premiere dates.
7. Quality: record edge cases and metadata tests; award same-title/remake/cross-category tests; stale availability and failed-update tests; browser CRUD/restore/filters/timelines/2D/PNG/light/dark at 390px. Full quality gate and CI mobile gates before merge.

## Execution and review
Implement in this worktree, one coherent PR based on latest main. Review external-source provenance and storage rollback paths after deterministic tests. Run mobile CI, fix failures, merge only after Autonomous quality gate passes. Deploy main to Vercel only when free quota permits; verify exact production commit and live paths. Report source/API/quota constraints without claiming completeness.
