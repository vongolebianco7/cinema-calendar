# Cinema Discount Comparison Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session. Steps use checkbox syntax.

**Goal:** Compare sourced ordinary adult cinema prices for six local venues by date and existing benefits.
**Architecture:** Static manual JSON; pure local tariff engine; isolated UI module mounted in existing theaters.html. No showtime acquisition or backend changes.
**Tech Stack:** Existing vanilla JS/HTML/CSS, Node test runner, Playwright, Python quality gate.
**Spec:** docs/superpowers/specs/2026-10-25-cinema-discounts-design.md

## Global Constraints
- Free, non-scraping; no new external requests, trackers or dependencies.
- Original logo/palette and record storage preserved.
- Ordinary adult 2D only; membership acquisition fees excluded explicitly.
- No unsupported movie availability, universal cheapest or real-time claims.

## Review Focus
- Paid benefits require explicit selection; no silent qualification.
- Multiple discounts choose one applicable price, not combined reductions.
- Missing/stale/future review dates suppress numbers.
- Invalid dates and JST midnight must not pick the wrong day.
- Storage denied, empty area and data failures remain usable with retry.

### Task 1: Data and tariff engine
Files: data/cinema_discounts.json, js/cinelva-cinema-discounts.js, tests/cinelva-cinema-discounts.test.cjs, data/source_registry.json, docs/data/cinema-discounts.md.
Interfaces: compare(data,{date,area,evening,benefits},now) returns venue rows with eligible offers; calendar returns next14 days with minima. today(now), addDays(date,n) operate on JST civil dates.
- [x] Add behavioral tests for eligibility, lowest eligible offer, dates, expired data and data provenance; run red.
- [x] Record reviewed numeric facts and source URLs, implement engine; run green.

### Task 2: UI and verification
Files: theaters.html, cinelva/theaters.html, index.html, assets/cinema-discounts.css, js/cinelva-cinema-discounts-ui.js, tests/cinelva-cinema-discounts-browser.cjs, .github/workflows/validate-frontend.yml.
Consumes: Task1 engine/data. Produces: accessible date/area/evening/benefit controls and prices, calendar, official links.
- [x] Add browser assertions for controls, persistence, no overflow, root/prefix/light/dark and failure/retry.
- [x] Implement scoped section and calendar link; wire browser test into existing validation.
- [x] Run node tests, browser Chromium/WebKit, shared quality; review diff and screenshots.
- [x] Open PR, wait exact-source CI, receipt-only commit, final-head CI, merge and verify publication if available.

## Execution ledger
- Isolated fresh clone/feature branch; existing directory/schedule baseline 8/8 passed.
- User already approved scope; proceed without additional design approval per AGENTS.md and established preference.

- Task1 complete:8/8 unit tests green. February2028 fixture corrected:28th is independently a Monday tariff, not card day.
- Task2 local complete: shared gate and Chromium journeys pass. Independent reviewer found no critical/important issues; all3 minor findings addressed with browser regressions for320px touch targets and malformed-data recovery.
- Environment: fresh isolated checkout, original main kept on origin/main. Local Playwright browser package lacks binaries; provided /tmp/chromium successfully used through optional test-only executable override. WebKit runs in existing CI.

- Release complete2026-10-26: PR500 source65289b32 all10 and receipt83fe11d2 all11 workflows passed; merged15e214bb. Canonical Vercel deployment dpl_EZ44hynZewki3fPdAAk5DwQ7podg READY. Nine canonical files HTTP200/byte-identical; live cloud Chromium shows six venue cards and current prices. CI Japanese WebKit light/Chromium dark screenshots visually inspected. Ordinary adult2D tariff comparison only; no physical-device or live-screening availability claim.
