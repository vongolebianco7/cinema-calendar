# Cinelva public-launch audit implementation plan

Goal: verify the existing service against the user’s 2026-10-28 launch requirements, prioritizing privacy and integrity.
Architecture: preserve static frontend, public catalog API, origin-local records, current projects and exact-source production guard. No account system or data migration.
Spec: user request in this session; AGENTS.md and docs/operations/work-resume.md.

- [x] Fetch latest main, reconcile PRs and serving deployments, inspect storage/API/dependency boundaries.
- [x] Reproduce unescaped calendar content, unsafe URL schemes, unbounded POST body and cacheable errors with isolated tests; repair at output/input boundaries.
- [x] Add framing/MIME/base/form security headers, database-read request limits, safe fixed upstream log messages; preserve raw records.
- [ ] Run full shared gate, backend build and offline API integration; require exact-head CI and mobile browser journeys.
- [ ] Review complete diff, renew receipt only after all four required workflows succeed; require final-head CI before merge.
- [ ] Verify current main and production, read-only smoke, complete audit matrix and checkpoint. No GO while required evidence is absent.

Review focus: imported URLs, external text in innerHTML, UTF-8/chunked request limits, API resource exhaustion, localStorage quota/backup preservation.
Ruling: execute directly as requested; isolated fresh repository clone and dedicated branch protect existing work. No additional worktree or plan approval required by user-authorized continuous execution.
