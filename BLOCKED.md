# Blocked

Items that need the product owner. Nothing here blocks the demo.

1. **Database mode has not been run against a live Postgres.** The Prisma repository, migration and seed are written and type-checked, but no Postgres was available in this environment. To unblock, provide a `DATABASE_URL` (or run `docker compose up -d db`), then run `npx prisma migrate deploy` and `npm run db:seed`.
2. **Deploy.** The Vercel setup is prepared but not performed. It needs your Vercel account, plus `AUTH_SECRET` and `QR_SECRET` set to two different random values.
3. **Performance on a deployed host.** The Lighthouse numbers in `docs/QA_REPORT.md` come from localhost. Re-measure after deploying.
