# hemanth — Agile Software Development Project Tracking and Reporting System

Isolated project. Do not import from or reference `../karthik` or `../Dhanush`. Run all commands from this directory.

## Goal
A web app for agile teams to plan sprints, manage backlogs and boards, track progress, and generate reports (burndown, velocity, sprint summaries).

## Tech Stack (planned)
- Full-stack: Next.js (App Router) + TypeScript
- Database: PostgreSQL via Prisma ORM (SQLite for local dev)
- Auth: Auth.js (NextAuth) with credentials; roles: Product Owner, Scrum Master, Developer
- UI: Tailwind CSS + shadcn/ui; drag-and-drop with dnd-kit
- Charts: Recharts (burndown, velocity)
- Reports export: PDF/CSV
- Deployment: Vercel + Neon Postgres
- Testing: Vitest, Playwright (e2e)

## Planned Structure
```
hemanth/
  prisma/schema.prisma
  src/app/            # routes, API handlers
  src/components/
  src/lib/
  tests/
  docs/
  CLAUDE.md  README.md  .gitignore
```

## Core Features
1. Projects and team members with roles
2. Product backlog: epics, user stories, tasks, bugs; priority and story points
3. Sprint planning: create sprint, move stories in, set goal and dates
4. Kanban board (To Do / In Progress / Review / Done) with drag-and-drop
5. Daily progress tracking: status changes, time/effort updates, comments
6. Reports: burndown chart, velocity per sprint, sprint summary, cumulative flow
7. Retrospective notes and action items
8. Dashboard with project health and blockers

## Milestones
- M1: Next.js scaffold, Prisma schema, seed data
- M2: Auth + roles + projects
- M3: Backlog and sprint management
- M4: Kanban board
- M5: Reports and charts (burndown, velocity), export
- M6: Retro module, dashboard, polish
- M7: Deployment, e2e tests, docs, final report

## Conventions
- Strict TypeScript; ESLint + Prettier
- Secrets only in `.env` (git-ignored); commit `.env.example`
- Conventional commit messages
