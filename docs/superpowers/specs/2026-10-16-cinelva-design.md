# CINELVA staged rebrand design — proposed

The user authorizes autonomous research, preparation, implementation and testing, while reserving final brand/logo adoption, external registration, old URL retirement/redirect and destructive changes for explicit approval. This document does not record that approval.

## Scope and boundaries

Start from main commit 65dc9f109d93dadba74da9e4a96695b2d91575a9. Do not merge any open development PR. Preserve paths, APIs, global names and storage keys. Keep Ocean/Aquarium, Movie DNA and Critic Map. Keep the existing production origin and URL until a replacement passes real-world validation.

Prepare three original SVG identities in docs/rebranding/cinelva. None is wired into production before the user chooses. Recommended A: C-shaped aperture plus projection beam. B: curved screen. C: C/V monogram. Provide dark/light wordmarks, favicon, Apple/PWA icons, OGP and a comparison board. Do not reuse third-party artwork.

## Storage protection

localStorage is origin-scoped, not path-scoped. Moving /cinema-calendar/ to /cinelva/ on the same host can preserve keys; a different host cannot read them. Session camera/unlock state is temporary and should not be mistaken for durable viewing history. No IndexedDB or service-worker registration was found in the inspected application source; recheck live registrations on the user's actual installed client before migration.

Add a standalone optional data-backup.html, with no requests or analytics. Export only explicit known app keys into a UTF-8 JSON file; include raw strings so no metadata is reserialized or dropped. Include production viewing records and separate Ocean demo records, lists, favorites/candidates, artwork settings, filters and growth snapshot. Never enumerate and export unrelated origin data. Treat imports as untrusted: format/version/schema, allowlist, string values and 10 MiB bound must pass before writes. Default restore skips all existing keys; no overwrite mode. If a write fails, roll back only keys added in this attempt and report failure. Original keys/origin stay intact. Export/import is user-initiated only. No app clear(), storage.clear(), migration-on-load or automatic redirect.

Conflict-safe import does not merge records inside an existing key. Users with records on both origins must retain both backups; a separately tested record-level merge is required before enabling replacement. Browser quota, interrupted import and private browsing remain release test cases.

## Release conditions

Brand risk report must distinguish factual search results from legal conclusions; unresolved close marks prevent declaring clearance. Domain absence/404 is not proof of availability. A registration is never performed just to test availability. Verify host free limits against the exact publish artifact, including file sizes, CORS and updates.

After adoption approval, replace only user-facing brand copy and assets. Update existing brand tests to the new approved assets, never blanket replace Cinemap globals or keys. Keep my-cinemap.html filename. Add My CINELVA display name. SEO must use the verified production URL; staging is noindex and has no production canonical. Use a rollback commit and keep old export access.

Required tests: backup round trip and malformed/conflict/quota cases; node syntax; repository quality gate; mobile Chromium/WebKit and PC workflows; actual iPhone Safari validation separately identified; calendar/provider freshness, theater official links, Critic Map, Movie DNA, Ocean growth and errors; deployed asset/OGP/manifest paths, API CORS, 404s and caches; workflow success and live version after deployment. Never equate desktop WebKit emulation with real iPhone Safari.
