import { describe, expect, it, vi } from 'vitest';

import { ApiError, type ApiClient } from '@/api/client';

import { createSocialNotificationApi } from './notification-api';

const actor = {
  schemaVersion: 1,
  username: 'coach_ivan',
  displayName: 'Ivan',
  bio: null,
  avatarUrl: null,
  visibility: 'public',
  createdAt: '2026-07-31T08:00:00.000Z',
  updatedAt: '2026-07-31T08:00:00.000Z',
};

const notification = {
  schemaVersion: 1,
  id: '00000000-0000-4000-8000-000000000201',
  type: 'workout_reaction',
  actor,
  postId: '00000000-0000-4000-8000-000000000101',
  commentId: null,
  readAt: null,
  createdAt: '2026-07-31T10:00:00.000Z',
};

const page = {
  schemaVersion: 1,
  items: [notification],
  nextCursor: 'next-notification-page',
};

const createAuth = () => ({
  getAccessToken: vi.fn().mockResolvedValue('access-token'),
  refreshAccessToken: vi.fn().mockResolvedValue('refreshed-token'),
});

const createClient = (request: ReturnType<typeof vi.fn>): ApiClient =>
  ({ request }) as unknown as ApiClient;

describe('social notification API', () => {
  it('lists notifications with bounded opaque pagination', async () => {
    const request = vi.fn().mockResolvedValue(page);
    const api = createSocialNotificationApi(createAuth(), createClient(request));

    await expect(
      api.listNotifications({ limit: 20, cursor: 'notification/cursor' }),
    ).resolves.toEqual(page);

    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/social/notifications?limit=20&cursor=notification%2Fcursor',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('marks an encoded notification read and refreshes once after 401', async () => {
    const readNotification = {
      ...notification,
      readAt: '2026-07-31T10:05:00.000Z',
    };
    const request = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          code: 'unauthorized',
          message: 'Unauthorized',
          status: 401,
        }),
      )
      .mockResolvedValueOnce({ notification: readNotification });
    const auth = createAuth();
    const api = createSocialNotificationApi(auth, createClient(request));

    await expect(api.markNotificationRead('notification/segment')).resolves.toEqual(
      readNotification,
    );
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'PUT',
      path: '/v1/social/notifications/notification%2Fsegment/read',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'PUT',
      path: '/v1/social/notifications/notification%2Fsegment/read',
      headers: { authorization: 'Bearer refreshed-token' },
      retry: false,
    });
  });

  it('rejects invalid pagination and IDs before network access', async () => {
    const request = vi.fn().mockResolvedValue(page);
    const api = createSocialNotificationApi(createAuth(), createClient(request));

    await expect(api.listNotifications({ limit: 0 })).rejects.toThrow(
      'between 1 and 50',
    );
    await expect(api.listNotifications({ limit: 51 })).rejects.toThrow(
      'between 1 and 50',
    );
    await expect(api.listNotifications({ cursor: '   ' })).rejects.toThrow(
      'must not be empty',
    );
    await expect(api.markNotificationRead('   ')).rejects.toThrow(
      'Social notification ID is required',
    );
    expect(request).not.toHaveBeenCalled();
  });
});
