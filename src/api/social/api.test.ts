import { describe, expect, it, vi } from 'vitest';

import { ApiError, type ApiClient } from '@/api/client';

import { createSocialApi } from './api';

const profile = {
  schemaVersion: 1,
  username: 'coach_ivan',
  displayName: 'Ivan',
  bio: null,
  avatarUrl: null,
  visibility: 'public',
  createdAt: '2026-07-31T08:00:00.000Z',
  updatedAt: '2026-07-31T08:00:00.000Z',
};

const relationship = {
  schemaVersion: 1,
  following: true,
  followedBy: false,
  outgoingRequest: false,
  incomingRequest: false,
  blockedByViewer: false,
  blocksViewer: false,
};

const listPage = {
  schemaVersion: 1,
  items: [{ profile, createdAt: '2026-07-31T08:15:00.000Z' }],
  nextCursor: 'next-page',
};

const workoutPostPage = {
  items: [
    {
      schemaVersion: 1,
      id: '00000000-0000-4000-8000-000000000001',
      author: profile,
      caption: 'Training day',
      workout: { schemaVersion: 1, title: 'Upper body' },
      createdAt: '2026-07-31T09:00:00.000Z',
    },
  ],
  nextCursor: 'feed-next-page',
};

const reaction = {
  schemaVersion: 1,
  reacted: true,
  reactionCount: 7,
};

const createAuth = () => ({
  getAccessToken: vi.fn().mockResolvedValue('access-token'),
  refreshAccessToken: vi.fn().mockResolvedValue('refreshed-token'),
});

const createClient = (request: ReturnType<typeof vi.fn>): ApiClient =>
  ({ request }) as unknown as ApiClient;

describe('social API client', () => {
  it('refreshes once after 401 and preserves the exact request', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          code: 'unauthorized',
          message: 'Unauthorized',
          status: 401,
        }),
      )
      .mockResolvedValueOnce({ profile });
    const auth = createAuth();
    const api = createSocialApi(auth, createClient(request));

    await expect(api.getOwnProfile()).resolves.toEqual(profile);
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/v1/social/profile',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      path: '/v1/social/profile',
      headers: { authorization: 'Bearer refreshed-token' },
      retry: false,
    });
  });

  it('sends only bounded profile fields after trimming form values', async () => {
    const request = vi.fn().mockResolvedValue({ profile });
    const api = createSocialApi(createAuth(), createClient(request));

    await api.upsertOwnProfile({
      username: '  Coach_Ivan  ',
      displayName: '  Ivan  ',
      bio: '  Strength training  ',
      avatarUrl: null,
      visibility: 'private',
    });

    expect(request).toHaveBeenCalledWith({
      method: 'PUT',
      path: '/v1/social/profile',
      body: {
        username: 'Coach_Ivan',
        displayName: 'Ivan',
        bio: 'Strength training',
        avatarUrl: null,
        visibility: 'private',
      },
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('encodes username route segments and exposes idempotent relation actions', async () => {
    const request = vi.fn().mockResolvedValue({ relationship });
    const api = createSocialApi(createAuth(), createClient(request));

    await expect(api.follow('name/segment')).resolves.toEqual(relationship);
    await expect(api.cancelFollowRequest('coach_ivan')).resolves.toEqual(
      relationship,
    );

    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'POST',
      path: '/v1/social/profiles/name%2Fsegment/follow',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'DELETE',
      path: '/v1/social/profiles/coach_ivan/follow',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('lists every relationship collection with bounded opaque pagination', async () => {
    const request = vi.fn().mockResolvedValue(listPage);
    const api = createSocialApi(createAuth(), createClient(request));

    await expect(
      api.listFollowers({ limit: 10, cursor: 'cursor/value' }),
    ).resolves.toEqual(listPage);
    await expect(api.listFollowing()).resolves.toEqual(listPage);
    await expect(api.listIncomingFollowRequests()).resolves.toEqual(listPage);
    await expect(api.listOutgoingFollowRequests()).resolves.toEqual(listPage);

    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/v1/social/followers?limit=10&cursor=cursor%2Fvalue',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      path: '/v1/social/following',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      method: 'GET',
      path: '/v1/social/follow-requests/incoming',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(4, {
      method: 'GET',
      path: '/v1/social/follow-requests/outgoing',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('lists the chronological following feed with bounded opaque pagination', async () => {
    const request = vi.fn().mockResolvedValue(workoutPostPage);
    const api = createSocialApi(createAuth(), createClient(request));

    await expect(
      api.listFollowingFeed({ limit: 12, cursor: 'feed/cursor' }),
    ).resolves.toEqual(workoutPostPage);

    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/social/feed?limit=12&cursor=feed%2Fcursor',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('gets, adds, and removes an encoded workout-post reaction', async () => {
    const request = vi.fn().mockResolvedValue({ reaction });
    const api = createSocialApi(createAuth(), createClient(request));

    await expect(api.getWorkoutPostReaction('post/segment')).resolves.toEqual(
      reaction,
    );
    await expect(api.reactToWorkoutPost('post/segment')).resolves.toEqual(
      reaction,
    );
    await expect(api.unreactToWorkoutPost('post/segment')).resolves.toEqual(
      reaction,
    );

    for (const [index, method] of ['GET', 'PUT', 'DELETE'].entries()) {
      expect(request).toHaveBeenNthCalledWith(index + 1, {
        method,
        path: '/v1/social/workout-posts/post%2Fsegment/reaction',
        headers: { authorization: 'Bearer access-token' },
        retry: false,
      });
    }
  });

  it('rejects invalid pagination and reaction IDs before network access', async () => {
    const request = vi.fn().mockResolvedValue(listPage);
    const api = createSocialApi(createAuth(), createClient(request));

    await expect(api.listFollowers({ limit: 0 })).rejects.toThrow(
      'between 1 and 50',
    );
    await expect(api.listFollowers({ limit: 51 })).rejects.toThrow(
      'between 1 and 50',
    );
    await expect(api.listFollowers({ cursor: '   ' })).rejects.toThrow(
      'must not be empty',
    );
    await expect(api.listFollowingFeed({ limit: 0 })).rejects.toThrow(
      'between 1 and 50',
    );
    await expect(api.listFollowingFeed({ cursor: '   ' })).rejects.toThrow(
      'must not be empty',
    );
    await expect(api.getWorkoutPostReaction('   ')).rejects.toThrow(
      'Social workout post ID is required',
    );
    await expect(api.reactToWorkoutPost('   ')).rejects.toThrow(
      'Social workout post ID is required',
    );
    await expect(api.unreactToWorkoutPost('   ')).rejects.toThrow(
      'Social workout post ID is required',
    );
    expect(request).not.toHaveBeenCalled();
  });
});
