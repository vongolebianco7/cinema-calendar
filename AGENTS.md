# Cinemap autonomous development rules

## Goal
Make small, reversible changes with deterministic validation before asking an AI agent or a human to review.

## Non-negotiable constraints
- Preserve existing features unless the task explicitly removes them.
- Mobile/iPhone is the primary UI target.
- Do not add paid APIs, metered AI/API services, or new recurring costs.
- Avoid scraping. Respect copyright, licenses, robots policies, API terms, and COMPLIANCE.md.
- Do not add unnecessary external requests or trackers.
- Never commit secrets, tokens, credentials, or personal data.
- Prefer local/static computation and existing approved data sources.
- Do not deploy or merge automatically. Produce a PR for human approval.

## Development loop
1. Read the task and the relevant existing files only.
2. Make the smallest coherent implementation.
3. Run `python scripts/quality_gate.py`.
4. For UI changes, run the mobile browser checks in CI.
5. If a deterministic check fails, fix that failure before requesting another AI review.
6. Stop after three unsuccessful repair attempts and report the exact failing check; do not loop indefinitely.
7. Open/update one PR with a concise summary, tests run, and remaining uncertainty.

## UI invariants
- No page-level horizontal overflow at 390px viewport width.
- Horizontal movie rails may scroll internally without making the whole document wider.
- Primary controls must remain visible and operable on mobile.
- Console/page errors in core journeys are failures.
- Existing navigation and core movie-recording journeys must remain reachable.

## AI-budget policy
Use deterministic tools first: syntax checks, Python/Node tests, browser assertions, screenshots, and CI logs.
Use an AI model only when code generation, diagnosis, or product judgment is actually needed.
Do not spend AI calls repeatedly re-reading unchanged files or re-running checks that CI can run for free.
Escalate to a stronger model only after a deterministic failure cannot be resolved by the current agent.
