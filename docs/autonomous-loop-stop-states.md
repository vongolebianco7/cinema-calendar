# Autonomous loop stop states

Legal terminal states are exactly:

- `COMPLETE`
- `HUMAN_REQUIRED`
- `BLOCKED`
- `EXECUTION_LIMIT`

`PR_CREATED`, `CI_PASSED`, `MERGED`, `PROGRESS_REPORTED`, `MOSTLY_COMPLETE`, and percentage milestones are not terminal states. After `MERGED`, execution transitions to latest-main observation and acceptance-gate evaluation.
