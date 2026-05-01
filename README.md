# Meeting Intelligence Monorepo

Made with ❤️ at HyperBuild

This repository contains the Phase 1 monorepo scaffold for the Meeting Intelligence MVP.

## Workspace Layout

- `apps/web`: Next.js frontend on Vercel
- `apps/api`: NestJS backend API
- `packages/shared`: Shared contracts and prompt artifacts
- `packages/config`: Environment schema and startup config validation
- `packages/db`: Prisma data schema and seed entry point
- `docs`: Architecture, security, API docs, and ADRs
- `infra`: Vercel and storage configuration stubs

## Quick Start

1. Install dependencies
2. Copy `.env.example` to `.env` and provide values
3. Start all services

```bash
pnpm install
pnpm dev
```

## Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```
