# Local review lookup optimization

The first requested-performance CI sample exposed WebKit1000-record misses: initial2469ms, records tab453ms, repeat tab353ms, review547ms. Linux/local/synthetic, not physical iPhone. See performance-baseline-20261029.json. No speedup is claimed from this baseline alone.

Root cause found in shared review initialization: each local card calls viewingRecord(), which scans canonical records from the start. An instrumented1000-card fixture performs500500 record.id reads. Indexing local IDs once reduces those reads to1000 while preserving first-match behavior. This removes quadratic identity lookup; DOM/layout and localStorage-string costs remain and may dominate WebKit.

Design: index only `_localRecord` records, using canonical array reference as cache version. `allRecords()` already replaces that array on storage changes or invalidation events. Do not change non-local TMDB/legacy title/year matching, storage keys or record objects. Tests cover large-list reads, new-array update/deletion, duplicate order and existing remote/legacy safeguards. One expected RED became three GREEN tests; full shared quality gate must also pass.

Existing frontend CI runs the same harness in a detached temporary worktree at pre-index commitd439417e806ba998f5c8800ed38bb6d1bda49f03, then the changed source on the same runner. Both engines and before/after artifacts are retained. This intentionally adds no workflow, dependency, production release or paid API. One sample is insufficient for stable percentile claims; report actual comparisons and remaining misses.

Acceptance remains open until before/after artifacts, exact-source CI, review and final-head checks exist. No claim that all six targets or all28 tasks are complete.
