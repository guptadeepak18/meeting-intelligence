import { describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../common/auth-user.interface';
import { NotificationsService } from '../notifications.service';

const authUser: AuthUser = {
  id: 'admin-1',
  organizationId: 'org-1',
  role: 'admin',
};

describe('NotificationsService', () => {
  it('dispatches due notifications and tracks failures', async () => {
    const repository = {
      listDue: vi.fn().mockResolvedValue([
        { id: 'n1', channel: 'in_app', templateKey: 'task_assigned', userId: 'u1', payload: {} },
        { id: 'n2', channel: 'email', templateKey: 'task_assigned', userId: 'u2', payload: {} },
      ]),
      getPreference: vi.fn().mockResolvedValue(null),
      isQuietHours: vi.fn().mockReturnValue(false),
      markSent: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    };

    const delivery = {
      deliver: vi.fn().mockImplementation(async (notification: { id: string }) => {
        if (notification.id === 'n2') {
          throw new Error('Provider unavailable');
        }
      }),
    };

    const service = new NotificationsService(repository as any, delivery as any);
    const result = await service.dispatchDue(authUser);

    expect(result).toEqual({
      dispatched: 1,
      failed: 1,
      deferredQuietHours: 0,
      ids: ['n1'],
    });
    expect(repository.markSent).toHaveBeenCalledTimes(1);
    expect(repository.markFailed).toHaveBeenCalledTimes(1);
  });
});
