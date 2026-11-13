# Final Report

## Delivered

| Milestone | Scope                                                                       | Status                                           |
| --------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| M1        | Scaffold, Prisma schema, seed data                                          | Done                                             |
| M2        | Auth, roles, projects and members                                           | Done                                             |
| M3        | Backlog (epics, stories, tasks, bugs), sprint planning                      | Done                                             |
| M4        | Kanban board with drag-and-drop, comments, time logs, status history        | Done                                             |
| M5        | Burndown, velocity, cumulative flow, sprint summary, CSV/PDF export         | Done                                             |
| M6        | Retrospectives and action items, project dashboard with health and blockers | Done                                             |
| M7        | Playwright e2e, docs, deployment guide                                      | Done (deployment steps documented, not executed) |

## Verification

Typecheck, ESLint, 21 Vitest unit tests and 6 Playwright e2e tests (login guard, bad credentials,
role-based UI, backlog creation, drag-and-drop persistence, reports and CSV) all pass.

## Known limitations

- Production deployment to Vercel/Neon was not performed; see `docs/deployment.md`.
- Backlog ordering uses priority then creation order; there is no drag-to-reorder in the backlog yet.
- Registration is open: anyone can sign up, but can only see projects they are a member of.
- No rate limiting on login.
- Burndown is derived from completion timestamps, so scope changes mid-sprint are not shown.
