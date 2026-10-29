# Requested performance measurements

The 2026-10-29 request authorizes autonomous implementation. Preserve all product UI, storage, deployment guards and existing CI budgets. Add a separate, explicit assessment of the requested targets: initial readiness <=2000ms, tab <=300ms, cached tab <=200ms, review <=200ms, search <=1000ms, scrolling target >=60fps.

Use the existing Playwright/local server pattern and synthetic records; reject missing, non-finite and negative measurements. Measure in the page clock through a painted frame, separating tab switching from record filtering. Report environment, dataset, route, engine and source SHA. Synthetic local measurements must never be described as physical iPhone or live TMDB latency.

Approaches: modifying the old scorecard thresholds would mix different timing definitions and break historical comparisons; a separate report preserves that baseline while exposing target failures. Choose the separate report. Do not claim improvements until the same harness runs before/after a product change. External search and whole-service cache coverage remain unmeasured.
