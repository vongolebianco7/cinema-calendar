# Requested Performance Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans; autonomous execution is authorized by the user.

**Goal:** Make the six requested performance targets independently assessable.

**Architecture:** Add a pure target assessor beside the existing budget helper, plus an isolated browser report. Keep existing scorecard semantics intact.

**Tech Stack:** Node test runner and existing Playwright.

**Spec:** docs/superpowers/specs/2026-10-29-requested-performance-design.md

## Global Constraints

No costs, scraping, new dependencies, production writes, storage schema changes or deployment guard changes. Physical iPhone remains a separate gate.

## Review Focus

Missing data, negative values, NaN/infinity, exact threshold boundaries, mixed browser/page clocks. Unit tests cover the first four; browser measurements use performance.now within the page for interactions.

### Task 1: Assess requested targets

Files: tests/cinelva-performance.test.cjs; tests/product/helpers/performance-budget.mjs.

- [ ] Write tests for six boundaries and absent/invalid values; run and observe failure.
- [ ] Export assessRequestedPerformance(measurements), returning per-metric value, target, comparison and status; missing is unmeasured and invalid is fail.
- [ ] Run focused tests and shared quality gate.

### Task 2: Measure and checkpoint

Files: tests/cinelva-requested-performance-browser.cjs; docs/operations/requested-quality-audit-20261029.md.

- [ ] Add a local-only 390px browser harness using 0/1000 synthetic records, recording initial readiness, records tab, cached tab, local record filtering, shared review opening, frame cadence.
- [ ] Run where browser binaries are available; record failures explicitly, without inventing measurements.
- [ ] Record all 28 classifications, existing Issue/PR ownership, limitations, exact tests and next actions; create a PR and update #239. Review after checks. No merge before required CI.
