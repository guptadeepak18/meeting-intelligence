import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.interface';
import { toAccessScope } from '../common/access-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TranscriptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: {
    authUser: AuthUser;
    meetingId: string;
    provider: string;
    language?: string;
    confidence?: number;
    rawText?: string;
    utterances: Array<{
      segmentIndex: number;
      speakerLabel?: string;
      startMs: number;
      endMs: number;
      text: string;
      confidence?: number;
    }>;
  }) {
    await this.ensureMeetingExists(payload.authUser, payload.meetingId);

    return this.prisma.transcript.create({
      data: {
        meetingId: payload.meetingId,
        provider: payload.provider,
        language: payload.language,
        confidence: payload.confidence,
        rawText: payload.rawText,
        status: 'complete',
        utterances: {
          create: payload.utterances.map((item) => ({
            segmentIndex: item.segmentIndex,
            speakerLabel: item.speakerLabel,
            startMs: item.startMs,
            endMs: item.endMs,
            text: item.text,
            confidence: item.confidence,
          })),
        },
      },
      include: {
        utterances: {
          orderBy: { segmentIndex: 'asc' },
        },
      },
    });
  }

  async listByMeeting(authUser: AuthUser, meetingId: string) {
    await this.ensureMeetingExists(authUser, meetingId);

    return this.prisma.transcript.findMany({
      where: { meetingId },
      include: {
        utterances: {
          orderBy: { segmentIndex: 'asc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async ensureMeetingExists(authUser: AuthUser, meetingId: string) {
    const scope = toAccessScope(authUser);
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ...this.buildScopedMeetingWhere(scope),
      },
      select: { id: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
  }

  private buildScopedMeetingWhere(scope: ReturnType<typeof toAccessScope>): Prisma.MeetingWhereInput {
    const base: Prisma.MeetingWhereInput = {
      organizationId: scope.organizationId,
    };

    if (scope.role !== 'admin' && scope.teamId) {
      base.teamId = scope.teamId;
    }

    if (scope.role === 'employee') {
      return {
        AND: [
          base,
          {
            OR: [
              { participants: { some: { userId: scope.userId } } },
              { uploadedByMember: { userId: scope.userId } },
            ],
          },
        ],
      };
    }

    return base;
  }
}
