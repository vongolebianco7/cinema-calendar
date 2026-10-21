# Verified production source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Execute inline under the user's existing all-remaining-tasks authorization.

**Goal:** Fail closed before publishing code or synchronizing production data unless the exact executable source matches a passing, independently observable CI run.

**Architecture:** A Node guard compares tracked executable/configuration/asset blobs to a fixed public GitHub commit and verifies all four critical workflows on that exact head. A small receipt records the head; it grants no access. Mutable generated data and documentation do not invalidate unchanged executable code, but data source policy does. Shared deterministic validation runs again against actual data before every publication/DB write. No branch-protection bypass, credential, paid service or new writer is introduced.

**Tech Stack:** Node built-ins, Git, Python standard library, existing GitHub Actions/Vercel builds.

**Spec:** Issue239 P0-01.4 and AGENTS.md deployment policy.

## Global Constraints

- Preserve origins, storage keys, saved records and rollback deployments.
- Free-only; no scraping, new credentials or permission expansion.
- An HTTP error, timeout, incomplete tree, dirty code, missing receipt or failed/pending latest workflow blocks publication.
- Require exact-source quality, smoke, frontend Chromium/WebKit and reproducible backend build evidence. Never infer success from a previous head.
- A data-only refresh may retain an unchanged source receipt; run the shared gate after data generation and before DB sync.

## Review Focus

- Generated movie JSON changes must remain publishable with unchanged verified code; source_registry policy changes must invalidate proof.
- A successful older CI attempt must not hide a newer failure/cancellation on the same workflow.
- The remote proof tree must belong to the stated commit, not an arbitrary supplied tree.
- Installation/generated files must not hide modified tracked source; untracked node_modules is not source.
- All production writers must be guarded; disabled theater acquisition must remain disabled.

### Task1: Guard and failure fixtures

Files: scripts/verify-production-release.cjs, tests/cinelva-production-proof.test.cjs, quality/production-proof.json.

Interfaces: relevant(path), sourceDigest(entries), verify({receipt,currentEntries,dirtyPaths,readJson}), main(argv,env). readJson only accesses fixed api.github.com repository paths with a finite timeout; pure tests inject responses.

- [ ] Write fixtures for valid proof, missing/future malformed proof, code/policy mismatch, dirty source, mutable data/docs, newer failed/pending CI, incomplete tree, wrong commit/tree and HTTP failure. Run red.
- [ ] Implement bounded read-only verification and explicit --require for DB writers. Non-production local builds remain usable; production never silently skips absent metadata.
- [ ] Run focused tests, then shared quality gate.

### Task2: Bind actual production entry points

Files: vercel.json, backend/package.json, scripts/quality_gate.py, ignore-frontend/backend scripts, three DB workflows, frontend/backend CI workflows, AGENTS.md.

- [ ] Add failing contracts proving pre-build guard/shared validation and pre-DB guards occur before writes, shared proof inputs trigger both builds, and disabled acquisition stays disabled.
- [ ] Wire guard + shared quality before frontend/backend compilation and each DB sync; use sys.executable for nested Python checks.
- [ ] Ensure both browser and backend-build CI run for executable-source changes; docs/data-only changes do not force executable proof renewal.
- [ ] Run full quality, focused boundary tests and actual backend compilation without live DB credentials.

### Task3: Observe CI before creating the receipt

- [ ] Review the tested branch once; fix blockers and repeat relevant checks.
- [ ] Create PR, wait for the four critical workflows on its exact head.
- [ ] Write that successful head into production-proof.json in a separate commit. The receipt is excluded from executable digest to avoid a self-reference; no executable files may change in that commit.
- [ ] Require final-head CI as well, merge, inspect both production builds and real canonical smoke. A failed guard must leave prior deployments serving.
- [ ] Update fixed32 ledger only after enforced production behavior and artifacts are observed; retain physical-device/user/rights gaps.

## Implementation ledger

- Task1:14 proof/writer/real-build boundary cases pass after observed failures. Full shared gate passed on rebased a4d5ee0 data.
- Ruling: guard DB writes in all four package commands rather than duplicate HTTP checks in workflows. This also covers manual npm calls, avoids repeated API reads and leaves disabled theater acquisition unchanged; cost if wrong is a blocked sync, never an unvalidated write.
- Ruling: production quality subprocess runs artifact fixtures as preview builds to prevent recursive self-validation. Exact-source verification already ran in the parent production process; a real missing-proof production build is tested to stop before creating output.
- Security finding: actual run74 npm output led to GHSA-ggr8-5vv4-36mx. Installed7.x reproduced RangeError; exact8.0.0 override passes cyclic/normal configuration tests, npm audit0 and actual Prisma/Next compilation.

- Final review:2blockers verified and reproduced RED→GREEN: backend/new runtime JSON now defaults to proof protection via explicit mutable-snapshot allowlist; later failed rerun defeats a newer-created success by updated/start time and attempt. Disabled master direct importer now runs the guard without adding schema writes.
- Added actual CI-path selection regression for protected runtime data versus generated snapshots. Production uses npmci--ignore-scripts to avoid install-time lock mutation invalidating the verified tree.
