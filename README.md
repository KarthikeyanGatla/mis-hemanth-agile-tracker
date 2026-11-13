# Agile Software Development Project Tracking and Reporting System

Agile Software Development Project Tracking and Reporting System

See CLAUDE.md for the plan, stack, and milestones.

## Getting started

```
npm install
cp .env.example .env
npx prisma migrate dev   # create SQLite dev DB
npm run db:seed          # demo data (login: priya@example.com / password123)
npm run dev
```

Scripts: `typecheck`, `lint`, `test`, `format`, `db:reset`.

## Testing

`npm test` (unit) and `npm run test:e2e` (Playwright, isolated database).

## Status

All milestones M1-M7 are implemented. See `docs/architecture.md`, `docs/deployment.md` and
`docs/final-report.md`.
