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

## Status
- [x] M1: Next.js scaffold, Prisma schema, seed data
- [x] M2: auth, roles, projects
- [ ] M3 onwards: see CLAUDE.md

