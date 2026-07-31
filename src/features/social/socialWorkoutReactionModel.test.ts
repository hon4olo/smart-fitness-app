import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/client';
import type { SocialApi, SocialWorkoutReactionDto } from '@/api/social';

import {
  getSocialWorkoutReactionLoadError,
  toggleSocialWorkoutReaction,
} from './socialWorkoutReactionModel';

const reaction = (
  reacted: boolean,
): SocialWorkoutReactionDto => ({
  schemaVersion: 1,
  reacted,
  reactionCount: reacted ? 4 : 3,
});

describe('social workout reaction model', () => {
  it('adds a reaction when the viewer has not reacted', async () => {
    const next = reaction(true);
    const api = {
      reactToWorkoutPost: vi.fn().mockResolvedValue(next),
      unreactToWorkoutPost: vi.fn(),
    } satisfies Pick<
      SocialApi,
      'reactToWorkoutPost' | 'unreactToWorkoutPost'
    >;

    await expect(
      toggleSocialWorkoutReaction(api, 'post-id', reaction(false)),
    ).resolves.toEqual(next);
    expect(api.reactToWorkoutPost).toHaveBeenCalledWith('post-id');
    expect(api.unreactToWorkoutPost).not.toHaveBeenCalled();
  });

  it('removes a reaction when the viewer has reacted', async () => {
    const next = reaction(false);
    const api = {
      reactToWorkoutPost: vi.fn(),
      unreactToWorkoutPost: vi.fn().mockResolvedValue(next),
    } satisfies Pick<
      SocialApi,
      'reactToWorkoutPost' | 'unreactToWorkoutPost'
    >;

    await expect(
      toggleSocialWorkoutReaction(api, 'post-id', reaction(true)),
    ).resolves.toEqual(next);
    expect(api.unreactToWorkoutPost).toHaveBeenCalledWith('post-id');
    expect(api.reactToWorkoutPost).not.toHaveBeenCalled();
  });

  it('maps bounded transport failures without exposing raw errors', () => {
    expect(
      getSocialWorkoutReactionLoadError(
        new ApiError({ code: 'network_error', message: 'offline' }),
      ),
    ).toBe('offline');
    expect(
      getSocialWorkoutReactionLoadError(
        new ApiError({ code: 'unauthorized', message: 'expired', status: 401 }),
      ),
    ).toBe('session_expired');
    expect(getSocialWorkoutReactionLoadError(new Error('private detail'))).toBe(
      'generic',
    );
  });
});
