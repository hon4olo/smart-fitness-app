import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';

import {
  getSocialActionError,
  getSocialPrimaryAction,
  getSocialProfileLoadError,
  normalizeSocialLookupUsername,
  validateSocialLookupUsername,
} from './socialPublicProfileModel';

const relationship = {
  schemaVersion: 1 as const,
  following: false,
  followedBy: false,
  outgoingRequest: false,
  incomingRequest: false,
  blockedByViewer: false,
  blocksViewer: false,
};

describe('public social profile model', () => {
  it('validates and canonicalizes explicit username lookup', () => {
    expect(validateSocialLookupUsername('')).toBe('required');
    expect(validateSocialLookupUsername('bad-name')).toBe('format');
    expect(validateSocialLookupUsername('Coach_Ivan')).toBeNull();
    expect(normalizeSocialLookupUsername('  Coach_Ivan  ')).toBe('coach_ivan');
  });

  it('maps private, blocked, missing, and transport states without raw details', () => {
    const error = (status: number, code: string) =>
      new ApiError({
        code: status === 403 ? 'forbidden' : 'not_found',
        message: 'Private diagnostic',
        status,
        body: { code },
      });

    expect(getSocialProfileLoadError(error(403, 'SOCIAL_PROFILE_PRIVATE'))).toBe(
      'private',
    );
    expect(getSocialProfileLoadError(error(403, 'SOCIAL_RELATION_BLOCKED'))).toBe(
      'blocked',
    );
    expect(getSocialProfileLoadError(error(404, 'SOCIAL_PROFILE_NOT_FOUND'))).toBe(
      'not_found',
    );
    expect(
      getSocialProfileLoadError(
        new ApiError({ code: 'network_error', message: 'offline' }),
      ),
    ).toBe('offline');
  });

  it('selects the deterministic follow action from relationship state', () => {
    expect(getSocialPrimaryAction(relationship)).toBe('follow');
    expect(
      getSocialPrimaryAction({ ...relationship, outgoingRequest: true }),
    ).toBe('cancel_request');
    expect(getSocialPrimaryAction({ ...relationship, following: true })).toBe(
      'unfollow',
    );
  });

  it('contains action failures in bounded presentation states', () => {
    expect(
      getSocialActionError(
        new ApiError({
          code: 'forbidden',
          message: 'blocked',
          status: 403,
          body: { code: 'SOCIAL_RELATION_BLOCKED' },
        }),
      ),
    ).toBe('unavailable');
    expect(
      getSocialActionError(
        new ApiError({ code: 'unauthorized', message: 'expired', status: 401 }),
      ),
    ).toBe('session_expired');
    expect(getSocialActionError(new Error('private diagnostic'))).toBe('generic');
  });
});
