# CINELVA rebrand — research and release status

Date: 2026-10-16 (Japan). Current status: **CINELVA published at the existing production URL after explicit user approval of the close-name risk**. PR #220 merged as 43e6cd2eacdbf35baa4261204b36504c78303e5d; Pages deployment and actual browser display verified. The following research and hold decisions are the pre-approval audit trail; see [release-log.md](release-log.md) for current status and remaining limitations.

## 1. Brand and trademark risk: 高リスク for unqualified public adoption; rights unconfirmed

### J-PlatPat, direct UI searches

Official database: https://www.j-platpat.inpit.go.jp/t0100 . Search target: 出願・登録情報; no class restriction; no exclusion keywords or date/status filters.

| Query | Observed result |
|---|---|
| 商標(検索用): `CINELVA シネルヴァ` (space = OR) | 0 hits |
| 商標(検索用): `CINELVA シネルヴァ シネルバ CINERVA CINELVIA CINEVA` | 0 hits |
| 称呼(類似検索): `シネルヴァ` | 71 hits |
| Same phonetic search, class facet 09 | 7 hits |
| Same phonetic search, class facet 35 | 6 hits |
| Same phonetic search, class facet 41 | 10 hits |
| Same phonetic search, class facet 42 | 10 hits |

Counts are database candidates, not legal findings of similarity. Multi-class marks appear in multiple facets. Results do not establish permission to use or register CINELVA. Search indexing/normalization and publication lag can affect completeness.

Important observed candidates:

| Mark / application or registration | Classes | Status shown | Relevance and evaluation |
|---|---|---|---|
| Zynerva / 商願2026-048968 | 09 | pending examination | Pronunciations include ジネルバ. Detailed goods are mainly electronic hardware/accessories; codes include 11B01/11C01. Not automatically irrelevant just because hardware. 要注意. |
| シレルバ / 登録6982790 | 35 | active registration | Detailed services include advertising, database information compilation, and consumer choice information; codes include 35A01/35B01/35G03/35L01/42P02. Close short Japanese sound, so 要注意. |
| CST Minerva / 登録6607295 | 09/41/42 | active registration | Detail confirms software, online audiovisual/text information and software provision/website services. Codes 11C01, 41E02/03, 42P02/42X11 etc. Sound/appearance differ, but service overlap means no blanket low-risk conclusion. 要注意. |
| みねるば / 登録5944206 and composite 登録6051816 | 35/37/42 | active registrations | Cloud/software related name; all specific goods/services not fully reviewed. 要注意. |
| MINERVA / 登録6488952 | 09 | active registration | Full goods and visual comparison unconfirmed. 要注意. |
| Minerva / 登録6223347 | 41/43 | active registration | Full services unconfirmed. 要注意. |
| MINERVA / 登録6227609, 登録7065161 | 41 | active / newly registered status | Full services unconfirmed; do not assume every entertainment/education use is equivalent. 要注意. |
| MinerVa Search / 登録6849258; MinerVa AI / 登録6849259 | 42 | active registrations | Same broad software service field; full services unconfirmed. 要注意. |
| MINERVA / 国際登録1486304 | 41/42/45 | active registration | Full services unconfirmed. 要注意. |

No exact registered conflict was established in this session. International clearance and all close candidates have **not** been cleared. A subsequently found film-industry use of **Cinerva** materially raises the practical confusion risk for unqualified public adoption. The English names differ by one letter (L/R), and a Japanese reading may coincide with シネルヴァ. This is a risk assessment, **not** a finding of infringement or a verified registered trademark. Hold the main production rename pending specialist review of markets, priority, class-specific goods/services and actual use; user design approval does not replace that review.

### Existing services and search visibility

- `Cinerva VFX Studio`, https://www.cinervavfx.com/ and https://www.cinervavfx.com/about-us , presents itself as a VFX/CGI and post-production provider for feature films and OTT. Its own site and a company listing establish public name use in an adjacent movie/entertainment field, but its trademark registrations, priority and geographic rights remain **unconfirmed**. 高リスク for brand differentiation; do not assume legal infringement or clearance. This finding was made after the noindex stage path was deployed.
- `In Focus: シネルヴァ`, a Japanese-language visual novel released in 2020: https://novelgame.jp/games/show/3898 and creator page https://abysan.itch.io/synerva . Japanese name matches, entertainment is adjacent. 要注意; existence is not proof of trademark rights.
- `Cineva: Tamil Movies & OTT`, Google Play app: https://play.google.com/store/apps/details?id=com.cine5.app . Nearby spelling in movies/streaming. 要注意; foreign pronunciation and territory-specific rights unconfirmed.
- `Cinevia`, streaming site: https://cinevia.me/ . Nearby appearance, not the same name. 要注意; legal status unconfirmed.
- `Cinevva`, browser game platform: https://app.cinevva.com/about.html . Nearby spelling and web entertainment; legal status unconfirmed.
- Exact CINELVA also appears in personal names and an unrelated construction-company reference. These alone are low relevance to a movie app; do not use them as proof of availability.
- Search-engine queries scoped to Apple App Store, Google Play, Instagram and X did not establish a verified exact CINELVA app/account. **App Store in-store results and handle availability are unconfirmed**; search absence does not mean an account can be registered. Facebook, YouTube, TikTok and other handle inventories remain unconfirmed. No accounts were created.
- WIPO Global Brand Database https://branddb.wipo.int/ returned a verification/challenge page to the retrieval tool; no authenticated international database search was completed. EUIPO/USPTO and country-specific clearance remain unconfirmed. Search-engine trademark queries are not a substitute.

Alternative direction if CINELVA cannot be cleared: keep Cinemap while investigating a longer, more distinctive CINE-prefixed invented word. `CINELVORA` / `CINELVISTA` are brainstorming candidates only, not researched or recommended as available. Do not silently switch to Cineva/Cinevia/Cinevva, which already have adjacent services.

## 2. Free URL options

| Candidate | Initial/ongoing cost | HTTPS / Actions / indexing | Stability and migration | Availability and terms | Recommendation |
|---|---|---|---|---|---|
| cinelva.is-a.dev | free delegation; separate free host required | HTTPS from hosting provider, not DNS delegation itself; Actions depends on host; indexing possible if allowed | Community-operated delegation can be revoked; future domain change is another origin migration | `domains/cinelva.json` returned 404 through GitHub API; no reservation established. Software-development-related noncommercial condition; movie app fit needs maintainer confirmation. Request guidance says not to generate domain requests with AI. No application made. | Hold |
| cinelva.pages.dev | Pages Free, subject to free limits | HTTPS; Git integration or Actions via Wrangler; indexing possible | Managed host; standard static assets portable; service continuity not guaranteed | Exact name unconfirmed: fetch failure is not availability. Account/terms/registration approval required. Free limits: 500 builds/month, 20,000 files, 25 MiB/file. Avoid Functions/billing/R2 add-ons. | Best clean branded host candidate, conditional |
| vongolebianco7.github.io/cinelva/ | GitHub Pages public-project hosting free | HTTPS; Actions; indexing possible | Same origin as old URL preserves localStorage keys; deployment must publish sibling path using a cinelva repository/user-site layout, not simply rename current repository | Repository GET for vongolebianco7/cinelva returned 404; no visible accessible repository found, but name not reserved/created. No repository rename, no old URL retirement. Exact new-repository availability and publishing configuration unconfirmed. Personal noncommercial project restrictions apply. | Best data-continuity candidate, conditional |

Conservative launch route: approve identity, rebrand at existing production URL first, then stage a new URL while keeping old origin available. The URL need not change simultaneously with the visible brand.

Sources:
- https://github.com/is-a-dev/register/blob/main/TERMS_OF_SERVICE.md
- https://docs.is-a.dev/quickstart/
- https://github.com/is-a-dev/register
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

The inspected repository has ~1,482 non-git files including drafts and no individual file >25 MiB. This is a preliminary size check, not validation of a final publishing artifact. Do not publish the entire source repository as a Cloudflare artifact (backend/scripts/docs should be excluded). Future custom domains need actual domain ownership and are not guaranteed free.

## 3. Designs

The user withdrew the three new proposals and chose the **original Cinemap graphic only** with all visible letters changed to CINELVA. The draft references the existing square symbol without modifying its pixels. The original combined raster with embedded Cinemap lettering remains in the repository for compatibility but is not displayed by the draft. No new symbol is proposed. Production-root assets and manifest remain Cinemap.

## 4. Audited code and data protection

Base commit: 65dc9f109d93dadba74da9e4a96695b2d91575a9. GitHub connector confirmed 17 open PRs; none was merged/rebased or used as this change's base.

| Data | Storage / handling |
|---|---|
| Viewing history, rating, resonated flag | preview/ocean/js/viewing-records.js: `cinemap-viewing-records-v1`; raw value backed up |
| Ocean demo data | `cinemap-ocean-demo-records-v1`; kept distinct from production records |
| Ocean growth snapshot | `cinemap:ocean:last-shown-growth`; backed up |
| My Cinemap active/saved lists and candidates | `cinemap-my-list`, `cinemap-my-saved-list`, `cinemap-my-saved-lists`, `cinemap-my-candidates` |
| Artwork settings | existing font/theme/background keys retained |
| Calendar/theater settings | `cinemaNow.mode`, `cinemaNow.active`, `cinema-theater-prefecture` |
| Temporary camera and critic-unlock state | sessionStorage; intentionally not migrated as durable user data |
| Movie DNA | search.html receives `dna` (creator/genre metadata) from backend/app/api/movie-detail/route.ts, which assembles it from movie API responses. No personal DNA storage key identified. Endpoint and interface stay unchanged; full flow unverified. |
| Other favorites/reviews/server data | only known local keys are covered; do not claim backup of an unidentified backend store. Complete flow audit remains a release gate. |

No IndexedDB, service-worker registration or app cookie persistence was found in the inspected JS/HTML paths. This does not establish that a user's previously installed app has no legacy worker/cache. Check actual clients and retain old asset paths before release.

The backup tool is additive and linked from the My CINELVA hero in the draft rebrand. No production user data was read by the agent. Unit tests use synthetic records. Same-origin paths share localStorage; other hostnames do not. Keep original browser/URL until imported records and derived Ocean/DNA are verified. Existing records in a destination key are skipped in full; this is not a record-level merge tool.

## 5. Validation and known limits

- Review commit `6d853d12c7a6f1a6dcfe01a24d06eb78360c00cb`: local quality gate passed. All 10 observed GitHub Actions completed successfully, including the browser CI in Chromium and WebKit at 390/1280px for the backup journey and CINELVA header/logo/layout checks. Browser coverage is limited to index, My CINELVA, search and privacy for brand layout; full iPhone Safari remains unverified.


- Node backup suite: 7/7 passed (including round trip, conflict preservation, malformed input/unknown keys, version/size rejection, rollback, unavailable storage).
- `python scripts/quality_gate.py`: PASSED.
- Broader `python -m unittest discover -s tests`: 92 tests, 8 failures + 8 import-time errors. A clean `git archive` of the exact base reproduces the same 16 names; tracked existing files unchanged. See baseline-failures.md. Keep unrelated repairs separate.
- Local mobile/desktop Chromium and WebKit could not start: Playwright browser binaries missing. An attempted official install failed with truncated archive downloads. The dedicated CI subsequently succeeded: Chromium and WebKit at 390px and 1280px all passed actual export/download, conflict-preserving import, invalid-file rejection, no horizontal overflow, and no page errors. Evidence: https://github.com/vongolebianco7/cinema-calendar/actions/runs/38844153050 (commit 0a0f5822243a0c3c6c3c2b1412694cadb005f7d8).
- Real iPhone Safari: unverified, distinct from CI WebKit.
- Existing production https://vongolebianco7.github.io/cinema-calendar/ opened successfully in cloud browser, showing Cinemap v0.4.73 and current calendar controls; not a full regression pass. Streaming view includes an explicit partial-coverage note and sparse weeks. Freshness/completeness not certified by rebranding work.
- Theater search/showtimes, Ocean visual quality, Movie DNA, all outbound links, SEO/OGP and cache/base-path checks remain pending for the final adopted version.
- Initial implementation GitHub Actions: CINELVA backup safety, Validate frontend and Check brand identity succeeded on implementation commit 0a0f5822243a0c3c6c3c2b1412694cadb005f7d8. Autonomous quality gate and completeness scorecard also succeeded on that commit. All seven observed runs succeeded (two are duplicate push/PR frontend/brand checks). CI success does not mean production was deployed.

## 6. Pending release gates

The user selected the **existing Cinemap logo symbol**, paired with the new CINELVA text. User requested the full visible rename; this is taken as authorization for the final naming treatment, while the research and release gates below still apply. The combined old raster wordmark and A/B/C proposals were withdrawn. Production identity assets remain untouched; the existing square symbol is referenced in the review branch.

1. Complete close-mark goods/services and international rights assessment; no guarantee of legal clearance.
2. The user selected the original symbol plus CINELVA text and instructed a complete visible rename. This resolves the design choice but does not resolve the later close-name risk.
3. Review the staged display-only rebrand (header, page copy, exported artwork and manifest); preserve internal identifiers and old page routes. Production is unchanged.
4. Complete browser/data flow regressions and new-origin staging; get external registration approval only if needed.
5. Resolve release-blocking defects, verify Actions and actual deployed revision.
6. Retain old URL. Any redirect/retirement requires separate user approval.

Current production root remains Cinemap. The same-origin noindex staging path is live and has been verified separately; it is not a final public brand launch.

## 7. Same-origin staging update (2026-10-16)

- Staging PR #221 (https://github.com/vongolebianco7/cinema-calendar/pull/221) was isolated from the unmerged main rebrand PR #220. Its 22-file nested `/cinelva/` entry-point copy and browser test were squash-merged as `16aba4390c1de72eb63d279363c713b338d4abd0`. The Pages build/deploy run 38850074960 succeeded.
- Live browser checks opened https://vongolebianco7.github.io/cinema-calendar/cinelva/ with CINELVA text and the original icon, followed links to My CINELVA and the backup page, and independently opened https://vongolebianco7.github.io/cinema-calendar/ with Cinemap still visible. These checks do not constitute full feature regression or a real user-data migration test.
- CI for #221 passed the staging browser flow in Chromium and WebKit at mobile and desktop widths, including a synthetic same-origin storage check. The existing storage keys remain unchanged. This path shares the old origin; a future `pages.dev` origin would still require explicit export/import.
- Cinerva VFX was found after staging. **Do not merge #220, remove old URLs, register a new domain or promote this noindex path as a final brand until the close-name risk is resolved.** A specialist trademark review is recommended. If the name cannot be cleared, preserve the existing production identity and choose a researched distinct alternative.

## 8. Review delivery

Draft PR: https://github.com/vongolebianco7/cinema-calendar/pull/220

Implementation commit: 0a0f5822243a0c3c6c3c2b1412694cadb005f7d8 (39 additive files, zero deletions). File groups: `data-backup.html`, `js/data-backup.js`, `tests/cinelva-backup*.cjs`, `.github/workflows/cinelva-backup.yml`, this research folder including all identity materials, and design/implementation-plan documents under `docs/superpowers`. The PR Files changed tab is the exact authoritative list. This follow-up note records the verified CI result and further trademark/storage observations. No production file or user storage key was replaced.

## 9. Continued verification and independent review

See [release-readiness.md](release-readiness.md) for the current acceptance matrix, live checks, known pre-existing product gaps, no-cost trademark consultation questions and rollback procedure. Commit 1ba3021 passed all 12 observed Actions, including a 22-metric Chromium/WebKit comparison with the exact pre-rebrand baseline. A subsequent independent review found an invalid-payload import crash; the final fix validates stored JSON shapes before any write and preserves damaged source strings on export for recovery. Local Node checks after the fix: 10 passed; release Python checks: 2 passed. Final browser CI must be checked on the final fix commit. Main-root promotion remains held under the original trademark condition; do not describe staging as a completed brand launch.

## 10. Approval and production release

After reviewing the close-name risk, the user explicitly approved CINELVA adoption and switching the current production URL. PR #220 was merged as 43e6cd2eacdbf35baa4261204b36504c78303e5d. Pages run38872938863 succeeded; the normal root URL, My CINELVA and the backup link were verified in the live browser. Review code a682f41 passed all10 observed Actions. Trademark registrations/priority remain unconfirmed; approval is a product decision, not legal clearance. Old URL, storage namespaces and original symbol remain in place. No external registration, redirect or destructive data migration occurred. See release-log.md for final evidence and limitations.
