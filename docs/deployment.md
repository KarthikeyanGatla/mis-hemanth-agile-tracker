# Deployment (Vercel + Neon Postgres)

Local development uses SQLite. Production uses Postgres, which needs three changes:

1. `prisma/schema.prisma`: set `provider = "postgresql"` in the `datasource` block.
2. `src/lib/db.ts` and `prisma/seed.ts`: swap `@prisma/adapter-better-sqlite3` for
   `@prisma/adapter-pg` (`new PrismaPg({ connectionString: process.env.DATABASE_URL })`) and
   `npm i @prisma/adapter-pg`.
3. Regenerate migrations against Postgres: delete `prisma/migrations`, then
   `DATABASE_URL=<neon url> npx prisma migrate dev --name init`.

## Steps

1. Create a Neon project and copy its pooled connection string.
2. In Vercel, import the repo and set environment variables:
   - `DATABASE_URL`: the Neon connection string
   - `AUTH_SECRET`: output of `openssl rand -base64 32`
3. Build command: `prisma migrate deploy && next build`. `postinstall` already runs `prisma generate`.
4. Optionally seed once: `DATABASE_URL=<neon url> npx prisma db seed` (demo data; wipes tables first, so never run it on real data).

## Notes

- Remove `serverExternalPackages` entries for better-sqlite3 from `next.config.ts` once on Postgres.
- Vercel needs no `AUTH_TRUST_HOST`; it is detected automatically.
