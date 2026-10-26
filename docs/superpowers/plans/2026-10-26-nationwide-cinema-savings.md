# Nationwide Cinema Savings Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session. Steps use checkbox syntax.

**Goal:** Nationwide method-first savings guide without benefit checkboxes.
**Architecture:** Manual programme facts, pure local date/eligibility explanations, scoped vanilla UI, directory deep links.
**Tech Stack:** Existing JS/JSON/CSS, Node tests, Playwright, Python shared gate.
**Spec:** docs/superpowers/specs/2026-10-26-nationwide-cinema-savings-design.md

## Global Constraints
No scraping/paid dependencies; primary links/actual review dates;60-day price expiry; preserve records/logo; no invented theater or movie availability; no universal-cheapest claim.

## Review Focus
- Excluded theaters must not inherit a national coupon.
- Conditional prices/first-enrolment never appear as unconditional eligibility.
- Expired/future review and distant dates suppress numbers.
- Invalid/malformed data produces usable retry/empty state.
- Date/chain deep links and mobile controls remain operable without storage.

### Task1: National facts and guide engine
Files:data/cinema_discounts.json,js/cinelva-cinema-discounts.js,tests/cinelva-cinema-discounts.test.cjs,docs/data/cinema-discounts.md,data/source_registry.json.
Interface:guide(data,{date,chain,theater},now) returns chain rows with available/upcoming methods, public/conditional minima and review state. chainForTheater(name) returns only explicit known brand match.
- [x] Write tests for no-preselection methods, future dates, excluded theaters, price ranges and expiry; observe red.
- [x] Implement and manually record sourced programmes, fees, steps and exceptions; observe green.

### Task2: UI, directory links and verification
Files:js/cinelva-cinema-discounts-ui.js,assets/cinema-discounts.css,theaters.html,cinelva/theaters.html,tests/cinelva-cinema-discounts-browser.cjs.
Consumes guide(); date/chain controls, two clear price categories, applicable methods plus next dates, primary links, optional selected-theater exclusion.
- [x] Replace rejected checkbox interface and connect national directory rows.
- [x] Update meaningful browser journeys: root/prefix,light/dark,320/390/768/1280px,no selection prerequisite,fee visibility,date/chain/exclusion,retry and stale prices.
- [x] Shared gate and independent focused review; fix findings.
- [x] Exact-source CI and receipt-only proof preparation.
- [x] Final required CI, merge and verified publication. Final backup-only environment installation timeout is recorded below.

- Coverage completion:14 programmes/30 methods plus47 manually sourced prefectural examples; no all-cinema claim. Added region/chain/date deep-link tests, all47 Wednesday usable-guide assertions and stale-region association suppression.

- Source1d754af3: all9 exact-head workflows pass, including frontend40293297786,autonomous40293297707,smoke40293297766,backend40293298079. Fifteen unit tests/local shared quality and Japanese-font screenshots pass. Live canonical READY85ea1e5 created08:01UTC after earlier02:20 quota error provides new availability evidence; do not treat old wait estimate as a current block. Final-head CI and publication verification remain required.

- Published PR510 as12a98875: source539b544b all workflows green; proof-only f31199d1; final b48bc355 required4/mobile/feature browser checks pass. Backup final2attempts timed out during apt prerequisites; same-source backup green, no assertion weakened. Actual production guard+quality/build passed. Canonical deployment dpl_FV6HyYuqAdcq6RJBJPQYxperq5QN READY;8/8 actual static files HTTP200 byte-identical. Cloud browser14cards/0checkboxes/47prefectures+placeholder/fees+steps and Miyazaki noAEONcoupon verified.
