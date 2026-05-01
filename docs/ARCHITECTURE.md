# Architecture Overview

Made with ❤️ at HyperBuild

## MVP Topology

- Next.js app (`apps/web`) deployed to Vercel
- NestJS API (`apps/api`) deployed as Vercel serverless functions or separate service
- PostgreSQL for relational workflow data
- Clerk for auth and tenant identity
- Managed Hugging Face inference for ASR and extraction

## Processing Flow

1. Audio is uploaded and linked to a meeting.
2. Meeting state moves to `processing_transcription`.
3. ASR provider returns diarized transcript segments.
4. Extraction prompt produces strict JSON action items.
5. Validation and assignment resolver persist tasks and notify assignees.

## Data Layer (Phase 2)

- Multi-tenant hierarchy tables: organizations, teams, users, memberships
- Meeting pipeline tables: meetings, participants, audio assets, transcripts, utterances
- Task and workflow tables: action_items, task_assignments, task_status_history, notifications
- AI traceability tables: prompt_templates, prompt_versions, ai_runs, extraction_results

See `docs/DATA_MODEL.md` and `packages/db/prisma/schema.prisma` for complete field-level definitions.
