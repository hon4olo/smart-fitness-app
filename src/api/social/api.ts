import {
  createApiClient,
  isApiError,
  type ApiClient,
  type HttpMethod,
} from '@/api/client';
import { getMobileApiBaseUrl } from '@/api/config';

import type {
  SocialApiAuth,
  SocialProfileDto,
  SocialProfileViewDto,
  SocialRelationshipDto,
  UpsertOwnSocialProfileInput,
} from './contracts';
import {
  parseOwnSocialProfileResponse,
  parseSocialProfileResponse,
  parseSocialProfileViewResponse,
  parseSocialRelationshipResponse,
} from './parsers';

const defaultApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 12_000,
  defaultRetry: { attempts: 1, delayMs: 300, factor: 2 },
});

const requireUsernamePath = (username: string): string => {
  const trimmed = username.trim();
  if (!trimmed) throw new Error('Social username is required');
  return encodeURIComponent(trimmed);
};

const buildUpsertPayload = (
  input: UpsertOwnSocialProfileInput,
): UpsertOwnSocialProfileInput => {
  const payload: UpsertOwnSocialProfileInput = {
    username: input.username.trim(),
  };

  if (input.displayName !== undefined) {
    payload.displayName = input.displayName.trim();
  }
  if (input.bio !== undefined) {
    payload.bio = input.bio === null ? null : input.bio.trim();
  }
  if (input.avatarUrl !== undefined) {
    payload.avatarUrl = input.avatarUrl === null ? null : input.avatarUrl.trim();
  }
  if (input.visibility !== undefined) {
    payload.visibility = input.visibility;
  }

  return payload;
};

const requestWithAuth = async <TBody = unknown>(
  auth: SocialApiAuth,
  apiClient: ApiClient,
  method: HttpMethod,
  path: string,
  body?: TBody,
): Promise<unknown> => {
  const perform = (accessToken: string) =>
    apiClient.request<unknown, TBody>({
      method,
      path,
      ...(body === undefined ? {} : { body }),
      headers: { authorization: `Bearer ${accessToken}` },
      retry: false,
    });

  const accessToken = await auth.getAccessToken();
  if (!accessToken) throw new Error('Social authentication is required');

  try {
    return await perform(accessToken);
  } catch (error) {
    if (!isApiError(error) || error.status !== 401) throw error;
    const refreshedToken = await auth.refreshAccessToken();
    if (!refreshedToken) throw new Error('Social authentication expired');
    return perform(refreshedToken);
  }
};

export type SocialApi = {
  getOwnProfile(): Promise<SocialProfileDto | null>;
  upsertOwnProfile(input: UpsertOwnSocialProfileInput): Promise<SocialProfileDto>;
  getProfile(username: string): Promise<SocialProfileViewDto>;
  follow(username: string): Promise<SocialRelationshipDto>;
  unfollow(username: string): Promise<SocialRelationshipDto>;
  cancelFollowRequest(username: string): Promise<SocialRelationshipDto>;
  approveFollowRequest(username: string): Promise<SocialRelationshipDto>;
  rejectFollowRequest(username: string): Promise<SocialRelationshipDto>;
  block(username: string): Promise<SocialRelationshipDto>;
  unblock(username: string): Promise<SocialRelationshipDto>;
};

export const createSocialApi = (
  auth: SocialApiAuth,
  apiClient: ApiClient = defaultApiClient,
): SocialApi => {
  const relationRequest = async (
    method: 'POST' | 'DELETE',
    path: string,
  ): Promise<SocialRelationshipDto> =>
    parseSocialRelationshipResponse(
      await requestWithAuth(auth, apiClient, method, path),
    );

  const removeFollow = (username: string): Promise<SocialRelationshipDto> =>
    relationRequest(
      'DELETE',
      `/v1/social/profiles/${requireUsernamePath(username)}/follow`,
    );

  return {
    async getOwnProfile() {
      return parseOwnSocialProfileResponse(
        await requestWithAuth(auth, apiClient, 'GET', '/v1/social/profile'),
      );
    },

    async upsertOwnProfile(input) {
      return parseSocialProfileResponse(
        await requestWithAuth(
          auth,
          apiClient,
          'PUT',
          '/v1/social/profile',
          buildUpsertPayload(input),
        ),
      );
    },

    async getProfile(username) {
      return parseSocialProfileViewResponse(
        await requestWithAuth(
          auth,
          apiClient,
          'GET',
          `/v1/social/profiles/${requireUsernamePath(username)}`,
        ),
      );
    },

    follow(username) {
      return relationRequest(
        'POST',
        `/v1/social/profiles/${requireUsernamePath(username)}/follow`,
      );
    },

    unfollow: removeFollow,
    cancelFollowRequest: removeFollow,

    approveFollowRequest(username) {
      return relationRequest(
        'POST',
        `/v1/social/follow-requests/${requireUsernamePath(username)}/approve`,
      );
    },

    rejectFollowRequest(username) {
      return relationRequest(
        'POST',
        `/v1/social/follow-requests/${requireUsernamePath(username)}/reject`,
      );
    },

    block(username) {
      return relationRequest(
        'POST',
        `/v1/social/profiles/${requireUsernamePath(username)}/block`,
      );
    },

    unblock(username) {
      return relationRequest(
        'DELETE',
        `/v1/social/profiles/${requireUsernamePath(username)}/block`,
      );
    },
  };
};
