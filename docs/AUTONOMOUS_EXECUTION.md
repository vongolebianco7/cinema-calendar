# Cinemap autonomous execution contract

Cinemap development uses the same queue-oriented control loop for every implementation task.

## State machine

`BACKLOG -> READY -> IN_PROGRESS -> VERIFY -> APPLY -> STATE_UPDATE -> READY`

Verification failure transitions back to `IN_PROGRESS` through `ROOT_CAUSE -> FIX -> VERIFY`.

Progress events are never terminal states. Creating a commit or PR, receiving a tool result, starting CI, CI success, asset inspection, and posting progress are inputs to the next transition.

## Allowed STOP conditions

Execution may stop only when one of these is true:

1. `QUEUE_EMPTY`: all currently defined work is complete.
2. `USER_DECISION_REQUIRED`: two or more materially different product choices remain and prior agreements do not resolve them.
3. `AUTH_OR_PERMISSION_BLOCK`: required authentication or permission cannot be completed by the agent.
4. `SAFETY_OR_POLICY_BLOCK`: the required action is prohibited.
5. `REPAIR_EXHAUSTED`: the same blocking failure remains after three evidence-based repair attempts.
6. `EXTERNAL_WAIT_NO_RESUME`: an external asynchronous operation is still pending and the current execution environment provides no continuation mechanism. This must be reported as stopped, never as running in the background.

Everything else transitions to the next state automatically.

## Verification loop

For each task:

1. Implement the smallest coherent change.
2. Run deterministic tests.
3. Run the relevant mobile/Ocean visual smoke gate when UI is affected.
4. On failure, inspect evidence, repair, and rerun (maximum three repair attempts for the same blocker).
5. On success, apply/merge when permitted.
6. Verify the applied state.
7. Update queue state and immediately select the next ready task.

## Reporting

Progress reporting does not terminate execution. A final report is produced only at an allowed STOP condition. Never claim background execution after the execution turn has ended.
