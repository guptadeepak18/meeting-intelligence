# Data Model (Phase 2)

## Core Hierarchy

- `organizations`
- `teams`
- `users`
- `memberships` (with role-based access scope)

## Meeting Intelligence Workflow

- `meetings`
- `meeting_participants`
- `audio_assets`
- `transcripts`
- `utterances`

## Task Management

- `action_items`
- `task_assignments`
- `task_status_history`
- `notifications`

## AI Orchestration and Traceability

- `prompt_templates`
- `prompt_versions`
- `ai_runs`
- `extraction_results`

## Retention and Privacy Columns

- `organizations.retentionDays`
- `meetings.retentionUntil`
- `audio_assets.retentionUntil`
- `audio_assets.deletedAt`
- `transcripts.retentionUntil`

These fields are the baseline for future retention jobs and privacy controls.
