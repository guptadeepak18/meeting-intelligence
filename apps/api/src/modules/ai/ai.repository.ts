import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreateAiRunDto, ExtractionOutputDto } from '@meeting-intelligence/shared';
import type { AuthUser } from '../common/auth-user.interface';
import { toAccessScope } from '../common/access-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async prepareMeetingProcessing(authUser: AuthUser, meetingId: string) {
    const scope = toAccessScope(authUser);

    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ...this.buildMeetingScope(scope),
      },
      include: {
        participants: true,
        transcripts: {
          include: {
            utterances: {
              orderBy: { segmentIndex: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async setMeetingStatus(authUser: AuthUser, meetingId: string, status: 'processing_transcription' | 'transcribed' | 'tasks_created' | 'failed') {
    const scope = toAccessScope(authUser);
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ...this.buildMeetingScope(scope),
      },
      select: { id: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status },
    });
  }

  async getOrCreateActivePromptVersion() {
    const templateKey = 'action_item_extraction';

    let template = await this.prisma.promptTemplate.findUnique({
      where: { key: templateKey },
      include: {
        versions: {
          where: { isActive: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!template) {
      template = await this.prisma.promptTemplate.create({
        data: {
          key: templateKey,
          name: 'Action Item Extraction',
          description: 'Extract tasks with owners and due dates from transcript text.',
        },
        include: {
          versions: {
            where: { isActive: true },
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      });
    }

    if (template.versions.length > 0) {
      return template.versions[0]!;
    }

    return this.prisma.promptVersion.create({
      data: {
        promptTemplateId: template.id,
        version: 1,
        modelId: process.env.HF_LLM_MODEL ?? 'mistralai/Mistral-7B-Instruct-v0.3',
        temperature: 0.1,
        maxTokens: 1200,
        templateText: 'Extract strict JSON action items from transcript chunks.',
        isActive: true,
      },
    });
  }

  async createOrReuseRun(authUser: AuthUser, payload: CreateAiRunDto) {
    const scope = toAccessScope(authUser);

    if (payload.organizationId !== scope.organizationId) {
      throw new ForbiddenException('Cannot create AI runs outside your organization');
    }

    const existing = await this.prisma.aiRun.findUnique({
      where: { idempotencyKey: payload.idempotencyKey },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.aiRun.create({
      data: {
        organizationId: payload.organizationId,
        meetingId: payload.meetingId,
        promptVersionId: payload.promptVersionId,
        provider: payload.provider,
        model: payload.model,
        idempotencyKey: payload.idempotencyKey,
        status: 'running',
        startedAt: new Date(),
      },
    });
  }

  async saveTranscriptIfMissing(
    meetingId: string,
    transcriptText: string,
    utterances: Array<{
      segmentIndex: number;
      speakerLabel?: string;
      startMs: number;
      endMs: number;
      text: string;
      confidence?: number;
    }>,
  ) {
    const existing = await this.prisma.transcript.findFirst({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.transcript.create({
      data: {
        meetingId,
        provider: 'hf-whisper-adapter',
        status: 'complete',
        language: 'en',
        rawText: transcriptText,
        confidence: 0.88,
        utterances: {
          create: utterances,
        },
      },
    });
  }

  async persistExtractionAndTasks(authUser: AuthUser, args: {
    runId: string;
    extraction: ExtractionOutputDto;
    organizationId: string;
    meetingId: string;
    assigneeResolver: (candidate: string | null | undefined) => string | null;
  }) {
    const scope = toAccessScope(authUser);

    if (scope.organizationId !== args.organizationId) {
      throw new ForbiddenException('Cannot persist extraction outside your organization');
    }

    const run = await this.prisma.aiRun.findFirst({
      where: {
        id: args.runId,
        organizationId: scope.organizationId,
      },
      select: { id: true },
    });

    if (!run) {
      throw new NotFoundException('AI run not found');
    }

    const txResult = await this.prisma.$transaction(async (tx) => {
      const extractionResult = await tx.extractionResult.create({
        data: {
          aiRunId: args.runId,
          schemaVersion: '1.0.0',
          rawOutput: args.extraction as unknown as Prisma.InputJsonValue,
          normalizedOutput: args.extraction as unknown as Prisma.InputJsonValue,
          validationPassed: true,
          retryCount: 0,
        },
      });

      const createdTaskIds: string[] = [];

      for (const item of args.extraction.actionItems) {
        const assigneeUserId = args.assigneeResolver(item.ownerCandidate);
        const humanReviewRequired = item.confidence < 0.6 || !assigneeUserId;

        const actionItem = await tx.actionItem.create({
          data: {
            organizationId: args.organizationId,
            meetingId: args.meetingId,
            createdByAiRunId: args.runId,
            title: item.title,
            priority: item.priority,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            confidence: item.confidence,
            rationale: item.rationale,
            humanReviewRequired,
            status: 'todo',
          },
        });

        createdTaskIds.push(actionItem.id);

        await tx.taskStatusHistory.create({
          data: {
            actionItemId: actionItem.id,
            fromStatus: null,
            toStatus: 'todo',
            reason: 'Created from AI extraction run.',
          },
        });

        if (assigneeUserId) {
          await tx.taskAssignment.upsert({
            where: {
              actionItemId_userId: {
                actionItemId: actionItem.id,
                userId: assigneeUserId,
              },
            },
            update: {
              source: 'ai',
            },
            create: {
              actionItemId: actionItem.id,
              userId: assigneeUserId,
              source: 'ai',
            },
          });

          await tx.notification.create({
            data: {
              organizationId: args.organizationId,
              userId: assigneeUserId,
              channel: 'in_app',
              status: 'pending',
              templateKey: 'task_assigned_ai',
              payload: {
                actionItemId: actionItem.id,
                meetingId: args.meetingId,
                title: actionItem.title,
              },
              scheduledFor: new Date(),
            },
          });
        }
      }

      await tx.aiRun.update({
        where: { id: args.runId },
        data: {
          status: 'succeeded',
          finishedAt: new Date(),
        },
      });

      await tx.meeting.update({
        where: { id: args.meetingId },
        data: {
          status: 'tasks_created',
        },
      });

      return { extractionResult, createdTaskIds };
    });

    return txResult;
  }

  async markRunFailed(runId: string, message: string) {
    await this.prisma.aiRun.updateMany({
      where: { id: runId },
      data: {
        status: 'failed',
        errorMessage: message,
        finishedAt: new Date(),
      },
    });
  }

  async listOrganizationUsers(authUser: AuthUser) {
    const scope = toAccessScope(authUser);
    return this.prisma.user.findMany({
      where: {
        memberships: {
          some: {
            organizationId: scope.organizationId,
          },
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });
  }

  async createRun(authUser: AuthUser, payload: CreateAiRunDto) {
    const scope = toAccessScope(authUser);

    if (payload.organizationId !== scope.organizationId) {
      throw new ForbiddenException('Cannot create AI runs outside your organization');
    }

    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id: payload.meetingId,
        organizationId: scope.organizationId,
        ...(scope.role !== 'admin' && scope.teamId ? { teamId: scope.teamId } : {}),
      },
      select: { id: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return this.prisma.aiRun.create({
      data: {
        organizationId: payload.organizationId,
        meetingId: payload.meetingId,
        promptVersionId: payload.promptVersionId,
        provider: payload.provider,
        model: payload.model,
        idempotencyKey: payload.idempotencyKey,
        status: 'queued',
      },
    });
  }

  async attachExtraction(authUser: AuthUser, runId: string, payload: ExtractionOutputDto) {
    const scope = toAccessScope(authUser);
    const run = await this.prisma.aiRun.findFirst({
      where: {
        id: runId,
        ...this.buildScopedWhere(scope),
      },
      select: { id: true },
    });

    if (!run) {
      throw new NotFoundException('AI run not found');
    }

    const updated = await this.prisma.aiRun.update({
      where: { id: runId },
      data: {
        status: 'succeeded',
        finishedAt: new Date(),
      },
    });

    await this.prisma.extractionResult.create({
      data: {
        aiRunId: runId,
        schemaVersion: '1.0.0',
        rawOutput: payload as unknown as Prisma.InputJsonValue,
        normalizedOutput: payload as unknown as Prisma.InputJsonValue,
        validationPassed: true,
        retryCount: 0,
      },
    });

    return this.getRun(authUser, updated.id);
  }

  async getRun(authUser: AuthUser, runId: string) {
    const scope = toAccessScope(authUser);
    const run = await this.prisma.aiRun.findFirst({
      where: {
        id: runId,
        ...this.buildScopedWhere(scope),
      },
      include: {
        extractionResults: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('AI run not found');
    }

    return run;
  }

  private buildScopedWhere(scope: ReturnType<typeof toAccessScope>): Prisma.AiRunWhereInput {
    const base: Prisma.AiRunWhereInput = {
      organizationId: scope.organizationId,
    };

    if (scope.role !== 'admin' && scope.teamId) {
      base.meeting = { teamId: scope.teamId };
    }

    return base;
  }

  private buildMeetingScope(scope: ReturnType<typeof toAccessScope>): Prisma.MeetingWhereInput {
    const base: Prisma.MeetingWhereInput = {
      organizationId: scope.organizationId,
    };

    if (scope.role !== 'admin' && scope.teamId) {
      base.teamId = scope.teamId;
    }

    return base;
  }
}
