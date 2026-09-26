# IMAX Official Evidence Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a zero-cost, official-source-first IMAX evidence catalog that prevents missing evidence from incorrectly depressing Cinemap screening-format scores.

**Architecture:** Keep IMAX facts in a static normalized JSON catalog, validate and merge them into the existing screening evidence before scoring, and keep collection entirely offline from page views. Automated retrieval is optional and only allowed for explicitly reviewed official sources; the first implementation ships the catalog, validation, matching, integration, reports, and tests without enabling scheduled crawling.

**Tech Stack:** Static JSON, browser/CommonJS JavaScript, Node.js assertion scripts, GitHub Pages, optional GitHub Actions only after source-policy review.

**Spec:** `docs/superpowers/specs/2026-09-26-imax-official-evidence-catalog-design.md`

## Global Constraints

- Zero paid APIs/services and zero metered/credit-consuming services.
- No TinyFish, Firecrawl, LLM API, proxy network, CAPTCHA bypass, or protected-page browser automation.
- No external IMAX request at movie-page view time.
- Official sources only for automatic/high-confidence IMAX technical facts.
- Unknown is distinct from false; missing catalog data must never be interpreted as negative evidence.
- Store concise factual attributes and provenance, not copied source prose.
- Any future automated source must be allowlisted and reviewed for terms/robots/access policy first.
- External collection concurrency is 1, conservative, bounded, and disabled by default in this implementation.

## Review Focus

- A remake/reused title must not match by title alone; year or TMDb identity is required.
- `unknown`, `null`, and absent fields must not override a known existing fact with false/negative data.
- A lower-priority/manual fact must not silently override contradictory official catalog evidence.
- Invalid/partial catalog input must fail validation without breaking the existing screening model.
- A future collector failure must preserve the last known-good committed catalog and must not write an empty catalog.

---

### Task 1: Catalog schema, seed data, and validator

**Files:**
- Create: `data/imax_catalog.json`
- Create: `data/imax_source_allowlist.json`
- Create: `scripts/imax-catalog.js`
- Create: `scripts/check_imax_catalog.js`

**Interfaces:**
- Produces: `validateCatalog(catalog) -> {valid:boolean, errors:string[]}`
- Produces: `matchCatalogRecord(movie, catalog) -> record|null`
- Produces: normalized catalog records consumed by Task 2.

- [ ] **Step 1: Write failing validation/matching tests** for required identity/provenance fields, unknown-vs-false, duplicate TMDb/title-year identities, exact TMDb matching, normalized title+year matching, alias+year matching, and rejection of title-only ambiguous matching.
- [ ] **Step 2: Run** `node scripts/check_imax_catalog.js` and verify it fails because the catalog module/data do not yet exist.
- [ ] **Step 3: Implement** `data/imax_catalog.json` with benchmark records for Oppenheimer, The Dark Knight, Dune: Part Two, The Odyssey, Spider-Man: Brand New Day, and Disclosure Day using only already verified official-source facts; unsupported fields remain `unknown`/`null`.
- [ ] **Step 4: Implement** `data/imax_source_allowlist.json` as a disabled-by-default registry carrying domain, purpose, source class, review date, fetch mode, minimum interval, and notes; do not enable scheduled retrieval here.
- [ ] **Step 5: Implement** `scripts/imax-catalog.js` exports `validateCatalog` and `matchCatalogRecord`; matching precedence is TMDb ID, original title+year, title/alias+year, otherwise null.
- [ ] **Step 6: Run** `node scripts/check_imax_catalog.js`; expected PASS.
- [ ] **Step 7: Commit** catalog, allowlist, module, and tests.

### Task 2: Official-catalog precedence in screening scoring

**Files:**
- Modify: `js/screening-model-v7.js`
- Modify: `scripts/check_screening_v7.js`

**Interfaces:**
- Consumes: matched normalized IMAX record from Task 1.
- Produces: `scoreMovie(movie, evidenceDb, imaxCatalog?)` while preserving existing two-argument callers.
- Produces: catalog-derived IMAX facts merged before existing screening evidence and heuristic fallback.

- [ ] **Step 1: Add failing regression tests** proving The Odyssey/Oppenheimer/The Dark Knight remain IMAX 5 from catalog facts, Dune: Part Two preserves high IMAX facts, Spider-Man and Disclosure Day do not fall to 2, unknown catalog evidence does not penalize a title, and heuristic/manual data cannot silently contradict stronger official facts.
- [ ] **Step 2: Run** `node scripts/check_screening_v7.js`; expected FAIL on the new catalog-precedence assertions.
- [ ] **Step 3: Implement** optional catalog loading/merge support in the shared model without adding network calls or breaking browser/CommonJS use; official catalog facts win, existing evidence supplements non-conflicting unknown fields, and heuristics remain last fallback.
- [ ] **Step 4: Keep** IMAX score semantics: 2 exceptional low-fit case, 3 neutral baseline, 4 strong official/film-fit case, 5 decisive IMAX-specific capture/expanded-presentation case.
- [ ] **Step 5: Run** `node scripts/check_screening_v7.js` and `node scripts/check_imax_catalog.js`; expected PASS.
- [ ] **Step 6: Commit** scoring integration and regressions.

### Task 3: Coverage/conflict report and last-known-good safeguards

**Files:**
- Create: `scripts/report_imax_catalog.js`
- Create: `data/imax_catalog_report.json`
- Modify: `scripts/check_imax_catalog.js`

**Interfaces:**
- Consumes: catalog, screening evidence, and available local movie identities.
- Produces: report counts for matched coverage, unresolved records, stale records, duplicates, and conflicts.
- Produces: nonzero validation exit on malformed proposed catalog while leaving committed catalog untouched.

- [ ] **Step 1: Add failing tests** for conflict detection, unresolved identities, stale-record marking, malformed/empty proposed catalog rejection, and last-known-good preservation behavior.
- [ ] **Step 2: Run** `node scripts/check_imax_catalog.js`; expected FAIL on report/safeguard assertions.
- [ ] **Step 3: Implement** pure report generation in `scripts/report_imax_catalog.js`; it reads local committed data only and performs no web requests.
- [ ] **Step 4: Generate** `data/imax_catalog_report.json` from the committed catalog.
- [ ] **Step 5: Run** both IMAX and screening checks; expected PASS.
- [ ] **Step 6: Commit** reporting and safeguards.

### Task 4: Compliance-ready collector boundary, disabled by default

**Files:**
- Create: `scripts/refresh_imax_catalog.js`
- Modify: `scripts/check_imax_catalog.js`
- Do not create a scheduled workflow in this task.

**Interfaces:**
- Produces: `canFetchSource(source) -> boolean` based only on an explicitly approved allowlist entry.
- Produces: bounded refresh runner that refuses unapproved/ambiguous sources and never replaces the catalog on failure.

- [ ] **Step 1: Add failing tests** proving disabled/unreviewed sources are skipped, request budget is enforced, concurrency cannot exceed 1, and parse/fetch failure cannot overwrite the catalog.
- [ ] **Step 2: Run** `node scripts/check_imax_catalog.js`; expected FAIL on collector-boundary assertions.
- [ ] **Step 3: Implement** the collector boundary with external fetching disabled unless an allowlist record is explicitly approved; no bypass logic, no paid services, no scheduler.
- [ ] **Step 4: Run** all checks; expected PASS without making external requests.
- [ ] **Step 5: Commit** the disabled-by-default compliance boundary.

### Task 5: Final verification

**Files:**
- Verify only; modify files only for defects found by verification.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: evidence that the feature is safe to merge/use without scheduled external collection.

- [ ] **Step 1: Run** `node scripts/check_imax_catalog.js`.
- [ ] **Step 2: Run** `node scripts/check_screening_v7.js`.
- [ ] **Step 3: Inspect** the diff for accidental paid-service dependencies, runtime network fan-out, copied source prose, title-specific score overrides, or an enabled crawler schedule.
- [ ] **Step 4: Confirm** benchmark results and that an unknown-evidence title remains neutral rather than being penalized.
- [ ] **Step 5: Commit** any verification-only fixes, then record the verified commit SHA.
