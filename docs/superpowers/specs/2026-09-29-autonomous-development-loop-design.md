# Cinemap Continuous Autonomous Development Loop Design

## Intent
Cinemap autonomous development must converge on approved product acceptance criteria rather than stop at pull-request boundaries. A successful PR merge is an intermediate state transition, not completion.

## Constraints
- Preserve existing features unless explicitly approved otherwise.
- iPhone/mobile remains the primary UI target.
- Completely free-only: no paid APIs, metered services, paid AI runtime, new recurring cost, unnecessary external requests, or scraping.
- Follow COMPLIANCE.md and docs/free-only-policy.md.
- Prefer deterministic validation, existing CI, and Playwright; use AI only for design, implementation, and failure diagnosis.
- Do not repeatedly reread unchanged files or rerun checks CI already proves.

## Orchestration model
The outer development unit is an acceptance-goal convergence loop, not one PR.

1. Observe latest main, open autonomous PRs, and CI.
2. Reconcile relevant existing work first.
3. After every successful approved-scope merge, fetch/re-evaluate latest main.
4. Evaluate the active feature against explicit acceptance gates.
5. Select the highest-priority unmet gate that is safe to implement without human judgment.
6. Implement the smallest meaningful, reversible change on a branch.
7. Run deterministic tests, quality gate, and mobile checks when applicable.
8. Open/update a PR and let Autonomous quality gate run.
9. If CI passes and scope is already approved, merge and immediately return to step 1.
10. If CI fails, diagnose and repair up to three times before stopping as BLOCKED.

Creating a PR, passing CI, merging a PR, making meaningful progress, identifying a next task, or reaching a subjective percentage is never a valid stop reason.

## Allowed stop states
Only these states may terminate an autonomous run:

- COMPLETE: all acceptance gates for the active approved goal are satisfied and no next approved goal is available.
- HUMAN_REQUIRED: payment, authentication, irreversible action, or a major unresolved product/specification choice requires human judgment.
- BLOCKED: the same technical blocker remains after at most three repair attempts.
- EXECUTION_LIMIT: the execution environment cannot perform another required action in the current run.

Notifications and stopping are separate. Reporting a meaningful main-branch result must not itself terminate execution when another safe action remains executable.

## Acceptance state model
Acceptance gates use only UNKNOWN, PASS, FAIL, or BLOCKED. Percentage-complete estimates are prohibited because they are not objective stop criteria.

## Ocean/Aquarium active goal
Ocean/Aquarium must become a personal marine ecosystem that visibly grows as the user watches and rates films, not a genre map with fish substituted for genre nodes. The acceptance gates live in `docs/ocean-acceptance.md` and are re-evaluated from current main after each merge.

## Merge policy
For changes wholly inside already-approved scope, a successful Autonomous quality gate authorizes merge without another user confirmation. Human confirmation remains required only for HUMAN_REQUIRED cases above. Repository/tool protections may still prevent a merge; that is an execution constraint, not product approval.

## Safety
All changes remain branch/PR based, small, reversible, and deterministic-test-first. Existing navigation and recording journeys must remain reachable. Mobile horizontal overflow, console/page errors in core journeys, paid dependencies, scraping, trackers, and unauthorized external access remain failures.