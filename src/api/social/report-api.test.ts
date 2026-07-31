import { describe, expect, it, vi } from 'vitest';

import { ApiError, type ApiClient } from '@/api/client';

import { createSocialReportApi } from './report-api';

const receipt = {
  report: {
    schemaVersion: 1,
    received: true,
  },
} as const;

const createAuth = () => ({
  getAccessToken: vi.fn().mockResolvedValue('access-token'),
  refreshAccessToken: vi.fn().mockResolvedValue('refreshed-token'),
});

const createClient = (request: ReturnType<typeof vi.fn>): ApiClient =>
  ({ request }) as unknown as ApiClient;

describe('social report API', () => {
  it('posts exact encoded profile, post, and comment report requests', async () => {
    const request = vi.fn().mockResolvedValue(receipt);
    const api = createSocialReportApi(createAuth(), createClient(request));

    await expect(
      api.reportProfile('coach/name', { reason: 'impersonation' }),
    ).resolves.toEqual(receipt.report);
    await expect(
      api.reportWorkoutPost('post/segment', { reason: 'spam' }),
    ).resolves.toEqual(receipt.report);
    await expect(
      api.reportWorkoutComment('post/segment', 'comment/segment', {
        reason: 'harassment',
      }),
    ).resolves.toEqual(receipt.report);

    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'POST',
      path: '/v1/social/reports/profiles/coach%2Fname',
      body: { reason: 'impersonation' },
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      path: '/v1/social/reports/workout-posts/post%2Fsegment',
      body: { reason: 'spam' },
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      method: 'POST',
      path:
        '/v1/social/reports/workout-posts/post%2Fsegment/comments/comment%2Fsegment',
      body: { reason: 'harassment' },
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('refreshes once after 401 without changing the report payload', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          code: 'unauthorized',
          message: 'Unauthorized',
          status: 401,
        }),
      )
      .mockResolvedValueOnce(receipt);
    const auth = createAuth();
    const api = createSocialReportApi(auth, createClient(request));

    await expect(
      api.reportWorkoutPost('post-id', { reason: 'privacy' }),
    ).resolves.toEqual(receipt.report);
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'POST',
      path: '/v1/social/reports/workout-posts/post-id',
      body: { reason: 'privacy' },
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      path: '/v1/social/reports/workout-posts/post-id',
      body: { reason: 'privacy' },
      headers: { authorization: 'Bearer refreshed-token' },
      retry: false,
    });
  });

  it('rejects blank targets and invalid runtime reasons before network access', async () => {
    const request = vi.fn().mockResolvedValue(receipt);
    const api = createSocialReportApi(createAuth(), createClient(request));

    await expect(
      api.reportProfile('   ', { reason: 'spam' }),
    ).rejects.toThrow('Social profile username is required');
    await expect(
      api.reportWorkoutPost('   ', { reason: 'spam' }),
    ).rejects.toThrow('Social workout post ID is required');
    await expect(
      api.reportWorkoutComment('post-id', '   ', { reason: 'spam' }),
    ).rejects.toThrow('Social workout comment ID is required');
    await expect(
      api.reportProfile('target', {
        reason: 'free-form-reason' as never,
      }),
    ).rejects.toThrow('Social report reason is invalid');
    expect(request).not.toHaveBeenCalled();
  });
});
