import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { createMeetingSchema, extractionOutputSchema, taskStatusTransitionSchema, transcriptPayloadSchema } from '../../..';

describe('Shared contract compatibility', () => {
  it('accepts backend-compatible meeting creation payload', () => {
    const parsed = createMeetingSchema.parse({
      organizationId: '11111111-1111-4111-8111-111111111111',
      teamId: '22222222-2222-4222-8222-222222222221',
      title: 'Weekly engineering sync',
      scheduledAt: new Date().toISOString(),
      source: 'web',
      participants: ['manager@hyperbuild.dev', 'employee@hyperbuild.dev'],
    });

    expect(parsed.title).toBe('Weekly engineering sync');
  });

  it('accepts transcript payload used by transcript ingest endpoint', () => {
    const parsed = transcriptPayloadSchema.parse({
      meetingId: '33333333-3333-4333-8333-333333333333',
      provider: 'hf-whisper-adapter',
      language: 'en',
      confidence: 0.91,
      rawText: 'Jordan will send notes by Friday.',
      utterances: [
        {
          segmentIndex: 0,
          speakerLabel: 'Jordan',
          startMs: 0,
          endMs: 1000,
          text: 'Jordan will send notes by Friday.',
          confidence: 0.91,
        },
      ],
    });

    expect(parsed.utterances.length).toBe(1);
  });

  it('accepts extraction output contract for persisted action items', () => {
    const parsed = extractionOutputSchema.parse({
      actionItems: [
        {
          title: 'Send release notes',
          ownerCandidate: 'Jordan',
          dueDate: new Date().toISOString(),
          priority: 'medium',
          confidence: 0.82,
          rationale: 'Extracted from commitment statement.',
        },
      ],
    });

    expect(parsed.actionItems[0]?.priority).toBe('medium');
  });

  it('accepts task status transition payloads used by frontend', () => {
    const parsed = taskStatusTransitionSchema.parse({
      actionItemId: '44444444-4444-4444-8444-444444444444',
      fromStatus: 'todo',
      toStatus: 'in_progress',
      reason: 'Started implementation',
    });

    expect(parsed.toStatus).toBe('in_progress');
  });
});
