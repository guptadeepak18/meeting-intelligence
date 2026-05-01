import { describe, expect, it, vi } from 'vitest';
import { AiService } from '../modules/ai/ai.service';
import { MeetingsService } from '../modules/meetings/meetings.service';
import { TranscriptsService } from '../modules/transcripts/transcripts.service';
import type { AuthUser } from '../modules/common/auth-user.interface';

const authUser: AuthUser = {
  id: 'u-admin',
  organizationId: 'org-1',
  role: 'admin',
  teamId: 'team-1',
};

describe('Meeting Pipeline Integration Flow', () => {
  it('runs meeting creation -> transcript ingest -> AI process workflow', async () => {
    const meetingStore = {
      id: 'meeting-1',
      organizationId: 'org-1',
      title: 'Weekly sync',
      status: 'uploaded',
      transcripts: [] as Array<{
        rawText: string | null;
        utterances: Array<{ text: string }>;
      }> ,
    };

    const meetingsRepository = {
      create: vi.fn().mockResolvedValue(meetingStore),
      list: vi.fn(),
      getById: vi.fn(),
      updateStatus: vi.fn(),
      ensureMeetingExists: vi.fn(),
    };

    const transcriptsRepository = {
      create: vi.fn().mockImplementation(async ({ rawText }: { rawText?: string }) => {
        meetingStore.transcripts.unshift({
          rawText: rawText ?? null,
          utterances: [{ text: rawText ?? '' }],
        });
        return { id: 'transcript-1' };
      }),
      listByMeeting: vi.fn().mockResolvedValue([]),
    };

    const aiRepository = {
      prepareMeetingProcessing: vi.fn().mockImplementation(async () => meetingStore),
      setMeetingStatus: vi.fn().mockResolvedValue(undefined),
      getOrCreateActivePromptVersion: vi.fn().mockResolvedValue({
        id: 'prompt-1',
        modelId: 'mistralai/Mistral-7B-Instruct-v0.3',
      }),
      createOrReuseRun: vi.fn().mockResolvedValue({ id: 'run-1', status: 'running' }),
      saveTranscriptIfMissing: vi.fn().mockResolvedValue({ id: 'transcript-1' }),
      listOrganizationUsers: vi.fn().mockResolvedValue([{ id: 'u-employee', email: 'employee@hyperbuild.dev', displayName: 'Jordan' }]),
      persistExtractionAndTasks: vi.fn().mockResolvedValue({
        extractionResult: { id: 'ext-1' },
        createdTaskIds: ['task-1'],
      }),
      markRunFailed: vi.fn().mockResolvedValue(undefined),
      getRun: vi.fn(),
    };

    const meetingsService = new MeetingsService(meetingsRepository as any);
    const transcriptsService = new TranscriptsService(transcriptsRepository as any);
    const aiService = new AiService(
      aiRepository as any,
      { normalizeTranscript: vi.fn().mockReturnValue([{ segmentIndex: 0, startMs: 0, endMs: 1000, text: 'Jordan will send notes.' }]) } as any,
      {
        extract: vi.fn().mockResolvedValue({
          actionItems: [
            {
              title: 'Jordan will send notes',
              ownerCandidate: 'Jordan',
              dueDate: null,
              priority: 'medium',
              confidence: 0.8,
              rationale: 'Commitment sentence',
            },
          ],
        }),
      } as any,
      { resolveOwner: vi.fn().mockReturnValue('u-employee') } as any,
    );

    await meetingsService.create(authUser, {
      organizationId: 'org-1',
      teamId: 'team-1',
      title: 'Weekly sync',
      participants: ['employee@hyperbuild.dev'],
    });

    await transcriptsService.ingest(authUser, {
      meetingId: 'meeting-1',
      provider: 'hf-whisper-adapter',
      rawText: 'Jordan will send notes.',
      utterances: [
        {
          segmentIndex: 0,
          startMs: 0,
          endMs: 1000,
          text: 'Jordan will send notes.',
        },
      ],
    });

    const processResult = await aiService.processMeeting(authUser, 'meeting-1', {});

    expect(processResult).toEqual({
      runId: 'run-1',
      idempotencyKey: 'meeting:meeting-1:prompt:prompt-1:v1',
      extractionResultId: 'ext-1',
      createdTaskIds: ['task-1'],
    });
    expect(transcriptsRepository.create).toHaveBeenCalledTimes(1);
    expect(aiRepository.persistExtractionAndTasks).toHaveBeenCalledTimes(1);
  });
});
