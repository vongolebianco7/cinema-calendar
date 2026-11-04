# Private feedback operations — Issue 585

## Current architecture and data protection
Main previously had a static frontend, Next.js read-only catalog API, Prisma/PostgreSQL, no user/admin authentication and no Web Analytics. Viewing/ratings are browser-local (`cinelva-library-records-v2`, legacy `cinemap-viewing-records-v1`); bookmarks use existing `cinemap-my-list`. This change preserves all keys, backup schemas, origin and movie tables.

Anonymous POST `/api/feedback` accepts kind (bug/idea/comment), 3–4000 UTF-16-unit body (minimum three Unicode code points), optional email and empty honeypot. Body size is bounded to 16 KiB with an 8-second deadline. Content remains plain text, never HTML. No request content, email, credential or IP is logged by this feature. Backend errors are generic. The canonical frontend origin is the only browser write origin allowed.

Postgres atomically admits at most three submissions/IP/hour and 100 total/day across cold starts. Hashes rotate daily using a separate secret; only hash buckets, not IPs, are stored and expired buckets are removed on the next successful post. Raw IP may still be processed by Vercel's infrastructure logs. No browser storage, user identity, or movie records enter the feedback API.

Admin shell `/admin-feedback.html` requires the production administrator key. API GET/PATCH `/api/admin/feedback` checks constant-time hashed bearer equality before DB access and always uses no-store responses. Missing/short key denies access. Token remains in page memory and clears on logout/pagehide, never URLs or storage. List is bounded to 50 and cursor-paginated; statuses new/in_progress/done. This single-operator authentication intentionally avoids introducing a new paid identity provider. Rotate the key after suspected exposure; there is no per-admin audit trail or individual account management.

## Production configuration and release order
1. Confirm existing Vercel Hobby and Neon Free plan/quota. Never enable billing/overage or an alternate paid service. Confirm current schema; do not run `prisma db push`, reset, or catalog import for this feature.
2. Operator sets two independent, cryptographically random 32+ character production-only server secrets on existing **backend** project: `FEEDBACK_ADMIN_TOKEN` and `FEEDBACK_RATE_SECRET`. Do not paste keys into issues, chats, source or public config; store the admin key in the operator's password manager. No preview inheritance. Authentication setup requiring operator interaction remains pending until performed.
3. Exact executable source must pass all four repository-required PR workflows, followed by receipt-only `quality/production-proof.json` update and final-head CI.
4. After proof, apply only `backend/prisma/changes/585-feedback.sql` to the existing database. It creates two unrelated tables/indexes; existing records/catalog tables are untouched. No automatic migration on requests/builds.
5. Merge/release reviewed source through normal guarded path. Retain previous production deployment for rollback. Rolling back source leaves new private tables intact; never drop them automatically.
6. Submit a clearly labelled nonpersonal test through the actual form. Verify DB row and matching admin list, reload, PATCH status and reload. Verify missing/wrong credentials return 401 before reading, invalid origin 403, invalid body 400, oversized body 413 and no cache.
7. Verify actual iPhone Safari at 390px-equivalent plus light/dark, errors/loading/timeout/retry, existing local zero rating and bookmarks after refresh, and existing backup round-trip.

## Analytics and limits
Official docs checked 2026-11-04:
- https://vercel.com/docs/analytics/limits-and-pricing
- https://vercel.com/docs/analytics/custom-events
- https://vercel.com/docs/analytics/redacting-sensitive-data

Hobby includes 50,000 events/month, 30-day reporting, capped collection and **no custom events**. No upgrade or Plus/trial is authorized. Vercel dashboard confirmed Hobby, 50k and no custom events; Web Analytics was enabled on existing frontend project in this run. API now returns 0 visitors/0 PV instead of `web_analytics_not_enabled`; received production data remains unverified until reviewed instrumentation is released.

Only `cinelva.vercel.app` loads the official same-origin `/_vercel/insights/script.js`. beforeSend removes every query/hash and rejects admin URLs. Static Referrer-Policy is strict-origin to avoid query-bearing same-origin Referer headers/document.referrer. Feedback/admin API calls also use no-referrer. DNT/GPC prevent loading; blocked collection must not break any core flow. Administrator page is excluded.

Search, successful record save and successful bookmark write call an allowlisted memory-only diagnostic counter. Payload, title/ID, search term, rating and history are never passed. These counters reset on navigation and **are not cross-user event analytics**. Full service-wide feature usage remains unavailable under the requested Vercel Hobby plan; no paid custom-event calls or pageview simulation is used to disguise it.

After release visit normal pages and confirm actual PV/visitors/page paths/referrer host in Vercel Analytics (https://vercel.com/vongole1/cinema-calendar/analytics). X traffic can be identified by referrer hostname when supplied by the browser; no claim that all X visits are attributable and no UTM feature on Hobby. A working script/empty dashboard alone does not meet received-data acceptance.

## Retention and security operations
Only the operator should hold the admin token and DB access. Keep feedback private; do not export user content to GitHub. Triage and manually delete unnecessary resolved personal contact data through a reviewed bounded DB operation after identity/request verification; do not delete existing movie records. No automatic publication or email is implemented. Review whether unsolicited sensitive content requires earlier removal. No legal/privacy compliance clearance is claimed.

## Verification ledger
- Baseline shared quality gate: PASS.
- Initial implementation shared quality gate: PASS; Prisma generate, TypeScript and Next production build: PASS.
- Independent review found same-origin Referer leak and early-search counter race: regression tests observed failure, then fixed. Unicode minimum length aligned with SQL.
- PGlite real PostgreSQL isolated test: eight simultaneous same-IP submissions admit three; 120 other IP submissions admit exactly 97 more; rejected attempts roll back global counter; invalid insert rolls back. No production DB touched by these tests.
- Local Chromium/WebKit downloads returned corrupt zero-size archives twice; hosted browser checks are authoritative for engine evidence. Physical iPhone remains distinct and pending.
