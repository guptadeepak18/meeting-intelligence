import { Injectable } from '@nestjs/common';
import { CreateActionItemDto, TransitionTaskStatusDto } from '@meeting-intelligence/shared';
import type { AuthUser } from '../common/auth-user.interface';
import { ListTasksQueryDto } from './dto/list-tasks.query.dto';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  create(authUser: AuthUser, payload: CreateActionItemDto) {
    return this.tasksRepository.create({
      authUser,
      meetingId: payload.meetingId,
      title: payload.title,
      assigneeUserId: payload.assigneeUserId,
      dueDate: payload.dueDate,
      priority: payload.priority,
      confidence: payload.confidence,
      rationale: payload.rationale,
    });
  }

  list(authUser: AuthUser, query: ListTasksQueryDto) {
    return this.tasksRepository.list(authUser, query);
  }

  getById(authUser: AuthUser, taskId: string) {
    return this.tasksRepository.getById(authUser, taskId);
  }

  transition(authUser: AuthUser, taskId: string, payload: TransitionTaskStatusDto) {
    return this.tasksRepository.transition({
      authUser,
      taskId,
      toStatus: payload.toStatus,
      reason: payload.reason,
    });
  }

  assign(authUser: AuthUser, taskId: string, assigneeUserId: string) {
    return this.tasksRepository.assign(authUser, taskId, assigneeUserId);
  }
}
