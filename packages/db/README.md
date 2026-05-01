# Database Package

Phase 2 introduces a relational schema for org hierarchy, meetings, transcripts, tasks, notifications, and AI run metadata.

## Migration Strategy

Before running Prisma commands, ensure `packages/db/.env` exists with `DATABASE_URL`.

```bash
cp packages/db/.env.example packages/db/.env
```

1. Local development:

```bash
pnpm --filter @meeting-intelligence/db db:migrate --name phase2_init
```

2. CI and production deployment:

```bash
pnpm --filter @meeting-intelligence/db db:migrate:deploy
```

3. Regenerate Prisma client when schema changes:

```bash
pnpm --filter @meeting-intelligence/db db:generate
```

4. Seed baseline data:

```bash
pnpm --filter @meeting-intelligence/db db:seed
```

## Retention and Lifecycle Notes

- `retentionUntil` is tracked for meetings, audio, and transcripts.
- `deletedAt` on `audio_assets` supports delayed hard delete after archive grace period.
- Organization-level `retentionDays` is the policy anchor for future retention jobs.
