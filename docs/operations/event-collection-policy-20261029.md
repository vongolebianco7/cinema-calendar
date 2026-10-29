# Event collection correction

The inherited film/outdoor refresh scripts fetched HTML and parsed JSON-LD, and outdoor discovery followed Google News RSS links to HTML pages. This is scraping even when the page is official or metadata is structured. It conflicts with the user's absolute no-scraping instruction and with the source configuration's manual-provenance policy.

Removed those acquisition paths entirely. Both scripts now merge only locally reviewed factual announcements and retain existing snapshot records. Their scheduled triggers are removed; manual dispatch remains for reviewed changes. Shared merge validation and atomic replacement preserve the last good feed on invalid input or failed publication. No new source, permission or cost is introduced.

No official API/licensed RSS is currently configured for automatic festival/outdoor discovery. This is explicitly `manual_only` / `disabled_pending_licensed_feed` in feed metadata. Existing32 film events and30 outdoor events are retained, including reviewed multiday and featured-film facts; an attempted run cannot imply a new verification date. Existing historical snapshot rows are not retroactively described as freshly verified.

Validation: two network-blocking regressions observed1 and7 attempted urlopen calls before repair, then0. Manual round-trip, timestamp preservation, curated restoration, factual movie/time/end-date preservation and last-good-byte validation total12 focused Python tests pass. The two old HTML-extraction tests are replaced with equivalent local fact round-trip tests because HTML collection is now explicitly prohibited; preservation assertions were not removed. Independent review exposed wholesale replacement of matching rows; an additional failing regression now verifies omitted movie/time/unknown provenance fields are retained when reviewed fields change.

Coverage remains incomplete until an approved API/feed or additional manual review is available. No program may follow provenance URLs as discovery targets or re-enable these schedules without reviewing a compliant source first.
