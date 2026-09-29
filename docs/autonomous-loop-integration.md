# Merge transition

For an approved-scope PR with a successful Autonomous quality gate:

`MERGE -> FETCH LATEST MAIN -> RECONCILE PR/CI -> RE-EVALUATE ACCEPTANCE GATES -> SELECT NEXT SAFE UNMET GATE`

There is intentionally no terminal transition attached to `MERGE`.
