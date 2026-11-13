# Architecture

- **Next.js App Router**: server components read via Prisma; mutations are server actions that
  re-check membership and role on every call (`requireProjectAccess`, `src/lib/session.ts`).
- **Auth**: Auth.js credentials provider, JWT sessions, bcrypt hashes. Non-members get a 404.
- **Roles** (per project): Product Owner, Scrum Master, Developer. Rules live in
  `src/lib/permissions.ts`. Global `ADMIN` bypasses membership checks.
- **Pure logic** (unit-tested, no DB): `src/lib/{sprint,board,reports,permissions,validation}.ts`.
- **Reports**: burndown from `completedAt`, CFD reconstructed from `StatusChange` history, velocity
  from `committedPoints` (set on sprint start) and `completedPoints` (set on completion).
  Unfinished items return to the backlog when a sprint completes.
- **Export**: CSV via `/projects/[key]/reports/export`; PDF via the browser print dialog
  ("Save as PDF") on the reports page.
- **Board**: dnd-kit with optimistic updates, rolled back if the server action fails.

## Testing

`npm test` runs Vitest unit tests; `npm run test:e2e` runs Playwright against a throwaway `e2e.db`.
