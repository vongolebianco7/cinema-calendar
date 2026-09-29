# Autonomous Development Loop

This document is the operational companion to `AGENTS.md`.

```text
observe latest main + PR/CI
        |
        v
reconcile existing autonomous work
        |
        v
evaluate active acceptance gates
        |
        v
pick highest-priority safe unmet gate
        |
        v
implement -> deterministic verify -> PR -> CI
        |                               |
        | failure: diagnose/repair <=3  | pass + approved scope
        +-------------------------------+--> merge
                                             |
                                             v
                                      re-observe latest main
                                             |
                                             +----> loop
```

The controller must not return merely because a PR was created, CI passed, or a PR was merged. `merge` transitions back to observation of latest `main`.

Pseudo-controller:

```python
while True:
    main = fetch_latest_main()
    reconcile_relevant_prs_and_ci(main)
    evaluation = evaluate_active_acceptance_gates(main)

    if evaluation.all_pass:
        if activate_next_approved_goal():
            continue
        stop("COMPLETE")

    target = evaluation.highest_priority_safe_unmet_gate()
    if target.requires_human_judgment:
        stop("HUMAN_REQUIRED")

    result = implement_and_verify(target)
    if result.same_blocker_after_three_repairs:
        stop("BLOCKED")

    pr = open_or_update_pr(result)
    if autonomous_quality_gate(pr).passed and pr.within_approved_scope:
        merge(pr)
        continue
```

If the execution environment cannot perform the next required action, persist enough context to resume and stop as `EXECUTION_LIMIT`. Notifications are not `return` statements.
