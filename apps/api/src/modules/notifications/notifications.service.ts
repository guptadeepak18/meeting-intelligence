import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/auth-user.interface';
import { NotificationDeliveryService } from './notification-delivery.service';
import { QueueNotificationDto } from './dto/queue-notification.dto';
import { UpsertNotificationPreferencesDto } from './dto/upsert-notification-preferences.dto';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationDeliveryService: NotificationDeliveryService,
  ) {}

  enqueue(authUser: AuthUser, payload: QueueNotificationDto) {
    return this.notificationsRepository.enqueue(authUser, {
      organizationId: payload.organizationId,
      userId: payload.userId,
      channel: payload.channel,
      templateKey: payload.templateKey,
      payload: payload.payload,
      scheduledFor: payload.scheduledFor,
    });
  }

  list(authUser: AuthUser, userId?: string) {
    return this.notificationsRepository.list(authUser, userId);
  }

  getPreference(authUser: AuthUser, userId: string) {
    return this.notificationsRepository.getPreference(authUser, userId);
  }

  upsertPreference(authUser: AuthUser, payload: UpsertNotificationPreferencesDto) {
    return this.notificationsRepository.upsertPreference(authUser, payload);
  }

  async dispatch(authUser: AuthUser, notificationId: string) {
    const notification = await this.notificationsRepository.dispatch(authUser, notificationId);
    if (notification.status !== 'pending') {
      return notification;
    }

    try {
      await this.notificationDeliveryService.deliver(notification);
      return this.notificationsRepository.markSent(notification.id, new Date());
    } catch (error) {
      return this.notificationsRepository.markFailed(
        notification.id,
        error instanceof Error ? error.message : 'Unknown dispatch failure',
      );
    }
  }

  async dispatchDue(authUser: AuthUser) {
    const due = await this.notificationsRepository.listDue(authUser, new Date());
    const ids: string[] = [];
    let failed = 0;
    let deferredQuietHours = 0;

    for (const notification of due) {
      const preference = await this.notificationsRepository.getPreference(authUser, notification.userId);
      if (preference && this.notificationsRepository.isQuietHours(preference)) {
        deferredQuietHours += 1;
        continue;
      }

      try {
        await this.notificationDeliveryService.deliver(notification);
        await this.notificationsRepository.markSent(notification.id, new Date());
        ids.push(notification.id);
      } catch (error) {
        failed += 1;
        await this.notificationsRepository.markFailed(
          notification.id,
          error instanceof Error ? error.message : 'Unknown dispatch failure',
        );
      }
    }

    return {
      dispatched: ids.length,
      failed,
      deferredQuietHours,
      ids,
    };
  }
}
