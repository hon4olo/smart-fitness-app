import { describe, expect, it } from 'vitest';

import {
  parseBindManagedAvatarResponse,
  parseCreateSocialMediaUploadResponse,
  parseSocialMediaOwnerAssetDto,
} from './media-parsers';

const assetId = '11111111-1111-4111-8111-111111111111';
const hash = 'a'.repeat(64);
const iso = '2026-08-02T04:00:00.000Z';

const descriptor = {
  schemaVersion: 1,
  assetId,
  assetType: 'avatar',
  width: 512,
  height: 512,
  aspectRatio: 1,
  placeholder: { type: 'average_color', value: '#112233' },
  variants: Object.fromEntries(
    [64, 128, 256, 512].map((size) => [
      `avatar_${size}`,
      {
        width: size,
        height: size,
        mimeType: 'image/jpeg',
        contentHash: hash,
        url: `https://media.example.test/public/social-media/v1/${assetId}/avatar_${size}/${hash}.jpg`,
      },
    ]),
  ),
};

const asset = {
  schemaVersion: 1,
  assetId,
  assetType: 'avatar',
  state: 'approved',
  stateVersion: 4,
  stateReasonCode: null,
  uploadExpiresAt: null,
  declaredMediaType: 'image/jpeg',
  declaredByteSize: 1234,
  source: {
    validationVersion: 1,
    mediaType: 'image/jpeg',
    byteSize: 1234,
    width: 512,
    height: 512,
    pixelCount: 262144,
    sha256: 'b'.repeat(64),
  },
  moderation: {
    schemaVersion: 1,
    policyVersion: 'social-image-v1',
    decision: 'allow',
    reasonCodes: [],
    failureCode: null,
    normalizedAt: iso,
    moderatedAt: iso,
  },
  publicDescriptor: descriptor,
  createdAt: iso,
  updatedAt: iso,
  quarantinedAt: iso,
  failedAt: null,
  deletedAt: null,
};

const profile = {
  schemaVersion: 1,
  username: 'coach_ivan',
  displayName: 'Ivan',
  bio: null,
  avatarUrl: descriptor.variants.avatar_256.url,
  visibility: 'public',
  createdAt: iso,
  updatedAt: iso,
};

describe('managed social media parsers', () => {
  it('accepts strict owner assets and owner-opaque immutable URLs', () => {
    expect(parseSocialMediaOwnerAssetDto(asset)).toMatchObject({
      assetId,
      state: 'approved',
    });
  });

  it('rejects owner IDs and extra fields in public descriptors', () => {
    const leaked = structuredClone(asset);
    leaked.publicDescriptor.variants.avatar_256.url =
      `https://media.example.test/public/social-media/v1/22222222-2222-4222-8222-222222222222/${assetId}/avatar_256/${hash}.jpg`;
    expect(() => parseSocialMediaOwnerAssetDto(leaked)).toThrow(
      'Invalid managed media variant response',
    );

    const extra = { ...asset, ownerId: 'private' };
    expect(() => parseSocialMediaOwnerAssetDto(extra)).toThrow(
      'Invalid managed media asset response',
    );
  });

  it('parses create-upload and binding envelopes', () => {
    expect(
      parseCreateSocialMediaUploadResponse({
        asset: { ...asset, state: 'upload_pending', stateVersion: 1, publicDescriptor: null },
        upload: {
          schemaVersion: 1,
          method: 'PUT',
          url: 'https://private-upload.example.test/signed',
          headers: { 'content-type': 'image/jpeg' },
          expiresAt: '2026-08-02T04:10:00.000Z',
        },
      }).upload.method,
    ).toBe('PUT');
    expect(parseBindManagedAvatarResponse({ profile, asset }).asset.assetId).toBe(
      assetId,
    );
  });
});
