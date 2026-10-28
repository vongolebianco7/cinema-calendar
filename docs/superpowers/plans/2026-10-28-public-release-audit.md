# Public release audit implementation plan

Goal: establish evidence for the user's 2026-10-28 launch requirements and repair confirmed security weaknesses without changing storage keys or production data.
Architecture: static frontend, public catalog-only Next.js/Prisma backend, device-local viewing records. There are no accounts or private server-side user resources. Public catalog CORS is intentionally credential-free.
Scope: existing repository, projects, aliases and free services; no destructive DB operation, token rotation or production attack testing.

1. Reconcile latest main, checkpoint, open PRs, Actions and both production sources.
2. Reproduce missing frontend headers and oversized agent requests with deterministic tests. Repair only these confirmed boundaries and unsafe upstream error logging. Validate agent success, malformed/streaming bodies, UTF-8 byte limits and upstream outage without external calls.
3. Inspect public endpoint inventory, local record/backup isolation, source registry, legal notices and dependency/secret/supply-chain controls. Record unknowns explicitly rather than treating a partial audit as clearance.
4. Run full quality gate, isolated API build/tests and existing mobile Chromium/WebKit E2E. Add repeatable security checks to existing CI.
5. PR, exact-head four required workflows, receipt-only commit and final-head CI, authorized merge, normal release and read-only production verification. Stop publication if any required evidence is missing.
6. Update audit and checkpoint with exact evidence, known risks, physical iPhone/legal/operational gaps and GO/NO-GO.

Review focus: hostile request bodies without Content-Length; multibyte boundary; upstream exceptions containing credentials; CSP compatibility with existing inline scripts and same-origin aliases; local-only records on shared browsers. No claim of complete streaming coverage or physical iPhone verification.
