# Prisma Migrations

This folder is intentionally committed for migration history.

Generate the first migration from the Phase 2 schema with:

```bash
pnpm --filter @meeting-intelligence/db db:migrate --name phase2_init
```

Commit the generated migration SQL and lock file after reviewing table/index changes.
