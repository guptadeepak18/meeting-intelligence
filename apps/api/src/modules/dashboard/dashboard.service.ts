import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/auth-user.interface';
import { toAccessScope } from '../common/access-scope';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private cache = new Map<string, { expiresAt: number; value: unknown }>();

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(authUser: AuthUser, organizationId?: string) {
    const scope = toAccessScope(authUser);
    const resolvedOrgId = organizationId ?? scope.organizationId;
    const cacheKey = `${scope.userId}:${resolvedOrgId}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const meetingWhere = {
      organizationId: resolvedOrgId,
      ...(scope.role !== 'admin' && scope.teamId ? { teamId: scope.teamId } : {}),
    };

    const meetingsProcessed = await this.prisma.meeting.count({
      where: {
        ...meetingWhere,
        status: 'tasks_created',
      },
    });

    const actionWhere = {
      organizationId: resolvedOrgId,
      ...(scope.role !== 'admin' && scope.teamId ? { meeting: { teamId: scope.teamId } } : {}),
      ...(scope.role === 'employee'
        ? {
            assignments: {
              some: {
                userId: scope.userId,
              },
            },
          }
        : {}),
    };

    const actionItemsOpen = await this.prisma.actionItem.count({
      where: {
        ...actionWhere,
        status: { in: ['todo', 'in_progress'] },
      },
    });

    const actionItemsCompleted = await this.prisma.actionItem.count({
      where: {
        ...actionWhere,
        status: 'done',
      },
    });

    const overdueItems = await this.prisma.actionItem.count({
      where: {
        ...actionWhere,
        status: { in: ['todo', 'in_progress'] },
        dueDate: { lt: new Date() },
      },
    });

    const value = {
      organizationId: resolvedOrgId,
      meetingsProcessed,
      actionItemsOpen,
      actionItemsCompleted,
      overdueItems,
      generatedAt: new Date().toISOString(),
      mode: 'prisma',
    };

    this.cache.set(cacheKey, {
      expiresAt: now + 30_000,
      value,
    });

    return value;
  }
}
