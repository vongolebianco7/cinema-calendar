# CINELVA refresh and domain audit — 2026-10-17

## Canonical URL
- Branded Vercel production: https://cinelva.vercel.app/ (connected project cinema-calendar, production deployment READY on previous main commit verified via Vercel API).
- Legacy GitHub Pages: https://vongolebianco7.github.io/cinema-calendar/ is retained intentionally because localStorage data is origin-specific. Never force-redirect before user-controlled backup/restore.
- Both domains are backed by main only when their respective deployments have completed; do not mistake GitHub Pages links for a brand rollback.

## Actual automatic-update status
| Feature | Current data source / workflow | Audit result |
|---|---|---|
| Cinema calendar / movie catalogue | .github/workflows/update-movies.yml, daily cron 18:17 UTC, TMDB enrichment and source compliance gates | Scheduled in YAML; execution success and data freshness must be monitored in Actions. Not a guarantee that every third-party release is included. |
| Japan streaming premieres | Officially curated data/streaming*.json, imported by update-movies.yml | Conditional: automatic import of previously reviewed announcements; discovering/validating *new* provider announcements is not fully autonomous. Staleness warning when future title count <5. |
| Theater showtimes | .github/workflows/update-theaters.yml schedule 6/day | **Disabled:** job condition is `if: ${{ false }}` pending explicit permission for automated collection. The presence of cron alone must not be shown as active. |
| Box office rankings | data/boxoffice.json generated_at 2026-09-27, sources include dated Kogyotsushin and Eiren figures | Static source-reviewed snapshot. No independently verified active automatic feed. Duplicates in source variants are removed at display time, while evidence is preserved. |
| Awards | data/awards.json generated_at 2026-09-25, curated official sources | Static curated results; no independently verified active automatic feed. |
| IMAX/format recommendation | Client scoring + available movie metadata | Dynamically calculated on selection, but model itself is not an externally refreshed format certification; curated official IMAX evidence added for representative films. |
| Cast names / movie metadata | Existing catalogue and movie detail responses | Display updates when source data changes; profile links are generated from cast names. Not a guarantee of automatic photo coverage. |
| User movie ratings | Browser localStorage on each origin | Saved immediately locally, never synced automatically across domains/devices. V2 key included in backup export/import. |
| Frontend deployment | Vercel project cinema-calendar connected to GitHub main | Previous main production READY. Verify specific new commit and alias after merge. |

## Constraints
Never enable the disabled showtimes collector until approved source permissions and terms are established. No scraping, paid APIs or unverified ingestion. Auto-update claims must distinguish a cron trigger, a successful job and fresh source coverage.
