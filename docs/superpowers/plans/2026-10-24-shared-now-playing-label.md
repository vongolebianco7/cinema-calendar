# Shared current-screening labels Implementation Plan
> Implement inline; one focused review after passing checks.
Goal: consistent badges on all movie posters, including official finite revival/morning periods.
Architecture: shared identity bootstrap + one observer/reconciler; existing local snapshots/schedules.
Tech Stack: vanilla JavaScript/CSS, Node unit tests, Chromium/WebKit.
Spec: docs/superpowers/specs/2026-10-24-shared-now-playing-label-design.md
- [x] Reproduce missing official-period behavior in failing unit test.
- [x] Add exact-ID activeIds with JST inclusive finite-date periods and expiry scheduling.
- [x] Bootstrap badge assets from shared identity script URL; annotate hydrated posters and exact-ID poster links.
- [ ] Verify nine real entry points at390px in both engines, current/ended/start-only states, root/prefix, existing actions and layouts.
- [ ] Shared quality, focused review, exact-source CI receipt, final CI, merge and real production verification.
Review focus: nested asset URLs, duplicate observers/badges, date boundaries, unidentified cards, image/card click preservation.
