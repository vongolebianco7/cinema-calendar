# Free-only infrastructure policy

Cinemap must remain operable without adding paid infrastructure.

## Hard rule
- No paid plan, paid API, metered external service, paid database, paid AI API, or automatic overage purchase may be introduced by an agent.
- A free tier is acceptable only when exceeding it does not silently create a charge. If billing behavior is uncertain, stop and require human confirmation.
- Secrets for billing-enabled services must not be added merely to bypass a free-tier limit.

## Deployment
- CI validation is preferred over preview deployments.
- Frontend production deploy: only after main is updated and required checks pass.
- Backend deploy: only when backend/** changes.
- Documentation, tests, workflow-only, and agent-rule changes must not trigger application deployment.

## Advanced development
Free-only does not mean low-quality. Architecture, design, implementation, browser QA, security/compliance checks, and deterministic tests may all be used. Route expensive reasoning only to genuinely complex tasks and keep repeatable verification deterministic.
