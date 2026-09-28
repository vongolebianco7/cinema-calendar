# Cloudflare Pages setup (free-only)

This repository's root static frontend can be deployed as a Pages project without a framework build.

Recommended initial setup:
- Production branch: main
- Framework preset: None
- Build command: leave empty
- Build output directory: .
- Root directory: repository root

Safety:
- Keep the existing production host active during verification.
- Do not attach a paid Workers plan, paid storage, paid analytics, or billing-enabled add-on.
- Do not migrate backend/ in this phase.
- Validate the Pages URL with the existing mobile smoke/core journey checks before changing the public production endpoint.

Deployment minimization:
- Use GitHub CI as the normal PR validation path.
- Avoid creating a Pages deployment merely to validate documentation/tests/workflow changes.
