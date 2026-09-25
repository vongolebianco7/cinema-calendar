# CINEMA DAYS backend

Minimal API-first backend that can be deployed independently from the current GitHub Pages frontend.

## Stack

- Next.js + TypeScript
- PostgreSQL
- Prisma
- Vercel-compatible Route Handlers

## API

- `GET /api/health`
- `GET /api/movies?q=&limit=`
- `GET /api/releases?from=YYYY-MM-DD&to=YYYY-MM-DD&service=`

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a PostgreSQL connection string.
3. Run `npm install`.
4. Run `npm run db:sync`.
5. Run `npm run dev`.

`db:sync` creates the schema and imports the existing `../data/movies.json` and `../data/streaming.json`.

The current production frontend is intentionally unchanged. Once the backend is deployed and verified, switch the calendar's data fetch from JSON files to these endpoints.


<!-- Deploy marker: v0.5.2 -->
