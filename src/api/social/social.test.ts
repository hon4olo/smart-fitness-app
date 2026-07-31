import { describe, expect, it, vi } from 'vitest';

import { ApiError, type ApiClient } from '@/api/client';

import { createSocialApi } from './client';
import {
  SocialApiAuthError,
  type SocialApiAuth,
  type SocialProfile,
  type SocialRelationship,
} from './contracts';
import {
  parseOwnSocialProfileEnvelope,
  parseSocialProfile,
  parseSocialProfileView,
  parseSocialRelationship,
} from './parsers';

const profile: SocialProfile = {
  schemaVersion: 1,
  username: 'alice_fit',
  displayName: 'Alice',
  bio: 'Training consistently.',
  avatarUrl: 'https://cdn.example.com/alice.jpg',
  visibility: 'public',
  createdAt: '2026-07-31T07:00:00.000Z',
  updatedAt: '2026-07-31T07:05:00.000Z',
};

const relationship: SocialRelationship = {
  schemaVersion: 1,
  following: false,
  followedBy: false,
  outgoingRequest: false,
  incomingRequest: false,
  blockedByViewer: false,
  blocksViewer: false,
};

const profileView = { profile, relationship };
const relationshipEnvelope = { relationship };

const createAuth = (accessToken: string | null = 'access-token'): SocialApiAuth & {
  getAccessToken: ReturnType<typeof vi.fn>;
  refreshAccessToken: ReturnType<typeof vi.fn>;
} => ({
  getAccessToken: vi.fn().mockResolvedValue(accessToken),
  refreshAccessToken: vi.fn().mockResolvedValue('refreshed-token'),
});

const createClient = (overrides: Partial<ApiClient> = {}) => {
  const client = {
    request: vi.fn(),
    get: vi.fn().mockResolvedValue(profileView),
    post: vi.fn().mockResolvedValue(relationshipEnvelope),
    put: vi.fn().mockResolvedValue({ profile }),
    patch: vi.fn(),
    delete: vi.fn().mockResolvedValue(relationshipEnvelope),
    ...overrides,
  } as unknown as ApiClient;
  return client;
};

describe('social API parsers', () => {
  it('accepts the bounded v1 profile and relationship envelopes', () => {
    expect(parseSocialProfile(profile)).toEqual(profile);
    expect(parseSocialRelationship(relationship)).toEqual(relationship);
    expect(parseSocialProfileView(profileView)).toEqual(profileView);
    expect(parseOwnSocialProfileEnvelope({ profile: null })).toBeNull();
    expect(parseOwnSocialProfileEnvelope({ profile })).toEqual(profile);
  });

  it.each(['id', 'userId', 'email', 'deviceId', 'followersCount'])(
    'rejects unexpected profile field %s',
    (field) => {
      expect(() =>
        parseSocialProfile({ ...profile, [field]: 'private-value' }),
      ).toThrow('Invalid profile fields');
    },
  );

  it('rejects malformed profile identity, schema, timestamps, and avatar URL', () => {
    expect(() => parseSocialProfile({ ...profile, schemaVersion: 2 })).toThrow();
    expect(() =>
      parseSocialProfile({ ...profile, username: 'Alice-Fit' }),
    ).toThrow();
    expect(() =>
      parseSocialProfile({ ...profile, updatedAt: 'not-a-date' }),
    ).toThrow();
    expect(() =>
      parseSocialProfile({ ...profile, avatarUrl: 'file:///private/avatar' }),
    ).toThrow();
  });

  it('rejects unknown or internally inconsistent relationship states', () => {
    expect(() =>
      parseSocialRelationship({ ...relationship, relationId: 'internal-id' }),
    ).toThrow('Invalid relationship fields');
    expect(() =>
      parseSocialRelationship({
        ...relationship,
        following: true,
        outgoingRequest: true,
      }),
    ).toThrow('Invalid social relationship state');
    expect(() =>
      parseSocialRelationship({
        ...relationship,
        following: true,
        blockedByViewer: true,
      }),
    ).toThrow('Invalid social relationship state');
  });
});

describe('createSocialApi', () => {
  it('uses authenticated canonical endpoints and encodes usernames', async () => {
    const client = createClient();
    const api = createSocialApi(createAuth(), client);

    await expect(api.getProfile('alice fit')).resolves.toEqual(profileView);
    expect(client.get).toHaveBeenCalledWith(
      '/v1/social/profiles/alice%20fit',
      { headers: { authorization: 'Bearer access-token' } },
    );
  });

  it('sends the exact profile mutation once with transport retry disabled', async () => {
    const client = createClient();
    const api = createSocialApi(createAuth(), client);
    const input = {
      username: 'alice_fit',
      displayName: 'Alice',
      bio: null,
      visibility: 'private' as const,
    };

    await expect(api.upsertOwnProfile(input)).resolves.toEqual(profile);
    expect(client.put).toHaveBeenCalledWith('/v1/social/profile', input, {
      headers: { authorization: 'Bearer access-token' },
      retry: false,
    });
  });

  it('maps follow, request, and block actions to bounded write endpoints', async () => {
    const client = createClient();
    const api = createSocialApi(createAuth(), client);

    await api.follow('target_user');
    await api.unfollow('target_user');
    await api.approveFollowRequest('target_user');
    await api.rejectFollowRequest('target_user');
    await api.block('target_user');
    await api.unblock('target_user');

    expect(client.post).toHaveBeenNthCalledWith(
      1,
      '/v1/social/profiles/target_user/follow',
      undefined,
      {
        headers: { authorization: 'Bearer access-token' },
        retry: false,
      },
    );
    expect(client.delete).toHaveBeenNthCalledWith(
      1,
      '/v1/social/profiles/target_user/follow',
      {
        headers: { authorization: 'Bearer access-token' },
        retry: false,
      },
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      '/v1/social/follow-requests/target_user/approve',
      undefined,
      expect.objectContaining({ retry: false }),
    );
    expect(client.post).toHaveBeenNthCalledWith(
      3,
      '/v1/social/follow-requests/target_user/reject',
      undefined,
      expect.objectContaining({ retry: false }),
    );
    expect(client.post).toHaveBeenNthCalledWith(
      4,
      '/v1/social/profiles/target_user/block',
      undefined,
      expect.objectContaining({ retry: false }),
    );
    expect(client.delete).toHaveBeenNthCalledWith(
      2,
      '/v1/social/profiles/target_user/block',
      expect.objectContaining({ retry: false }),
    );
  });

  it('refreshes after 401 and retries the exact same request with the new token', async () => {
    const get = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          code: 'unauthorized',
          message: 'expired',
          status: 401,
        }),
      )
      .mockResolvedValueOnce(profileView);
    const client = createClient({ get } as Partial<ApiClient>);
    const auth = createAuth();
    const api = createSocialApi(auth, client);

    await expect(api.getProfile('alice_fit')).resolves.toEqual(profileView);
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenNthCalledWith(1, '/v1/social/profiles/alice_fit', {
      headers: { authorization: 'Bearer access-token' },
    });
    expect(get).toHaveBeenNthCalledWith(2, '/v1/social/profiles/alice_fit', {
      headers: { authorization: 'Bearer refreshed-token' },
    });
  });

  it('fails with stable auth codes when sign-in or refresh is unavailable', async () => {
    const missingTokenApi = createSocialApi(createAuth(null), createClient());
    await expect(missingTokenApi.getOwnProfile()).rejects.toMatchObject({
      name: 'SocialApiAuthError',
      code: 'SOCIAL_AUTH_REQUIRED',
    } satisfies Partial<SocialApiAuthError>);

    const client = createClient({
      get: vi.fn().mockRejectedValue(
        new ApiError({
          code: 'unauthorized',
          message: 'expired',
          status: 401,
        }),
      ),
    } as Partial<ApiClient>);
    const auth = createAuth();
    auth.refreshAccessToken.mockResolvedValue(null);
    const expiredApi = createSocialApi(auth, client);
    await expect(expiredApi.getOwnProfile()).rejects.toMatchObject({
      name: 'SocialApiAuthError',
      code: 'SOCIAL_SESSION_EXPIRED',
    } satisfies Partial<SocialApiAuthError>);
  });
});
