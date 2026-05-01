import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateActionItemDto, TransitionTaskStatusDto } from '@meeting-intelligence/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import type { AuthenticatedRequest } from '../common/auth-user.interface';
import { ListTasksQueryDto } from './dto/list-tasks.query.dto';
import { TasksService } from './tasks.service';

@Controller({ path: 'tasks', version: '1' })
@UseGuards(ClerkAuthGuard, RbacGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('admin', 'manager')
  createTask(@Req() request: AuthenticatedRequest, @Body() payload: CreateActionItemDto) {
    return this.tasksService.create(request.authUser!, payload);
  }

  @Get()
  @Roles('admin', 'manager', 'employee')
  listTasks(@Req() request: AuthenticatedRequest, @Query() query: ListTasksQueryDto) {
    return this.tasksService.list(request.authUser!, query);
  }

  @Get(':taskId')
  @Roles('admin', 'manager', 'employee')
  getTask(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.tasksService.getById(request.authUser!, taskId);
  }

  @Patch(':taskId/status')
  @Roles('admin', 'manager', 'employee')
  transitionTask(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() payload: TransitionTaskStatusDto,
  ) {
    return this.tasksService.transition(request.authUser!, taskId, payload);
  }

  @Patch(':taskId/assign/:userId')
  @Roles('admin', 'manager')
  assignTask(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.tasksService.assign(request.authUser!, taskId, userId);
  }
}
