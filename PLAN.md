## Plan: Meeting Intelligence MVP on Vercel

Build a production-oriented MVP using Next.js + NestJS TypeScript services, PostgreSQL, Clerk auth, and batch-first meeting processing. Because you prefer all-on-Vercel, use Vercel-hosted web/API orchestration and managed AI endpoints for open-source models (Hugging Face Inference/Endpoints) instead of self-hosted GPU workers. This preserves feasibility, controls cost, and keeps the architecture modular for later real-time and self-hosted AI upgrades.

**Steps**
1. Phase 1: Foundation and repo bootstrap
2. Create a monorepo structure with apps and packages so frontend, backend, and shared contracts evolve together. Define workspaces, strict TypeScript config, linting, formatting, env schema validation, and CI gates. This is the dependency base for all later phases.
3. Define architecture decision records (ADRs) for: NestJS backend, Clerk auth, Vercel deployment model, batch-first ingestion, and Hugging Face-managed inference for open-source models. This reduces future architecture drift.
4. Configure environment contracts for local/dev/prod: database URL, Clerk keys, storage keys, AI provider keys, webhook secrets, and encryption settings. Add startup validation to fail fast on misconfiguration.
5. Phase 2: Domain and data model design (depends on Phase 1)
6. Design PostgreSQL schema for multi-tenant org hierarchy and meeting intelligence workflow:
7. `organizations`, `teams`, `users`, `memberships` (role-based hierarchy)
8. `meetings`, `meeting_participants`, `audio_assets`, `transcripts`, `utterances`
9. `action_items`, `task_assignments`, `task_status_history`, `notifications`
10. `ai_runs`, `prompt_templates`, `prompt_versions`, `extraction_results`
11. Add migration strategy and seed scripts for sample org/team/users/meetings. Define lifecycle and retention columns for privacy and cost management.
12. Define DTO and schema contracts (zod/class-validator) shared between web and API for strong typing and Copilot-friendly autocompletion.
13. Phase 3: Backend API and orchestration (depends on Phases 1-2)
14. Implement NestJS modules by bounded context:
15. Auth module: Clerk JWT verification, RBAC guards (`admin`, `manager`, `employee`).
16. Meeting module: create/list meetings, participant mapping, upload session creation.
17. Transcript module: receive batch transcription payloads and diarized utterances.
18. Task module: CRUD, status transitions (`todo`, `in_progress`, `done`), hierarchy-safe assignment logic.
19. Notification module: queue and dispatch email/in-app reminders.
20. Dashboard module: summary and analytics APIs.
21. Add API-first OpenAPI generation and versioned endpoints (`/v1/...`) to keep frontend/backend contract stable.
22. Phase 4: AI pipeline for extraction (depends on Phase 3; parts parallel with Phase 5)
23. Build batch pipeline stages:
24. Audio uploaded and meeting state set to `processing_transcription`.
25. Transcription adapter calls open-source model endpoint (Hugging Face-hosted Whisper-compatible or ASR pipeline).
26. Diarized transcript normalized into utterance schema.
27. LLM extraction prompt generates strict JSON containing tasks, owner candidates, due dates, priorities, confidence, and rationale.
28. Validation layer enforces schema, retries on malformed output, stores prompt/version/run metadata.
29. Assignment resolver maps extracted owners to organization users (exact email/name match, then fuzzy fallback with human confirmation state).
30. Persist action items and create notifications for assignees/managers.
31. Include idempotency keys and job status tracking to prevent duplicate extraction on retried webhooks.
32. Phase 5: Frontend app on Vercel (depends on Phase 3; parallel with Phase 4 after contracts stabilize)
33. Build Next.js app routes:
34. Auth and tenant selection flow via Clerk.
35. Meetings page with batch upload and processing state timeline.
36. Meeting detail page with transcript viewer (speaker segments) and extracted action items.
37. Task board with filters by team/owner/status/priority/deadline.
38. Dashboard with meeting summaries, completion rates, overdue items, and per-employee trend snapshots.
39. Implement optimistic updates for task status changes, plus server reconciliation for consistency.
40. Phase 6: Notifications and scheduled automation (depends on Phases 3-5)
41. Implement notification providers:
42. In-app notifications (database-backed).
43. Email reminders (Resend/SendGrid adapter).
44. Optional Slack adapter for digest posts.
45. Add daily reminder scheduler for incomplete tasks and manager digest reports.
46. Add user preferences for channel and quiet hours.
47. Phase 7: Security, privacy, and compliance baseline (parallel with Phases 4-6)
48. Enforce encryption in transit and encrypted object storage for audio.
49. Add role- and tenant-scoped query guards for every read/write path.
50. Add PII-aware logging strategy: no raw transcript/audio in app logs.
51. Add data retention jobs (audio deletion/archive windows and transcript purge policy).
52. Add audit logs for task creation/assignment/status changes.
53. Phase 8: Performance and cost controls (depends on Phases 4-6)
54. Add queue/concurrency controls to avoid Vercel function timeouts.
55. Cache computed summaries and dashboard aggregates.
56. Apply token/cost optimization: chunked transcript processing, prompt compression, and confidence-based reprocessing only when needed.
57. Add fallback path when AI extraction confidence is low (human review queue instead of auto-assign).
58. Phase 9: Testing, observability, and launch readiness (depends on all prior phases)
59. Add unit tests for extraction parser, assignment resolver, RBAC guards, and task state machine.
60. Add integration tests for end-to-end flow: meeting upload to transcript to action item creation.
61. Add contract tests to enforce frontend/backend DTO compatibility.
62. Add structured telemetry (request IDs, meeting IDs, AI run IDs), error tracking, and dashboards.
63. Define release checklist and staged rollout (pilot team first, then org-wide).

**Relevant files**
- /apps/web/package.json — Next.js app dependencies and scripts.
- /apps/web/src/app/... — app routes for meetings, tasks, dashboard, auth callbacks.
- /apps/web/src/components/... — reusable UI blocks (transcript viewer, task board, analytics cards).
- /apps/api/package.json — NestJS app dependencies and scripts.
- /apps/api/src/main.ts — API bootstrap, global pipes, OpenAPI init.
- /apps/api/src/modules/auth/... — Clerk verification and RBAC guards.
- /apps/api/src/modules/meetings/... — meeting and upload orchestration.
- /apps/api/src/modules/transcripts/... — transcript ingestion and diarization normalization.
- /apps/api/src/modules/tasks/... — task CRUD, assignment rules, status machine.
- /apps/api/src/modules/notifications/... — reminder scheduling and provider adapters.
- /apps/api/src/modules/dashboard/... — analytics aggregations and reporting APIs.
- /apps/api/src/modules/ai/... — prompt templates, extraction pipeline, validation/retry logic.
- /packages/shared/src/contracts/... — shared DTOs, enums, zod schemas.
- /packages/shared/src/prompts/... — reusable extraction prompts and output schemas.
- /packages/db/prisma/schema.prisma (or /packages/db/src/migrations/...) — relational schema and migrations.
- /packages/config/... — shared env validation and config loaders.
- /infra/vercel.json — Vercel routing/function settings.
- /infra/storage/... — storage policy docs/config and lifecycle settings.
- /docs/ARCHITECTURE.md — system architecture and sequence diagrams.
- /docs/API.md — endpoint contracts and payload examples.
- /docs/SECURITY.md — privacy, retention, and access controls.
- /docs/ADR/... — decision records for major architecture choices.

**Verification**
1. Local validation: run lint, typecheck, unit tests, integration tests, and OpenAPI generation in CI.
2. Pipeline validation: upload a recorded stand-up audio file and verify state transitions from `uploaded` to `transcribed` to `tasks_created`.
3. Extraction quality validation: compare extracted tasks/owners/deadlines against a labeled sample set and track precision/recall per field.
4. RBAC validation: verify manager-to-employee assignment constraints and tenant isolation with role-switched test users.
5. Notification validation: confirm daily reminders and digest schedules deliver to configured channels.
6. Cost/latency validation: measure median and p95 processing latency per 30-minute meeting; track per-meeting AI cost and storage growth.
7. Security validation: ensure no transcript/audio payload appears in application logs and retention jobs remove expired assets.

**Decisions**
- Included scope: batch-first meeting intelligence, structured task extraction, assignment and tracking, dashboard reporting, notifications, RBAC, and Copilot-friendly modular architecture.
- Excluded from MVP: live real-time transcription, live in-meeting suggestions, Jira/Teams deep sync, sentiment analytics, and voice command controls.
- Backend stack selected: Node.js + NestJS.
- Auth selected: Clerk.
- Deployment preference applied: all-on-Vercel orchestration.
- AI provider approach to honor all-on-Vercel constraint: open-source models consumed via managed Hugging Face endpoints rather than self-hosted GPU workers.

**Further Considerations**
1. Open-source model hosting choice: Hugging Face Inference API (fastest setup) vs dedicated Hugging Face Endpoint (better throughput control) vs self-hosted GPU later (lowest long-term unit cost at scale).
2. Database provider on Vercel ecosystem: Neon vs Supabase vs managed Postgres on another cloud, balancing cost, branching workflows, and connection pooling.
3. Queue strategy under Vercel constraints: hosted queue (Upstash/QStash) vs durable workflow orchestrator (Inngest/Temporal Cloud) depending on expected concurrent meetings.