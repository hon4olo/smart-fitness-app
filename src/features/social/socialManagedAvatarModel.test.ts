import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client';
import type { SocialMediaOwnerAssetDto } from '@/api/social';

import { getSocialManagedAvatarCopy } from './socialManagedAvatarCopy';
import {
  canRefreshSocialManagedAvatar,
  canRetrySocialManagedAvatar,
  getSocialManagedAvatarErrorMessage,
  getSocialManagedAvatarStatusPresentation,
} from './socialManagedAvatarModel';

const copy = getSocialManagedAvatarCopy('en');
const asset = (state: SocialMediaOwnerAssetDto['state']) =>
  ({ state }) as SocialMediaOwnerAssetDto;

describe('managed avatar presentation model', () => {
  it('keeps active, review, retry and terminal states explicit', () => {
    expect(canRefreshSocialManagedAvatar(asset('processing'))).toBe(true);
    expect(canRefreshSocialManagedAvatar(asset('review_required'))).toBe(true);
    expect(canRetrySocialManagedAvatar(asset('rejected'))).toBe(true);
    expect(canRetrySocialManagedAvatar(asset('failed'))).toBe(true);
    expect(
      getSocialManagedAvatarStatusPresentation(asset('processing'), copy),
    ).toEqual({ title: copy.processingTitle, body: copy.processingBody });
  });

  it('maps bounded server and transport errors without raw details', () => {
    expect(
      getSocialManagedAvatarErrorMessage(
        new ApiError({
          code: 'service_unavailable',
          message: 'private implementation detail',
          status: 503,
          body: { code: 'SOCIAL_MEDIA_UPLOADS_UNAVAILABLE' },
        }),
        copy,
      ),
    ).toBe(copy.uploadUnavailable);
    expect(
      getSocialManagedAvatarErrorMessage(
        new ApiError({ code: 'network_error', message: 'socket detail' }),
        copy,
      ),
    ).toBe(copy.offline);
  });
});
