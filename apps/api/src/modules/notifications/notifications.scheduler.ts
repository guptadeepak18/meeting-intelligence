import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { AuthUser } from '../common/auth-user.interface';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron(process.env.NOTIFICATION_DISPATCH_CRON ?? '*/1 * * * *')
  async dispatchDueNotifications() {
    const enabled = process.env.NOTIFICATION_DISPATCH_ENABLED === 'true';
    if (!enabled) {
      return;
    }

    const authUser: AuthUser = {
      id: process.env.SCHEDULER_USER_ID ?? '44444444-4444-4444-8444-444444444444',
      organizationId: process.env.SCHEDULER_ORG_ID ?? '11111111-1111-4111-8111-111111111111',
      role: 'admin',
      teamId: process.env.SCHEDULER_TEAM_ID ?? '22222222-2222-4222-8222-222222222221',
    };

    const result = await this.notificationsService.dispatchDue(authUser);
    if (result.dispatched > 0 || result.failed > 0) {
      this.logger.log(
        `Notification scheduler processed due items. dispatched=${result.dispatched} failed=${result.failed}`,
      );
    }
  }
}
