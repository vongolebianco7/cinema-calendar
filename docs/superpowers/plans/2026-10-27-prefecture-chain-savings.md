# Prefecture chain savings implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline and one fresh-context review at the end.

**Goal:** A prefecture calendar identifies the cheapest local listed chains and dates using recurring discounts only.
**Architecture:** Primary-source regionalCoverage binds existing chain offers to named local theaters. Pure regionalGuide/regionalCalendar group eligible tariffs by chain; UI exposes prefecture/date and calendar/day table.
**Tech Stack:** Existing static JS/JSON/CSS, node:test and Playwright CI.
**Spec:** docs/superpowers/specs/2026-10-27-prefecture-chain-savings-design.md

## Global constraints
No one-time coupons, chain picker, one-prefecture-one-sample comparison, automatic scraping, assumed eligibility/points, new cost or record/branding changes.47prefectures,14days,60day horizons. Fees/exceptions/coverage visible.

## Review focus
Neighboring prefectures cannot leak prices; local exclusions require eligible local theaters; ties retain all winning chains; stale geography cannot revive fresh tariffs; malformed restrictions fail closed.

- [x] Add failing units for one-time exclusion, multiple-chain regional ranking/ties, independent geography freshness, named exceptions and109 exact rates; observe RED.
- [x] Manually review primary official inventories and add regionalCoverage; remove intro offer and mark42remaining methods recurring, retain original tariff dates.
- [x] Implement regionalGuide(data,{prefecture,date},now) and regionalCalendar with per-theater restriction/price resolution and grouped chain results; run focused units GREEN.
- [x] Replace chain picker with47prefecture selector; calendar winner names, flat chain table/all recurring discount details, URL/reload/directory integration; update browser journeys and cache keys.
- [x] Shared quality, actual Chromium/WebKit root/prefix/themes/mobile/horizon/error/invalid data and geographic isolation tests; focused independent review and resolve findings.
- [x] Exact-sourceCI, receipt-only proof, all10 finalCI, productionguard/fullquality/build andPR523merge9b2bd368.
- [ ] Production release andcanonical/browserverification: blocked by freshVercel24h ratelimit at2026-10-27T04:40:50Z;existingreleaseautomationupdated to2026-10-28 13:55:55JST. See docs/operations/prefecture-chain-savings-release-20261027.json;do not claim deployed.

Ruling: registration-free and conditional prices remain separate; all applicable recurring methods appear in expandable detail without visitor eligibility selection. Named cinemas support exclusions, not the primary calendar result.

Evidence:24focused units GREEN; original three new regressions RED (intro included;regionalGuide undefined). Full shared quality passed. Isolated worktree and native execution; final fresh review in progress. No threshold/workflow changes.

Review: important punctuation-only names normalized to empty and could broaden restricted offers; reproduced RED with Tokyo fixture, fixed validation in pure engine/UI/override paths,25units GREEN.
Ruling: reviewer graded hidden third/fourth tied winner names Minor, elevated to Important because series discovery is the user's primary goal. Reproduced Dec1preview missing visibleTOHO/United, display all short names and add browser regression. Cost: slightly taller calendar cells on tied days.
Geography correction: current officialOSsite identifies OSシネマズミント神戸 (not former guessed 神戸三宮 label); manual record corrected, no tariff/date refresh.

Release state: source4027c030/final68d9037c/all10finalCI passed. Merge9b2bd368 is identical to finalverifiedtree. Vercel refused normalautomaticpublication;no manualretry/payment/alternatehost/guardbypass. Canonical still serves old43method/intro version. Only production release/liveverification remain blocked.
