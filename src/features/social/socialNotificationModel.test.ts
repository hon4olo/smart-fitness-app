import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';
import type { SocialNotificationDto } from '@/api/social';

import {
  getSocialNotificationLoadError,
  getSocialNotificationTarget,
  isMissingSocialNotificationError,
  markSocialNotificationReadOptimistically,
  mergeSocialNotifications,
  removeSocialNotification,
  replaceSocialNotification,
} from './socialNotificationModel';

const notification = (
  id: string,
  type: SocialNotificationDto['type'] = 'follow_request',
): SocialNotificationDto => ({
  schemaVersion: 1,
  id,
  type,
  actor: {
    schemaVersion: 1,
    username: 'coach_ivan',
    displayName: 'Ivan',
    bio: null,
    avatarUrl: null,
    visibility: 'public',
    createdAt: '2026-07-31T08:00:00.000Z',
    updatedAt: '2026-07-31T08:00:00.000Z',
  },
  postId:
    type === 'workout_reaction' || type === 'workout_comment'
      ? '00000000-0000-4000-8000-000000000101'
      : null,
  commentId:
    type === 'workout_comment'
      ? '00000000-0000-4000-8000-000000000102'
      : null,
  readAt: null,
  createdAt: '2026-07-31T10:00:00.000Z',
});

const socialError = (code: string, status: number): ApiError =>
  new ApiError({
    code: status === 404 ? 'not_found' : 'validation_error',
    message: code,
    status,
    body: { code },
  });

describe('social notification model', () => {
  it('merges, replaces, and removes notifications without duplicates', () => {
    const first = notification('00000000-0000-4000-8000-000000000201');
    const second = notification('00000000-0000-4000-8000-000000000202');
    expect(mergeSocialNotifications([first], [first, second])).toEqual([
      first,
      second,
    ]);
    const readSecond = { ...second, readAt: '2026-07-31T10:05:00.000Z' };
    expect(replaceSocialNotification([first, second], readSecond)).toEqual([
      first,
      readSecond,
    ]);
    expect(removeSocialNotification([first, second], first.id)).toEqual([
      second,
    ]);
  });

  it('marks unread rows optimistically without changing already-read rows', () => {
    const unread = notification('00000000-0000-4000-8000-000000000201');
    const read = { ...unread, readAt: '2026-07-31T10:01:00.000Z' };
    expect(
      markSocialNotificationReadOptimistically(
        unread,
        '2026-07-31T10:02:00.000Z',
      ).readAt,
    ).toBe('2026-07-31T10:02:00.000Z');
    expect(
      markSocialNotificationReadOptimistically(
        read,
        '2026-07-31T10:03:00.000Z',
      ),
    ).toBe(read);
  });

  it('routes relationship events to profiles and workout events to posts', () => {
    expect(
      getSocialNotificationTarget(
        notification('00000000-0000-4000-8000-000000000201'),
      ),
    ).toEqual({ kind: 'profile', username: 'coach_ivan' });
    expect(
      getSocialNotificationTarget(
        notification(
          '00000000-0000-4000-8000-000000000202',
          'workout_comment',
        ),
      ),
    ).toEqual({
      kind: 'workout_post',
      postId: '00000000-0000-4000-8000-000000000101',
    });
  });

  it('maps bounded load and stale-read failures', () => {
    expect(
      getSocialNotificationLoadError(
        socialError('SOCIAL_NOTIFICATION_INVALID_CURSOR', 400),
      ),
    ).toBe('invalid_cursor');
    expect(
      getSocialNotificationLoadError(
        new ApiError({ code: 'network_error', message: 'offline' }),
      ),
    ).toBe('offline');
    expect(
      getSocialNotificationLoadError(
        new ApiError({ code: 'unauthorized', message: 'expired', status: 401 }),
      ),
    ).toBe('session_expired');
    const missing = socialError('SOCIAL_NOTIFICATION_NOT_FOUND', 404);
    expect(isMissingSocialNotificationError(missing)).toBe(true);
    expect(getSocialNotificationLoadError(new Error('private detail'))).toBe(
      'generic',
    );
  });
});
