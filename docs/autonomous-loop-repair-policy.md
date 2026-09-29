# Autonomous repair policy

For a deterministic implementation or CI failure, diagnose the cause and repair the same blocker at most three times. If it remains unresolved after the third repair attempt, stop as `BLOCKED` with the failure evidence. A failure does not justify silently switching to paid services, scraping, destructive actions, or bypassing the quality gate.
