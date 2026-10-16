# Cinelva Library Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compare the approved poster shelf, country/decade map and personal profile through an interactive synthetic-record prototype.
**Architecture:** One standalone HTML with an independently testable pure model script and an in-memory UI script. Fixture movie metadata comes from the existing repository; personal ratings/dates are synthetic and labeled. No real storage or production integration.
**Tech Stack:** Buildless HTML, CSS, JavaScript, Node assert; existing CI Chromium/WebKit.
**Spec:** docs/superpowers/specs/2026-10-16-cinelva-personal-library-design.md

## Global Constraints
- 採点すると鑑賞済み扱い。独立した「観た」操作は設けない。
- 0.0〜5.0、0.1刻み。未評価はnullで、0点と区別する。
- ページ横はみ出しなし。390px、ライト／ダーク、キーボード、読み上げ、動き抑制に対応。
- Prototype only: no localStorage/IndexedDB writes, backend calls, real-record imports, production alias or main merge.
- No paid services, scraping, new accounts, libraries or network-loaded fonts. Existing TMDB poster URLs retain attribution.

## Review Focus
1. Partial dates must not fabricate calendar days or months.
2. Zero rating must remain a rated record and edits must not increase counts.
3. Co-productions may contribute to multiple country cells but only one total title.
4. Missing metadata/posters and an empty shelf must remain usable.
5. Thousand-record presets must remain operable without rendering 1000 poster images at once.

## Task 1: Deterministic model and interactive screens
**Files:** Create preview/my-cinelva/index.html; tests/cinelva-library-prototype.test.cjs; tests/cinelva-library-browser.mjs.
**Interfaces:** `CinelvaDemo.stats(records,year,month)`, `filter(records,query)`, `upsert(records,movie,rating,date)`, `makeDemo(count,fixtures)`; records have movie metadata, rating and partial `watchedAt` string or null.
- [ ] Write Node tests for partial dates, zero, edit count preservation, countries, empty and 1000 records; run and observe failure before model exists.
- [ ] Implement pure model and three responsive views with theme, size presets, add/edit score dialog, filters, map drilldown, calendar and profile.
- [ ] Run Node tests and shared quality gate; inspect failures. No broad baseline repair.
- [ ] Add CI browser checks for screen switching, map drilldown, score-zero save, empty/1000, 390px and theme; run on isolated branch.

## Task 2: Reviewable delivery
**Files:** Prototype source, this plan; update draft design PR with evidence.
**Interfaces:** Consume standalone HTML from Task 1. Deliver an isolated preview and/or downloadable standalone file; preserve production and original records.
- [ ] Review diff for storage/API calls and unsafe text injection.
- [ ] Save source on the existing design branch, retaining the spec; never merge the prototype to main.
- [ ] If available, deploy only an explicit Vercel preview and inspect exact source/READY state. A failed preview must not affect production.
- [ ] Inspect screenshot and available browser tests; report prototype limitations accurately.

## Execution ledger
Native execution in the existing isolated worktree; previous release files are untouched by the prototype's Git tree. The user's approval covers the synthetic three-screen prototype. No per-task confirmation is needed for reversible prototype work.
