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


## Task complexity routing
Classify each task before implementation.

### S — deterministic/local change
Examples: copy, spacing, simple CSS, one-file bug, data correction.
- One implementation agent.
- Deterministic quality gate.
- No architecture/research agent unless the gate exposes ambiguity.

### M — feature change
Examples: new interaction, multi-file UI feature, search/sort behavior, data-flow change.
- One planning pass that states acceptance criteria and affected boundaries.
- Implementation agent.
- Deterministic quality gate + mobile browser validation.
- One focused review pass only after tests pass.

### L — architecture/product experience
Examples: Ocean/Aquarium ecosystem, major navigation redesign, storage architecture, backend migration, cross-cutting refactor.
- Architecture/design pass before code.
- Explicit acceptance criteria and non-goals.
- Implementation may span multiple coherent commits.
- Deterministic tests after each stable milestone.
- Browser/UX review after implementation.
- Compliance/security review when external data, storage, authentication, APIs, or user content are affected.
- Stronger reasoning model is allowed here; do not downgrade an L task merely to save credits.

## Quality over credit minimization
Credit saving is a routing constraint, not a product constraint.
Never replace a required architecture/design/review step with a weaker implementation just to reduce AI usage.
Spend stronger-model capacity on ambiguous product/architecture decisions and hard diagnosis; keep repeatable verification deterministic.

## Deployment policy
- Development branches must not require a production deployment to be considered tested.
- Prefer local/CI static serving and Playwright for frontend validation.
- Production deploy happens only after the quality gate passes and the approved change reaches main.
- Hosting migrations must be staged and reversible. Keep the current production host until the replacement is verified.
- Frontend and backend may use different hosts when that reduces limits/risk.
