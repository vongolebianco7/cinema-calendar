# Cinemap autonomous development rules

## Goal
Converge on approved product acceptance criteria through small, reversible changes with deterministic validation. A pull request is not a development-cycle boundary.

## Non-negotiable constraints
- Preserve existing features unless the task explicitly removes them.
- Mobile/iPhone is the primary UI target.
- Do not add paid APIs, metered AI/API services, or new recurring costs.
- Avoid scraping. Respect copyright, licenses, robots policies, API terms, and COMPLIANCE.md.
- Do not add unnecessary external requests or trackers.
- Never commit secrets, tokens, credentials, or personal data.
- Prefer local/static computation and existing approved data sources.
- Follow `docs/free-only-policy.md`.
- Work through branches and PRs. For changes wholly inside already-approved scope, a successful Autonomous quality gate authorizes merge without another user confirmation.
- Human confirmation is required only for payment, authentication, irreversible actions, or a major unresolved product/specification choice.

## Continuous autonomous development loop
1. Observe latest `main`, relevant open autonomous PRs, and their CI state.
2. Reconcile relevant existing work before starting duplicate work.
3. Evaluate the active feature against its explicit acceptance gates using evidence from current `main`.
4. Select the highest-priority unmet gate that is safe to address without human judgment.
5. Make the smallest coherent, reversible implementation on a branch.
6. Run `python scripts/quality_gate.py`; for UI changes, also require the existing mobile browser checks in CI.
7. If a deterministic check fails, diagnose and repair it. Stop as `BLOCKED` only when the same blocker remains after at most three repair attempts.
8. Open/update one PR with a concise summary, tests run, and remaining uncertainty.
9. When Autonomous quality gate succeeds and the change remains within approved scope, merge it.
10. Immediately fetch/re-evaluate latest `main` after merge and return to step 1. Merge is an intermediate transition, not completion.

Creating a PR, CI success, merging a PR, making meaningful progress, identifying the next task, or reaching a subjective percentage is never a valid stop reason. Do not invent percentage-complete estimates.

## Allowed stop states
Only these states may terminate an autonomous run:
- `COMPLETE`: all acceptance gates for the active approved goal are satisfied and no next approved goal is available.
- `HUMAN_REQUIRED`: payment, authentication, irreversible action, or a major unresolved product/specification choice requires human judgment.
- `BLOCKED`: the same technical blocker remains after at most three repair attempts.
- `EXECUTION_LIMIT`: the execution environment cannot perform another required action in the current run.

Notifications and stopping are separate. Reporting a meaningful result merged to `main` must not itself terminate execution when another safe action remains executable.

## Active Ocean/Aquarium goal
For Ocean/Aquarium, use `docs/ocean-acceptance.md`. The target is a personal marine ecosystem that visibly grows as the user watches and rates films, not a genre map with fish substituted for genre nodes.

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
