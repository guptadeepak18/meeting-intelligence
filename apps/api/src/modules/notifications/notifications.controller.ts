import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import type { AuthenticatedRequest } from '../common/auth-user.interface';
import { QueueNotificationDto } from './dto/queue-notification.dto';
import { UpsertNotificationPreferencesDto } from './dto/upsert-notification-preferences.dto';
import { NotificationsService } from './notifications.service';

@Controller({ path: 'notifications', version: '1' })
@UseGuards(ClerkAuthGuard, RbacGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('queue')
  @Roles('admin', 'manager')
  queue(@Req() request: AuthenticatedRequest, @Body() payload: QueueNotificationDto) {
    return this.notificationsService.enqueue(request.authUser!, payload);
  }

  @Post('dispatch/:notificationId')
  @Roles('admin', 'manager')
  dispatch(@Req() request: AuthenticatedRequest, @Param('notificationId') notificationId: string) {
    return this.notificationsService.dispatch(request.authUser!, notificationId);
  }

  @Post('dispatch-due')
  @Roles('admin', 'manager')
  dispatchDue(@Req() request: AuthenticatedRequest) {
    return this.notificationsService.dispatchDue(request.authUser!);
  }

  @Get()
  @Roles('admin', 'manager', 'employee')
  list(@Req() request: AuthenticatedRequest, @Query('userId') userId?: string) {
    return this.notificationsService.list(request.authUser!, userId);
  }

  @Get('preferences/:userId')
  @Roles('admin', 'manager', 'employee')
  getPreference(@Req() request: AuthenticatedRequest, @Param('userId') userId: string) {
    return this.notificationsService.getPreference(request.authUser!, userId);
  }

  @Post('preferences')
  @Roles('admin', 'manager', 'employee')
  upsertPreference(@Req() request: AuthenticatedRequest, @Body() payload: UpsertNotificationPreferencesDto) {
    return this.notificationsService.upsertPreference(request.authUser!, payload);
  }
}
