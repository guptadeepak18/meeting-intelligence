import { Injectable } from '@nestjs/common';
import { CreateAiRunDto, ExtractionOutputDto } from '@meeting-intelligence/shared';
import type { AuthUser } from '../common/auth-user.interface';
import { AssignmentResolverService } from './assignment-resolver.service';
import { AiRepository } from './ai.repository';
import { ProcessMeetingDto } from './dto/process-meeting.dto';
import { ExtractionEngineService } from './extraction-engine.service';
import { TranscriptionAdapterService } from './transcription-adapter.service';

@Injectable()
export class AiService {
  constructor(
    private readonly aiRepository: AiRepository,
    private readonly transcriptionAdapterService: TranscriptionAdapterService,
    private readonly extractionEngineService: ExtractionEngineService,
    private readonly assignmentResolverService: AssignmentResolverService,
  ) {}

  createRun(authUser: AuthUser, payload: CreateAiRunDto) {
    return this.aiRepository.createRun(authUser, payload);
  }

  attachExtraction(authUser: AuthUser, runId: string, payload: ExtractionOutputDto) {
    return this.aiRepository.attachExtraction(authUser, runId, payload);
  }

  getRun(authUser: AuthUser, runId: string) {
    return this.aiRepository.getRun(authUser, runId);
  }

  async processMeeting(authUser: AuthUser, meetingId: string, payload: ProcessMeetingDto) {
    const meeting = await this.aiRepository.prepareMeetingProcessing(authUser, meetingId);
    await this.aiRepository.setMeetingStatus(authUser, meetingId, 'processing_transcription');

    const promptVersion = await this.aiRepository.getOrCreateActivePromptVersion();
    const idempotencyKey = payload.idempotencyKey ?? `meeting:${meetingId}:prompt:${promptVersion.id}:v1`;

    const run = await this.aiRepository.createOrReuseRun(authUser, {
      organizationId: meeting.organizationId,
      meetingId,
      promptVersionId: promptVersion.id,
      provider: 'huggingface',
      model: promptVersion.modelId,
      idempotencyKey,
    } as CreateAiRunDto);

    if (run.status === 'succeeded') {
      return this.aiRepository.getRun(authUser, run.id);
    }

    try {
      const transcriptFromDb = meeting.transcripts[0];
      const transcriptText =
        payload.transcriptText ??
        transcriptFromDb?.rawText ??
        transcriptFromDb?.utterances.map((item) => item.text).join(' ') ??
        '';

      const normalizedUtterances = this.transcriptionAdapterService.normalizeTranscript(transcriptText);

      await this.aiRepository.saveTranscriptIfMissing(
        meetingId,
        transcriptText || normalizedUtterances.map((item) => item.text).join(' '),
        normalizedUtterances,
      );

      await this.aiRepository.setMeetingStatus(authUser, meetingId, 'transcribed');

      let extraction = await this.extractionEngineService.extract({
        transcriptText: transcriptText || normalizedUtterances.map((item) => item.text).join(' '),
        model: promptVersion.modelId,
      });

      if (!extraction.actionItems.length) {
        extraction = {
          actionItems: [
            {
              title: 'Manual review required for transcript extraction',
              ownerCandidate: null,
              dueDate: null,
              priority: 'low',
              confidence: 0.3,
              rationale: 'No action items detected in extraction output.',
            },
          ],
        };
      }

      const users = await this.aiRepository.listOrganizationUsers(authUser);
      const assigneeResolver = (candidate: string | null | undefined) =>
        this.assignmentResolverService.resolveOwner(candidate, users);

      const persisted = await this.aiRepository.persistExtractionAndTasks(authUser, {
        runId: run.id,
        extraction: extraction as ExtractionOutputDto,
        organizationId: meeting.organizationId,
        meetingId,
        assigneeResolver,
      });

      return {
        runId: run.id,
        idempotencyKey,
        extractionResultId: persisted.extractionResult.id,
        createdTaskIds: persisted.createdTaskIds,
      };
    } catch (error) {
      await this.aiRepository.markRunFailed(run.id, error instanceof Error ? error.message : 'Unknown error');
      await this.aiRepository.setMeetingStatus(authUser, meetingId, 'failed');
      throw error;
    }
  }
}
