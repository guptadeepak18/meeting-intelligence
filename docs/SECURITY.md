# Security Baseline

## Controls Included in Scaffold

- Strict environment schema validation at startup via `@meeting-intelligence/config`
- Clerk JWT verification via issuer JWKS and bearer token auth guard
- Tenant- and role-scoped query enforcement in repository layer
- Planned PII-safe logging policy (no transcript/audio payloads)
- Planned retention jobs for audio and transcript lifecycle management

## Immediate Next Steps

1. Map production Clerk custom claims for team and role where required.
2. Add audit log tables for task creation, assignment, and status changes.
3. Add PII-safe structured logging and retention job executors.
