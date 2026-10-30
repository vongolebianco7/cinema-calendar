# Mobile release acceptance and visible reviews

User authorizes autonomous continuation with existing UI, storage and free-only constraints. Integrate existing PR543/544/545 and latest main through real merge ancestry, preserving all records and recent generated data. One consolidated source proof avoids publishing partially integrated overlapping changes.

## Design and acceptance

The first local-ID index reduced identity reads but did not improve WebKit latency. Existing content-visibility already limits painting; eager shared-review control construction still creates controls for every hidden/offscreen card. Defer only review control construction until a slot approaches the viewport. Keep all film cards, original order, three columns, existing placeholder height, shared actions and data keys. Use native IntersectionObserver with synchronous fallback. Ignore detached nodes, deduplicate observations and release replaced nodes; mount must read current state.

Alternatives: pagination changes browsing interaction and virtualizing whole cards risks scroll restoration; neither is needed for this first bounded optimization. No new dependency, tracking, API or paid service.

## Tasks

- [ ] TDD visible-review queue:1000 hidden slots do not mount eagerly; near-visible callbacks mount once; detached/replaced slots are released; non-supporting browsers mount synchronously.
- [ ] Integrate queue before records-page script; reuse the current mount body unchanged for visible nodes. Syntax/shared quality gate and existing0/1000 record browser journeys must pass.
- [ ] Add dedicated review contrast/director dashboard and discovery return/director-filter browser acceptance evidence. Fix demonstrated failures without altering approved UI.
- [ ] Same CI runner/harness before/after measurement against pre-index d439417e; report missed targets and synthetic scope.
- [ ] Independent focused review after checks, required exact-source CI, receipt-only commit, final-head CI, approved merge and verified existing Vercel deployment. Continue remaining28-task gates.

## Review focus

Hidden tabs becoming visible, rapidly replaced/filtering slots, edits between observation and mount, duplicate observer callbacks, missing observer support, keyboard traversal and stale detached nodes. Physical iPhone, rendered scroll FPS and unavailable licensed feed coverage stay distinct from CI evidence.
