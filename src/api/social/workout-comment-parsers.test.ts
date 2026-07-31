import { describe, expect, it } from 'vitest';

import {
  parseDeleteSocialWorkoutCommentResponse,
  parseSocialWorkoutCommentDto,
  parseSocialWorkoutCommentPageResponse,
  parseSocialWorkoutCommentResponse,
} from './workout-comment-parsers';

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

const comment = {
  schemaVersion: 1,
  id: '00000000-0000-4000-8000-000000000101',
  author: profile,
  body: 'Strong session',
  createdAt: '2026-07-31T10:00:00.000Z',
};

describe('social workout comment parsers', () => {
  it('parses strict comment, envelope, page, and delete responses', () => {
    expect(parseSocialWorkoutCommentDto(comment)).toEqual(comment);
    expect(parseSocialWorkoutCommentResponse({ comment })).toEqual(comment);
    expect(
      parseSocialWorkoutCommentPageResponse({
        schemaVersion: 1,
        items: [comment],
        nextCursor: 'next-comment-page',
      }),
    ).toEqual({
      schemaVersion: 1,
      items: [comment],
      nextCursor: 'next-comment-page',
    });
    expect(parseDeleteSocialWorkoutCommentResponse({ success: true })).toBe(
      undefined,
    );
  });

  it.each([
    { ...comment, schemaVersion: 2 },
    { ...comment, id: 'not-a-uuid' },
    { ...comment, body: '' },
    { ...comment, body: ' padded ' },
    { ...comment, body: 'x'.repeat(501) },
    { ...comment, createdAt: 'invalid-date' },
    { ...comment, email: 'private@example.com' },
    { ...comment, author: { ...profile, email: 'private@example.com' } },
  ])('rejects malformed or expanded comment payloads', (value) => {
    expect(() => parseSocialWorkoutCommentDto(value)).toThrow(
      'Invalid social workout comment response',
    );
  });

  it('rejects expanded envelopes, duplicate IDs, oversized pages, and invalid cursors', () => {
    expect(() =>
      parseSocialWorkoutCommentResponse({ comment, privateData: true }),
    ).toThrow('Invalid social workout comment response');
    expect(() =>
      parseSocialWorkoutCommentPageResponse({
        schemaVersion: 1,
        items: [comment, comment],
        nextCursor: null,
      }),
    ).toThrow('Invalid social workout comment page response');
    expect(() =>
      parseSocialWorkoutCommentPageResponse({
        schemaVersion: 1,
        items: Array.from({ length: 51 }, (_, index) => ({
          ...comment,
          id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        })),
        nextCursor: null,
      }),
    ).toThrow('Invalid social workout comment page response');
    expect(() =>
      parseSocialWorkoutCommentPageResponse({
        schemaVersion: 1,
        items: [],
        nextCursor: '',
      }),
    ).toThrow('Invalid social workout comment page response');
    expect(() => parseDeleteSocialWorkoutCommentResponse({ success: false })).toThrow(
      'Invalid social workout comment delete response',
    );
  });
});
