import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';
import type { SocialWorkoutCommentDto } from '@/api/social';

import {
  buildPendingSocialWorkoutComment,
  getSocialWorkoutCommentLoadError,
  isMissingSocialWorkoutCommentError,
  mergeSocialWorkoutComments,
  removeSocialWorkoutComment,
} from './socialWorkoutCommentModel';

const comment = (id: string): SocialWorkoutCommentDto => ({
  schemaVersion: 1,
  id,
  author: {
    schemaVersion: 1,
    username: 'coach_ivan',
    displayName: 'Ivan',
    bio: null,
    avatarUrl: null,
    visibility: 'public',
    createdAt: '2026-07-31T08:00:00.000Z',
    updatedAt: '2026-07-31T08:00:00.000Z',
  },
  body: `Comment ${id}`,
  createdAt: '2026-07-31T10:00:00.000Z',
});

describe('social workout comment model', () => {
  it('merges pages without duplicate comments and removes stale rows', () => {
    const first = comment('00000000-0000-4000-8000-000000000001');
    const second = comment('00000000-0000-4000-8000-000000000002');
    expect(mergeSocialWorkoutComments([first], [first, second])).toEqual([
      first,
      second,
    ]);
    expect(removeSocialWorkoutComment([first, second], first.id)).toEqual([
      second,
    ]);
  });

  it('reuses an idempotency key only while retrying the same trimmed body', () => {
    let sequence = 0;
    const createKey = () => `comment-key-${++sequence}-00000000`;
    const first = buildPendingSocialWorkoutComment(null, '  Strong session  ', createKey);
    const replay = buildPendingSocialWorkoutComment(first, 'Strong session', createKey);
    const changed = buildPendingSocialWorkoutComment(first, 'Different text', createKey);

    expect(first).toEqual({
      body: 'Strong session',
      idempotencyKey: 'comment-key-1-00000000',
    });
    expect(replay).toBe(first);
    expect(changed).toEqual({
      body: 'Different text',
      idempotencyKey: 'comment-key-2-00000000',
    });
  });

  it('maps stable privacy-safe comment failures', () => {
    expect(
      getSocialWorkoutCommentLoadError(
        new ApiError({
          code: 'SOCIAL_WORKOUT_COMMENT_INVALID_CURSOR',
          message: 'invalid',
          status: 400,
        }),
      ),
    ).toBe('invalid_cursor');
    expect(
      getSocialWorkoutCommentLoadError(
        new ApiError({ code: 'network_error', message: 'offline' }),
      ),
    ).toBe('offline');
    expect(
      getSocialWorkoutCommentLoadError(
        new ApiError({ code: 'unauthorized', message: 'expired', status: 401 }),
      ),
    ).toBe('session_expired');
    const missing = new ApiError({
      code: 'SOCIAL_WORKOUT_COMMENT_NOT_FOUND',
      message: 'missing',
      status: 404,
    });
    expect(getSocialWorkoutCommentLoadError(missing)).toBe('not_found');
    expect(isMissingSocialWorkoutCommentError(missing)).toBe(true);
    expect(getSocialWorkoutCommentLoadError(new Error('private detail'))).toBe(
      'generic',
    );
  });
});
