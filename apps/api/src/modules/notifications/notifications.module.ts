import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, NotificationDeliveryService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
