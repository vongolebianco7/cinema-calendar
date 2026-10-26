# Public Cinema Savings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add verified no-paid-membership savings with accurate local exceptions.
**Architecture:** Existing static offer records and pure guide, optional includedTheaters.
**Tech Stack:** Vanilla JavaScript, JSON, Node tests and Playwright.
**Spec:** docs/superpowers/specs/2026-10-27-public-cinema-savings-design.md

## Global Constraints
Preserve47 examples, no checkboxes, original dated facts, no paid infrastructure/scraping/record/logo changes.

## Review Focus
Named methods must not leak to other theaters or upcoming dates. Urasoe has no Wednesday/first. December1 must not retain ordinary first-day. Free KINEZO still requires online booking. Old facts retain prior review horizon.

### Task1: Facts and eligibility
Files:data/cinema_discounts.json,js/cinelva-cinema-discounts.js,tests/cinelva-cinema-discounts.test.cjs,docs/data/cinema-discounts.md.
Interface:guide(data,{date,chain,theater},now),optional offer.includedTheaters.
- [x] Add three failing regressions for local leakage/public tariffs/online fee conditions; observe red.
- [x] Implement reviewed facts and named-theater filter;19 units pass.
- [x] Preserve old verifiedAt dates and document primary sources.

### Task2: UI evidence and release
Files:tests/cinelva-cinema-discounts-browser.cjs,docs/operations/work-state.json.
- [x] Add real-date27 browser flow for ordinary/exception theaters and free booking.
- [x] Full shared quality and focused review. Both minor review findings fixed; no blockers.
- [x] Exact-source CI, receipt-only proof and final required CI.
- [x] Merge and verified publication; release evidence saved in work-state checkpoint.

Published PR518 as3f9711d4. Exact source69d30406 and receipt-only final9a2f6d5a all workflows green; actual Chromium/WebKit new flows passed. Production build guard+fullquality passed (digest0de71f98176ef25d85aa6a7f9a50269810a4ed2a14d84acf183574ff0645d8a8). Canonical deployment dpl_3sY7uwYukHDBHfcWPSgKg8UidB8x READY;8/8 actual files200 byte-identical. Live browser14cards/40methods/0checkboxes/48prefecture options,KINEZO free online steps,Agui named Tuesday and MOVIX publicWednesday1400 verified. Existing47examples retain original review dates. No all-cinema/all-discount claim or production record writes.
