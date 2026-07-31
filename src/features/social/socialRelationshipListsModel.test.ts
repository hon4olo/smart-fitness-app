import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import {
  getSocialRelationshipListError,
  mergeSocialProfileListItems,
  removeSocialProfileListItem,
} from './socialRelationshipListsModel';

const item = (username: string) => ({
  profile: {
    schemaVersion: 1 as const,
    username,
    displayName: username,
    bio: null,
    avatarUrl: null,
    visibility: 'public' as const,
    createdAt: '2026-07-31T08:00:00.000Z',
    updatedAt: '2026-07-31T08:00:00.000Z',
  },
  createdAt: '2026-07-31T08:15:00.000Z',
});

describe('social relationship list model', () => {
  it('merges cursor pages without duplicate profiles', () => {
    expect(
      mergeSocialProfileListItems(
        [item('alice'), item('bob')],
        [item('bob'), item('carol')],
      ).map((value) => value.profile.username),
    ).toEqual(['alice', 'bob', 'carol']);
  });

  it('removes a completed relationship action from the current list', () => {
    expect(
      removeSocialProfileListItem([item('alice'), item('bob')], 'alice').map(
        (value) => value.profile.username,
      ),
    ).toEqual(['bob']);
  });

  it('maps cursor, auth, network, and generic errors', () => {
    expect(
      getSocialRelationshipListError(
        new ApiError({
          code: 'validation_error',
          message: 'Invalid cursor',
          status: 400,
          body: { code: 'SOCIAL_RELATION_LIST_INVALID_CURSOR' },
        }),
      ),
    ).toBe('invalid_cursor');
    expect(
      getSocialRelationshipListError(
        new ApiError({ code: 'unauthorized', message: 'Expired', status: 401 }),
      ),
    ).toBe('session_expired');
    expect(
      getSocialRelationshipListError(
        new ApiError({ code: 'network_error', message: 'Offline' }),
      ),
    ).toBe('offline');
    expect(getSocialRelationshipListError(new Error('unknown'))).toBe('generic');
  });
});
