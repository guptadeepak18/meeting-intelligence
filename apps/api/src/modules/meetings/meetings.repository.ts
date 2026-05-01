import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MeetingStatus, Prisma } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.interface';
import { toAccessScope } from '../common/access-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeetingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: {
    authUser: AuthUser;
    organizationId: string;
    teamId: string;
    title: string;
    source?: string;
    scheduledAt?: string;
    participants: string[];
  }) {
    const scope = toAccessScope(payload.authUser);

    if (payload.organizationId !== scope.organizationId) {
      throw new ForbiddenException('Cannot create meetings outside your organization');
    }

    if (scope.role !== 'admin' && scope.teamId && scope.teamId !== payload.teamId) {
      throw new ForbiddenException('Cannot create meetings outside your team scope');
    }

    return this.prisma.meeting.create({
      data: {
        organizationId: payload.organizationId,
        teamId: payload.teamId,
        title: payload.title,
        source: payload.source,
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
        status: 'uploaded',
        participants: {
          create: payload.participants.map((email, index) => ({
            email,
            displayName: email.split('@')[0] || `participant_${index + 1}`,
          })),
        },
      },
      include: {
        participants: true,
      },
    });
  }

  async list(authUser: AuthUser, organizationId?: string) {
    const scope = toAccessScope(authUser);
    if (organizationId && organizationId !== scope.organizationId) {
      throw new ForbiddenException('Cannot read meetings outside your organization');
    }

    const where = this.buildScopedWhere(scope, organizationId);

    return this.prisma.meeting.findMany({
      where,
      include: {
        participants: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getById(authUser: AuthUser, meetingId: string) {
    const scope = toAccessScope(authUser);
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ...this.buildScopedWhere(scope),
      },
      include: {
        participants: true,
        transcripts: {
          include: {
            utterances: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        actionItems: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  async updateStatus(authUser: AuthUser, meetingId: string, status: MeetingStatus) {
    await this.ensureMeetingExists(authUser, meetingId);
    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status },
      include: {
        participants: true,
      },
    });
  }

  async ensureMeetingExists(authUser: AuthUser, meetingId: string) {
    const scope = toAccessScope(authUser);
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ...this.buildScopedWhere(scope),
      },
      select: { id: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  private buildScopedWhere(scope: ReturnType<typeof toAccessScope>, organizationId?: string): Prisma.MeetingWhereInput {
    const base: Prisma.MeetingWhereInput = {
      organizationId: organizationId ?? scope.organizationId,
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
