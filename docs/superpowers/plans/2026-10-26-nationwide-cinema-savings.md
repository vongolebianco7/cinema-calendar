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
- [ ] Exact-source CI, receipt-only proof, final CI and merge. Verify deployment only after known provider quota wait; otherwise record concrete publication blocker.
