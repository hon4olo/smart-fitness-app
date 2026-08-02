import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '@/api/client';

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

const post = {
  schemaVersion: 2,
  id: '4d1792e8-7fe8-4dde-96c9-760f696529a8',
  author: profile,
  caption: 'Solid session',
  workout: { schemaVersion: 1, title: 'Upper body' },
  image: null,
  createdAt: '2026-07-31T09:00:00.000Z',
};

const createAuth = () => ({
  getAccessToken: vi.fn().mockResolvedValue('access-token'),
  refreshAccessToken: vi.fn().mockResolvedValue('refreshed-token'),
});

const createClient = (request: ReturnType<typeof vi.fn>): ApiClient =>
  ({ request }) as unknown as ApiClient;

describe('social workout post API', () => {
  it('sends exact share controls and an approved image binding', async () => {
    const request = vi.fn().mockResolvedValue({ post });
    const api = createSocialApi(createAuth(), createClient(request));

    await expect(
      api.createWorkoutPost({
        sourceWorkoutSessionId: '  4d1792e8-7fe8-4dde-96c9-760f696529a8  ',
        caption: '  Solid session  ',
        idempotencyKey: '  post-idempotency-key-1  ',
        share: {
          title: true,
          duration: true,
          exercises: true,
          sets: true,
          load: false,
          repetitions: true,
          rpe: false,
          volume: true,
        },
        image: {
          schemaVersion: 1,
          assetId: '  77fe3b62-e922-4f7c-822e-c5cf4a2acf21  ',
          expectedStateVersion: 6,
        },
      }),
    ).resolves.toEqual(post);

    expect(request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/social/workout-posts',
      body: {
        sourceWorkoutSessionId: '4d1792e8-7fe8-4dde-96c9-760f696529a8',
        caption: 'Solid session',
        idempotencyKey: 'post-idempotency-key-1',
        share: {
          title: true,
          duration: true,
          exercises: true,
          sets: true,
          load: false,
          repetitions: true,
          rpe: false,
          volume: true,
        },
        image: {
          schemaVersion: 1,
          assetId: '77fe3b62-e922-4f7c-822e-c5cf4a2acf21',
          expectedStateVersion: 6,
        },
      },
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('encodes profile pagination without exposing cursor structure', async () => {
    const request = vi.fn().mockResolvedValue({
      items: [post],
      nextCursor: 'next-cursor',
    });
    const api = createSocialApi(createAuth(), createClient(request));

    await expect(
      api.listWorkoutPosts(' name/segment ', {
        limit: 20,
        cursor: ' opaque+/cursor ',
      }),
    ).resolves.toEqual({ items: [post], nextCursor: 'next-cursor' });

    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      path:
        '/v1/social/profiles/name%2Fsegment/workout-posts?limit=20&cursor=opaque%2B%2Fcursor',
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('uses strict get and delete routes for a post ID', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ post })
      .mockResolvedValueOnce({ success: true });
    const api = createSocialApi(createAuth(), createClient(request));

    await expect(api.getWorkoutPost(` ${post.id} `)).resolves.toEqual(post);
    await expect(api.deleteWorkoutPost(post.id)).resolves.toBeUndefined();

    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: `/v1/social/workout-posts/${post.id}`,
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'DELETE',
      path: `/v1/social/workout-posts/${post.id}`,
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('rejects invalid local page bounds before sending a request', async () => {
    const request = vi.fn();
    const api = createSocialApi(createAuth(), createClient(request));

    await expect(api.listWorkoutPosts('coach_ivan', { limit: 51 })).rejects.toThrow(
      'Social workout post limit must be between 1 and 50',
    );
    expect(request).not.toHaveBeenCalled();
  });
});
