# Cinemap autonomous execution contract

Cinemap development is a reply-before-complete self-loop, not a sequence of one-tool conversational turns.

## Persistent queue states

Every task is explicitly one of:

`BACKLOG -> READY -> RUNNING -> VERIFY -> APPLY -> DONE`

`WAITING` is non-terminal: immediately schedule another `READY` task when one exists. `BLOCKED` is terminal only when it matches an allowed STOP condition below.

Verification failure transitions through `ROOT_CAUSE -> REPAIR -> UNIT -> INTEGRATION -> SYSTEM`; a repair always restarts all three verification stages.

## Visible progress protocol

Before each material tool/action transition, emit a short progress event naming the current action (for example `Ocean: integration test` or `main: deploy verification`). A progress event is not a final response and MUST NOT end the self-loop.

Tool results, commits, PR creation, CI start/success, asset inspection, merge, deploy start, and progress events are all non-terminal inputs to `NEXT_ACTION` selection.

## Reply-before-complete guard

A final response is forbidden while any of these are non-zero:

- `READY`
- `RUNNING`
- `VERIFY`
- `REPAIRABLE`
- `APPLY`
- any executable `NEXT_ACTION`

Before final response, re-evaluate the queue. If any executable action exists, cancel finalization and return to `SELECT -> PROGRESS -> EXECUTE -> OBSERVE -> STATE_UPDATE -> NEXT_ACTION`.

## Allowed STOP conditions

Execution may stop only when one of these is true:

1. `QUEUE_EMPTY`: all currently defined work is complete.
2. `USER_DECISION_REQUIRED`: materially different product choices remain and prior agreements do not resolve them.
3. `AUTH_OR_PERMISSION_BLOCK`: required authentication or permission cannot be completed by the agent.
4. `SAFETY_OR_POLICY_BLOCK`: the required action is prohibited.
5. `REPAIR_EXHAUSTED`: the same blocking failure remains after three evidence-based repair attempts.
6. `EXTERNAL_WAIT_NO_RESUME`: only external asynchronous work remains, no independent READY work exists, and the current execution environment cannot wait/resume. Report this as stopped, never as background work.

## Three-stage quality gate

Every implementation uses, in order:

1. `UNIT`: changed logic/contracts in isolation.
2. `INTEGRATION`: connected feature/data/DOM or service flow.
3. `SYSTEM`: build + security/compliance + primary iPhone/mobile user journey when UI is affected.

Any failure routes to root cause and repair, then restarts at UNIT.

## Post-merge completion

Merge is not DONE. Completion requires:

`MERGE -> MAIN_SHA -> MAIN_QUALITY -> DEPLOY -> PRIMARY_SURFACE/DEVICE_CHECK (when applicable) -> DONE`

A failed optional/legacy deploy provider does not invalidate a successful primary deployment if it is explicitly classified as non-primary and the primary surface is verified.

## Autonomy acceptance test

The autonomy mechanism itself is tested at three levels:

- Unit: queue states, STOP whitelist, repair restart, and final guard are present and deterministic.
- Integration: one execution turn chains multiple real tool operations through a non-terminal intermediate result without user prompting.
- System: a real Cinemap task shows visible progress events and reaches DONE or a legitimate BLOCKED condition before the final response.

Documentation alone never proves this acceptance test.
