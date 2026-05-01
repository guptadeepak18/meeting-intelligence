# API Phase 3 Scaffold

All endpoints are versioned under `/api/v1`.

## Auth

- `GET /auth/me`
- `POST /auth/memberships`

## Meetings

- `POST /meetings`
- `GET /meetings`
- `GET /meetings/:meetingId`
- `PATCH /meetings/:meetingId/status`
- `POST /meetings/:meetingId/upload-session`

## Transcripts

- `POST /transcripts/ingest`
- `GET /transcripts/meeting/:meetingId`

## Tasks

- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:taskId`
- `PATCH /tasks/:taskId/status`
- `PATCH /tasks/:taskId/assign/:userId`

## Notifications

- `POST /notifications/queue`
- `POST /notifications/dispatch/:notificationId`
- `GET /notifications`

## Dashboard

- `GET /dashboard/summary`

## AI

- `POST /ai/runs`
- `POST /ai/runs/:runId/extraction`
- `GET /ai/runs/:runId`

## Notes

- Meetings, transcripts, tasks, notifications, and AI modules are Prisma-backed via repositories.
- Auth guard requires `Authorization: Bearer <clerk_jwt>` and maps Clerk claims (`sub`, `org_id`, `org_role`, optional `team_id`) into the existing access scope contract.
- Repository methods enforce tenant and role-aware query scoping using mapped auth context.
