import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import {
  getSocialApiErrorCode,
  parseOwnSocialProfileResponse,
  parseSocialProfileDto,
  parseSocialProfileListPageResponse,
  parseSocialProfileViewResponse,
  parseSocialRelationshipDto,
} from './parsers';

const profile = {
  schemaVersion: 1,
  username: 'coach_ivan',
  displayName: 'Ivan',
  bio: 'Strength training',
  avatarUrl: 'https://example.com/avatar.png',
  visibility: 'private',
  createdAt: '2026-07-31T08:00:00.000Z',
  updatedAt: '2026-07-31T08:10:00.000Z',
};

const relationship = {
  schemaVersion: 1,
  following: false,
  followedBy: true,
  outgoingRequest: true,
  incomingRequest: false,
  blockedByViewer: false,
  blocksViewer: false,
};

describe('social API parsers', () => {
  it('parses versioned profile and relationship DTOs', () => {
    expect(parseSocialProfileDto(profile)).toEqual(profile);
    expect(parseSocialRelationshipDto(relationship)).toEqual(relationship);
    expect(
      parseSocialProfileViewResponse({ profile, relationship }),
    ).toEqual({ profile, relationship });
  });

  it('parses strict cursor-paginated social profile lists', () => {
    const page = {
      schemaVersion: 1,
      items: [
        {
          profile,
          createdAt: '2026-07-31T08:15:00.000Z',
        },
      ],
      nextCursor: 'opaque-cursor',
    };

    expect(parseSocialProfileListPageResponse(page)).toEqual(page);
    expect(
      parseSocialProfileListPageResponse({
        schemaVersion: 1,
        items: [],
        nextCursor: null,
      }),
    ).toEqual({ schemaVersion: 1, items: [], nextCursor: null });
  });

  it('supports an account without a social profile', () => {
    expect(parseOwnSocialProfileResponse({ profile: null })).toBeNull();
  });

  it('fails closed for unsupported versions, malformed fields, and extra private data', () => {
    expect(() =>
      parseSocialProfileDto({ ...profile, schemaVersion: 2 }),
    ).toThrow();
    expect(() =>
      parseSocialProfileDto({ ...profile, createdAt: 'not-a-date' }),
    ).toThrow();
    expect(() =>
      parseSocialProfileDto({ ...profile, username: 'Coach-Ivan' }),
    ).toThrow();
    expect(() =>
      parseSocialProfileDto({ ...profile, email: 'private@example.com' }),
    ).toThrow();
    expect(() =>
      parseSocialRelationshipDto({ ...relationship, targetUserId: 'private-id' }),
    ).toThrow();
    expect(() =>
      parseSocialProfileListPageResponse({
        schemaVersion: 2,
        items: [],
        nextCursor: null,
      }),
    ).toThrow();
    expect(() =>
      parseSocialProfileListPageResponse({
        schemaVersion: 1,
        items: [{ profile, createdAt: 'not-a-date' }],
        nextCursor: null,
      }),
    ).toThrow();
    expect(() =>
      parseSocialProfileListPageResponse({
        schemaVersion: 1,
        items: [],
        nextCursor: '',
      }),
    ).toThrow();
    expect(() =>
      parseSocialProfileListPageResponse({
        schemaVersion: 1,
        items: [],
        nextCursor: null,
        userId: 'private-id',
      }),
    ).toThrow();
  });

  it('extracts only stable bounded backend social error codes', () => {
    const blocked = new ApiError({
      code: 'forbidden',
      message: 'Forbidden',
      status: 403,
      body: { code: 'SOCIAL_RELATION_BLOCKED' },
    });
    const invalidCursor = new ApiError({
      code: 'bad_request',
      message: 'Bad request',
      status: 400,
      body: { code: 'SOCIAL_RELATION_LIST_INVALID_CURSOR' },
    });
    const unknown = new ApiError({
      code: 'unknown',
      message: 'Unknown',
      body: { code: 'SOCIAL_INTERNAL_DIAGNOSTIC' },
    });

    expect(getSocialApiErrorCode(blocked)).toBe('SOCIAL_RELATION_BLOCKED');
    expect(getSocialApiErrorCode(invalidCursor)).toBe(
      'SOCIAL_RELATION_LIST_INVALID_CURSOR',
    );
    expect(getSocialApiErrorCode(unknown)).toBeNull();
    expect(getSocialApiErrorCode(new Error('network'))).toBeNull();
  });
});
