# Cinelva public release audit implementation plan

> **For agentic workers:** Use superpowers:executing-plans for implementation and one fresh branch review.

**Goal:** Verify public-release readiness, repair reproducible security defects and retain an honest NO-GO until all release gates have evidence.

**Architecture:** Preserve static frontend, public catalog-only backend and browser-local records. No account system, DB migration, billing or origin change.

**Tech Stack:** Static JS, Next.js, Prisma, Node/Python tests, Playwright, existing GitHub/Vercel projects.

**Spec:** User request dated 2026-10-28; AGENTS.md; COMPLIANCE.md.

## Global Constraints
- Latest main baseline 8672ef287262dd921ec83f15dd54b184c6597daf; preserve other working copies.
- No production attack/load tests or user record writes; no secrets in evidence.
- Existing required workflows, exact-source receipt and production guard remain mandatory.
- Free only. No retries around deployment limits. No backend deployment unless backend source changes.

## Review Focus
- Chunked or misleading content-length must not bypass actual body limit.
- Full rate-limit map must not evict an existing offender into a fresh allowance.
- Invalid pagination must be rejected before DB/TMDB work.
- CSP must preserve existing inline handlers while disallowing framing, base changes, plugins and unapproved scripts/connections.
- Browser-local records are shared by people using the same browser profile; never describe them as account-isolated.

### Task 1: Baseline and security fixes
**Files:** backend/lib/http.ts; backend/app/api/*/route.ts; vercel.json; tests/cinelva-public-security.test.cjs; tests/cinelva-backend-http-security.cjs.
**Interfaces:** Existing HTTP JSON helpers; preserve successful API shapes and CORS credential-free behavior.
- [ ] Add failing tests for bounded body, query/pagination validation, cache-safe failures, bounded limiter and static headers.
- [ ] Run tests and retain RED evidence.
- [ ] Implement minimal fixes; ensure agent POST preflight explicitly supports POST.
- [ ] Run GREEN tests, backend compilation and shared quality gate.

### Task 2: Supply chain, privacy and evidence
**Files:** scripts/check_secrets.py; .github/workflows/backend-build.yml; privacy.html; docs/operations/public-release-audit-20261028.md; docs/operations/work-state.json.
**Interfaces:** Secret scanner reports only counts and file/object identifiers, never matched values.
- [ ] Scan reachable git history and current source, audit installed lock against current advisories; distinguish limited pattern scan from exhaustive secret clearance.
- [ ] Pin changed workflow actions to their existing version commit SHA; add HTTP security tests and history scan to existing CI.
- [ ] Align privacy text with external API requests, provider logs, browser-local deletion and shared-device limits. Do not invent a private contact or retention guarantee.
- [ ] Run relevant isolated Chromium/WebKit core journeys and header-enforced smoke tests; read-only production smoke.
- [ ] Record rights, private security intake, real device and operational unknowns as unresolved.

### Task 3: Review, CI and release
- [ ] Fresh branch review; fix material findings with RED/GREEN evidence.
- [ ] Push branch and open PR; wait for four source workflows, renew receipt-only commit, then final-head CI.
- [ ] Merge only on successful gates. Verify production guard, exact frontend/backend source and read-only canonical smoke after normal deployment.
- [ ] If any external blocker remains, retain NO-GO and precise checkpoint; never bypass gate.

## Execution ledger
Baseline shared quality gate PASSED. Existing PR514 is draft blocked on licensed streaming catalog; do not merge. PR521 is an older docs checkpoint; no source overlap.
Ruling: execute without plan approval pause because user explicitly requested continuous audit/fix/test/PR/release work.

Execution update: scoped fixes, full quality390+6Node, Python192, backendbuild/API smoke, dependency and supported secret-pattern checks passed. Fresh reviewer found no Critical/Important. Minor same-context/deferred-interaction browser coverage remains documented. Materialized-config test failure was reproduced and fixed through existing source-configuration helper; full materialized quality GREEN. PR528 pending renewed source CI. Actual local guard refuses on public proof HTTP403; no bypass.
