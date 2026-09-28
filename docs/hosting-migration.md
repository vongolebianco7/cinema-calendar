# Hosting migration plan

## Objective
Reduce deploy-limit pressure without reducing Cinemap's ability to support advanced development.

## Current split
- Frontend: predominantly static HTML/JS/assets. Candidate for Cloudflare Pages.
- Backend: Next.js + Prisma under `backend/`. Keep on the current backend host initially.

## Target phase 1
1. Keep current production untouched.
2. Create a Cloudflare Pages preview for the static frontend.
3. Run the same mobile smoke/core journey checks against the preview.
4. Compare critical navigation and API calls with current production.
5. Only after verification, switch the frontend production endpoint.
6. Keep backend independently deployable.

## Deploy discipline
- Feature branches: no production deployment.
- Pull requests: GitHub Actions/Playwright is the default validation surface.
- main: one production frontend deployment after required checks pass.
- Backend deploys only when `backend/**` changes.
- Do not deploy documentation/tests/scripts-only changes.

## Rollback
Do not delete or disable the current Vercel frontend until Cloudflare production is verified. A hosting migration must have an immediate rollback path.

## Cost constraint
Do not introduce a paid plan, metered API, or billable external service without explicit human approval.
