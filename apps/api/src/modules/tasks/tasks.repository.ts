import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.interface';
import { toAccessScope } from '../common/access-scope';
import { PrismaService } from '../prisma/prisma.service';
import { ListTasksQueryDto } from './dto/list-tasks.query.dto';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: {
    authUser: AuthUser;
    meetingId: string;
    title: string;
    assigneeUserId?: string;
    dueDate?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    rationale: string;
  }) {
    const scope = toAccessScope(payload.authUser);
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id: payload.meetingId,
        organizationId: scope.organizationId,
        ...(scope.role !== 'admin' && scope.teamId ? { teamId: scope.teamId } : {}),
      },
      select: { id: true, organizationId: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const actionItem = await this.prisma.actionItem.create({
      data: {
        organizationId: meeting.organizationId,
        meetingId: payload.meetingId,
        title: payload.title,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        priority: payload.priority,
        confidence: payload.confidence,
        rationale: payload.rationale,
        status: 'todo',
      },
    });

    await this.prisma.taskStatusHistory.create({
      data: {
        actionItemId: actionItem.id,
        fromStatus: null,
        toStatus: 'todo',
        reason: 'Created from task endpoint',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: meeting.organizationId,
        actionItemId: actionItem.id,
        actorType: 'user',
        actorUserId: payload.authUser.id,
        eventType: 'task.created',
        entityType: 'action_item',
        entityId: actionItem.id,
        metadata: {
          source: 'tasks.create',
        },
      },
    });

    if (payload.assigneeUserId) {
      await this.prisma.taskAssignment.upsert({
        where: {
          actionItemId_userId: {
            actionItemId: actionItem.id,
            userId: payload.assigneeUserId,
          },
        },
        update: {
          source: 'manual',
        },
        create: {
          actionItemId: actionItem.id,
          userId: payload.assigneeUserId,
          source: 'manual',
        },
      });
    }

    return this.getById(payload.authUser, actionItem.id);
  }

  async list(authUser: AuthUser, query: ListTasksQueryDto) {
    const scope = toAccessScope(authUser);

    const where = this.buildScopedWhere(scope);

    if (query.teamId) {
      const teamCondition: Prisma.ActionItemWhereInput = {
        meeting: {
          teamId: query.teamId,
        },
      };

      if (!where.AND) {
        where.AND = [teamCondition];
      } else if (Array.isArray(where.AND)) {
        where.AND = [...where.AND, teamCondition];
      } else {
        where.AND = [where.AND, teamCondition];
      }
    }

    if (query.ownerUserId) {
      where.assignments = {
        some: {
          userId: query.ownerUserId,
        },
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.dueBefore || query.dueAfter) {
      where.dueDate = {
        ...(query.dueBefore ? { lte: new Date(query.dueBefore) } : {}),
        ...(query.dueAfter ? { gte: new Date(query.dueAfter) } : {}),
      };
    }

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { rationale: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.actionItem.findMany({
      where,
      include: {
        assignments: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getById(authUser: AuthUser, taskId: string) {
    const scope = toAccessScope(authUser);
    const task = await this.prisma.actionItem.findFirst({
      where: {
        id: taskId,
        ...this.buildScopedWhere(scope),
      },
      include: {
        assignments: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async transition(payload: {
    authUser: AuthUser;
    taskId: string;
    toStatus: 'todo' | 'in_progress' | 'done';
    reason?: string;
  }) {
    const scope = toAccessScope(payload.authUser);
    const existing = await this.prisma.actionItem.findFirst({
      where: {
        id: payload.taskId,
        ...this.buildScopedWhere(scope),
      },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.actionItem.update({
      where: { id: payload.taskId },
      data: {
        status: payload.toStatus,
        completedAt: payload.toStatus === 'done' ? new Date() : null,
      },
    });

    await this.prisma.taskStatusHistory.create({
      data: {
        actionItemId: payload.taskId,
        fromStatus: existing.status,
        toStatus: payload.toStatus,
        reason: payload.reason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: scope.organizationId,
        actionItemId: payload.taskId,
        actorType: 'user',
        actorUserId: payload.authUser.id,
        eventType: 'task.status_changed',
        entityType: 'action_item',
        entityId: payload.taskId,
        metadata: {
          fromStatus: existing.status,
          toStatus: payload.toStatus,
          reason: payload.reason ?? null,
        } as Prisma.InputJsonValue,
      },
    });

    return this.getById(payload.authUser, updated.id);
  }

  async assign(authUser: AuthUser, taskId: string, assigneeUserId: string) {
    const scope = toAccessScope(authUser);
    await this.getById(authUser, taskId);

    const assigneeInOrg = await this.prisma.membership.findFirst({
      where: {
        organizationId: scope.organizationId,
        userId: assigneeUserId,
      },
      select: { id: true },
    });

    if (!assigneeInOrg) {
      throw new ForbiddenException('Cannot assign tasks to users outside your organization');
    }

    await this.prisma.taskAssignment.upsert({
      where: {
        actionItemId_userId: {
          actionItemId: taskId,
          userId: assigneeUserId,
        },
      },
      update: {
        source: 'manual',
      },
      create: {
        actionItemId: taskId,
        userId: assigneeUserId,
        source: 'manual',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: scope.organizationId,
        actionItemId: taskId,
        actorType: 'user',
        actorUserId: authUser.id,
        eventType: 'task.assigned',
        entityType: 'action_item',
        entityId: taskId,
        metadata: {
          assigneeUserId,
          source: 'manual',
        },
      },
    });

    return this.getById(authUser, taskId);
  }

  private buildScopedWhere(scope: ReturnType<typeof toAccessScope>): Prisma.ActionItemWhereInput {
    const base: Prisma.ActionItemWhereInput = {
      organizationId: scope.organizationId,
    };

    if (scope.role !== 'admin' && scope.teamId) {
      base.meeting = { teamId: scope.teamId };
    }

    if (scope.role === 'employee') {
      return {
        AND: [
          base,
          {
            assignments: {
              some: {
                userId: scope.userId,
              },
            },
          },
        ],
      };
    }

    return base;
  }
}
