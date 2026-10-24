# Calendar Now Playing Label Implementation Plan
> Execute inline with executing-plans; approved narrow change.
**Goal:** Label current nationwide films on calendar posters.
**Architecture:** Shared snapshot validator plus independent calendar DOM decorator and exact ID annotations for small thumbnails.
**Tech Stack:** Vanilla JS/CSS, Node tests and existing browser CI.
**Spec:** docs/superpowers/specs/2026-10-24-calendar-now-playing-label-design.md
## Constraints and review focus
No date inference/title matching; preserve date badges, record controls, layout, logo and palette. No labels for stale/invalid/failed data. DOM rerenders must not duplicate labels or cause observer loops; long-open pages expire status.
### Single task
- [ ] Add failing exact-ID/freshness and DOM reconciliation tests.
- [ ] Implement decorator, root/prefix thumbnail annotations and stylesheet.
- [ ] Full quality and real both-engine calendar checks; source CI, proof receipt/final CI, merge and canonical verification.
