# Reported UI and data audit Implementation Plan
Goal: repair all feasible reported defects and record unsupported source gaps precisely.
Spec: docs/superpowers/specs/2026-10-24-reported-ui-data-audit-design.md
- [x] Reproduce logo transform, finite-period repetition, missing Netflix rows, provider evidence lookup and absent sorting.
- [x] Implement independent streaming/date, ranking/records, event and theater fixes in disjoint files; integrate common calendar/theme changes.
- [x] Add failing-then-passing deterministic regressions preserving identity/storage/source policies.
- [ ] Run integrated full quality and real390px Chromium/WebKit reported-issue browser regressions with screenshots.
- [ ] One focused review after tests pass; address blockers and freeze source.
- [ ] Exact source CI proof, receipt-only final CI, main merge, canonical production smoke and durable checklist update.
Review focus: stale/unknown availability, remakes/title collisions, date/source/timezone boundaries, image failure fallback, bookmark storage and row baseline/overflow.
