# Verified source configuration during backend quality checks

The production backend proof now passes, but the following quality gate reads Vercel's backend configuration at root as if it were the frontend project configuration. Local reproduction produced12 configuration assertion failures. Keep the effective backend configuration in place for its compiler; configuration assertions must inspect the verified frontend source only inside this already-proved backend quality subprocess.

1. Add a narrow source-configuration reader. Ordinary CI/local calls read working files. The verified backend marker additionally requires VERCEL=1 and exact committed configuration equality; arbitrary root mutations throw.
2. Set that marker only after the real production proof succeeds and only for a backend caller; discard inherited markers for frontend/DB/local contexts. Keep the proof and full quality gate mandatory.
3. Route the five frontend configuration assertions through the reader. Preserve all commands, thresholds, route, asset and dirty-source assertions.
4. Run the complete quality gate with exact backend configuration materialized at root in backend CI. Restore the source file in finally; keep the normal full gate too.
5. Track the new guard helper as a publication input for both projects. Verify actual Git fixture changes rebuild both projects.
6. Review, source CI, receipt-only proof, final CI, then run the complete local production check with materialized configuration before merge. Verify actual backend canonical publication/API responses after integration.

No logo/color, source/data policy, DB operation, paid service, origin or saved-record change. Legal/device/independent-user and Neon quota gates remain external.
