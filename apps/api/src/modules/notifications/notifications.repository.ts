import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.interface';
import { toAccessScope } from '../common/access-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(authUser: AuthUser, payload: {
    organizationId: string;
    userId: string;
    channel: 'in_app' | 'email' | 'slack';
    templateKey: string;
    payload: Record<string, unknown>;
    scheduledFor?: string;
  }) {
    const scope = toAccessScope(authUser);

    if (payload.organizationId !== scope.organizationId) {
      throw new ForbiddenException('Cannot create notifications outside your organization');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        organizationId: scope.organizationId,
        userId: payload.userId,
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('Cannot notify users outside your organization');
    }

    return this.prisma.notification.create({
      data: {
        organizationId: payload.organizationId,
        userId: payload.userId,
        channel: payload.channel,
        templateKey: payload.templateKey,
        payload: payload.payload as unknown as Prisma.InputJsonValue,
        status: 'pending',
        scheduledFor: payload.scheduledFor ? new Date(payload.scheduledFor) : null,
      },
    });
  }

  async dispatch(authUser: AuthUser, notificationId: string) {
    const scope = toAccessScope(authUser);

    const existing = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        ...this.buildScopedWhere(scope),
      },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    return existing;
  }

  async listDue(authUser: AuthUser, now: Date) {
    const scope = toAccessScope(authUser);

    const where: Prisma.NotificationWhereInput = {
      ...this.buildScopedWhere(scope),
      status: 'pending',
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
    };

    return this.prisma.notification.findMany({
      where,
      take: 200,
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
      },
    });
  }

  async getPreference(authUser: AuthUser, userId: string) {
    const scope = toAccessScope(authUser);

    if (scope.role === 'employee' && scope.userId !== userId) {
      throw new ForbiddenException('Cannot read another user preference');
    }

    return this.prisma.notificationPreference.findUnique({
      where: {
        organizationId_userId: {
          organizationId: scope.organizationId,
          userId,
        },
      },
    });
  }

  async upsertPreference(authUser: AuthUser, payload: {
    userId: string;
    preferredChannel: 'in_app' | 'email' | 'slack';
    quietHoursStartMinute?: number;
    quietHoursEndMinute?: number;
    digestEnabled?: boolean;
  }) {
    const scope = toAccessScope(authUser);

    if (scope.role === 'employee' && scope.userId !== payload.userId) {
      throw new ForbiddenException('Cannot update another user preference');
    }

    if (scope.role !== 'employee') {
      const member = await this.prisma.membership.findFirst({
        where: {
          organizationId: scope.organizationId,
          userId: payload.userId,
        },
        select: { id: true },
      });

      if (!member) {
        throw new ForbiddenException('Cannot set preferences outside your organization');
      }
    }

    return this.prisma.notificationPreference.upsert({
      where: {
        organizationId_userId: {
          organizationId: scope.organizationId,
          userId: payload.userId,
        },
      },
      update: {
        preferredChannel: payload.preferredChannel,
        quietHoursStartMinute: payload.quietHoursStartMinute ?? null,
        quietHoursEndMinute: payload.quietHoursEndMinute ?? null,
        digestEnabled: payload.digestEnabled ?? true,
      },
      create: {
        organizationId: scope.organizationId,
        userId: payload.userId,
        preferredChannel: payload.preferredChannel,
        quietHoursStartMinute: payload.quietHoursStartMinute ?? null,
        quietHoursEndMinute: payload.quietHoursEndMinute ?? null,
        digestEnabled: payload.digestEnabled ?? true,
      },
    });
  }

  isQuietHours(preference: {
    quietHoursStartMinute: number | null;
    quietHoursEndMinute: number | null;
  }): boolean {
    if (
      preference.quietHoursStartMinute === null ||
      preference.quietHoursEndMinute === null
    ) {
      return false;
    }

    const now = new Date();
    const nowMinute = now.getHours() * 60 + now.getMinutes();
    const start = preference.quietHoursStartMinute;
    const end = preference.quietHoursEndMinute;

    if (start === end) {
      return false;
    }

    if (start < end) {
      return nowMinute >= start && nowMinute < end;
    }

    return nowMinute >= start || nowMinute < end;
  }

  async markSent(notificationId: string, sentAt: Date) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'sent',
        sentAt,
      },
    });
  }

  async markFailed(notificationId: string, _message: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'failed',
      },
    });
  }

  async list(authUser: AuthUser, userId?: string) {
    const scope = toAccessScope(authUser);

    if (scope.role === 'employee') {
      userId = scope.userId;
    } else if (userId) {
      const member = await this.prisma.membership.findFirst({
        where: {
          organizationId: scope.organizationId,
          userId,
        },
        select: { id: true },
      });

      if (!member) {
        throw new ForbiddenException('Cannot read notifications outside your organization');
      }
    }

    const where: Prisma.NotificationWhereInput = {
      ...this.buildScopedWhere(scope),
      ...(userId ? { userId } : {}),
    };

    return this.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private buildScopedWhere(scope: ReturnType<typeof toAccessScope>): Prisma.NotificationWhereInput {
    const where: Prisma.NotificationWhereInput = {
      organizationId: scope.organizationId,
    };

    if (scope.role === 'employee') {
      where.userId = scope.userId;
    }

    return where;
  }
}
