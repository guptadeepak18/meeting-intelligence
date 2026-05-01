import { describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../common/auth-user.interface';
import { AiService } from '../ai.service';

const authUser: AuthUser = {
  id: 'u-admin',
  organizationId: 'org-1',
  role: 'admin',
  teamId: 'team-1',
};

describe('AiService', () => {
  it('processes a meeting and persists tasks', async () => {
    const aiRepository = {
      prepareMeetingProcessing: vi.fn().mockResolvedValue({
        id: 'meeting-1',
        organizationId: 'org-1',
        transcripts: [],
      }),
      setMeetingStatus: vi.fn().mockResolvedValue(undefined),
      getOrCreateActivePromptVersion: vi.fn().mockResolvedValue({
        id: 'prompt-1',
        modelId: 'mistralai/Mistral-7B-Instruct-v0.3',
      }),
      createOrReuseRun: vi.fn().mockResolvedValue({ id: 'run-1', status: 'running' }),
      saveTranscriptIfMissing: vi.fn().mockResolvedValue(undefined),
      listOrganizationUsers: vi.fn().mockResolvedValue([{ id: 'u1', email: 'jordan@hyperbuild.dev', displayName: 'Jordan' }]),
      persistExtractionAndTasks: vi.fn().mockResolvedValue({
        extractionResult: { id: 'ext-1' },
        createdTaskIds: ['task-1'],
      }),
      markRunFailed: vi.fn().mockResolvedValue(undefined),
      getRun: vi.fn(),
    };

    const transcriptionAdapterService = {
      normalizeTranscript: vi.fn().mockReturnValue([
        { segmentIndex: 0, startMs: 0, endMs: 1000, text: 'Jordan will send release notes by Friday.' },
      ]),
    };

    const extractionEngineService = {
      extract: vi.fn().mockResolvedValue({
        actionItems: [
          {
            title: 'Jordan will send release notes by Friday',
            ownerCandidate: 'Jordan',
            dueDate: null,
            priority: 'medium',
            confidence: 0.8,
            rationale: 'Detected commitment statement.',
          },
        ],
      }),
    };

    const assignmentResolverService = {
      resolveOwner: vi.fn().mockReturnValue('u1'),
    };

    const service = new AiService(
      aiRepository as any,
      transcriptionAdapterService as any,
      extractionEngineService as any,
      assignmentResolverService as any,
    );

    const result = await service.processMeeting(authUser, 'meeting-1', {
      transcriptText: 'Jordan will send release notes by Friday.',
    });

    expect(result).toEqual({
      runId: 'run-1',
      idempotencyKey: 'meeting:meeting-1:prompt:prompt-1:v1',
      extractionResultId: 'ext-1',
      createdTaskIds: ['task-1'],
    });
    expect(aiRepository.setMeetingStatus).toHaveBeenCalledWith(authUser, 'meeting-1', 'processing_transcription');
    expect(aiRepository.setMeetingStatus).toHaveBeenCalledWith(authUser, 'meeting-1', 'transcribed');
    expect(aiRepository.persistExtractionAndTasks).toHaveBeenCalledTimes(1);
  });

  it('returns existing run when idempotent run already succeeded', async () => {
    const aiRepository = {
      prepareMeetingProcessing: vi.fn().mockResolvedValue({
        id: 'meeting-1',
        organizationId: 'org-1',
        transcripts: [],
      }),
      setMeetingStatus: vi.fn().mockResolvedValue(undefined),
      getOrCreateActivePromptVersion: vi.fn().mockResolvedValue({
        id: 'prompt-1',
        modelId: 'mistralai/Mistral-7B-Instruct-v0.3',
      }),
      createOrReuseRun: vi.fn().mockResolvedValue({ id: 'run-1', status: 'succeeded' }),
      getRun: vi.fn().mockResolvedValue({ id: 'run-1', status: 'succeeded' }),
    };

    const service = new AiService(
      aiRepository as any,
      { normalizeTranscript: vi.fn() } as any,
      { extract: vi.fn() } as any,
      { resolveOwner: vi.fn() } as any,
    );

    const result = await service.processMeeting(authUser, 'meeting-1', {});
    expect(result).toEqual({ id: 'run-1', status: 'succeeded' });
    expect(aiRepository.getRun).toHaveBeenCalledWith(authUser, 'run-1');
  });
});
