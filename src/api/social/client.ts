import { createApiClient, isApiError, type ApiClient } from '@/api/client';
import { getMobileApiBaseUrl } from '@/api/config';

import {
  SocialApiAuthError,
  type SocialApi,
  type SocialApiAuth,
  type UpsertSocialProfileInput,
} from './contracts';
import {
  parseOwnSocialProfileEnvelope,
  parseSocialProfileView,
  parseSocialRelationshipEnvelope,
} from './parsers';

const defaultApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 15_000,
  defaultRetry: { attempts: 1, delayMs: 350, factor: 2 },
});

const socialProfilePath = (username: string): string =>
  `/v1/social/profiles/${encodeURIComponent(username.trim())}`;

export const createSocialApi = (
  auth: SocialApiAuth,
  apiClient: ApiClient = defaultApiClient,
): SocialApi => {
  const requestWithAuth = async <T>(
    request: (accessToken: string) => Promise<T>,
  ): Promise<T> => {
    const accessToken = await auth.getAccessToken();
    if (!accessToken) throw new SocialApiAuthError('SOCIAL_AUTH_REQUIRED');
    try {
      return await request(accessToken);
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) throw error;
      const refreshedToken = await auth.refreshAccessToken();
      if (!refreshedToken) {
        throw new SocialApiAuthError('SOCIAL_SESSION_EXPIRED');
      }
      return request(refreshedToken);
    }
  };

  const postRelationship = async (path: string) =>
    requestWithAuth(async (accessToken) =>
      parseSocialRelationshipEnvelope(
        await apiClient.post<unknown>(path, undefined, {
          headers: { authorization: `Bearer ${accessToken}` },
          retry: false,
        }),
      ),
    );

  const deleteRelationship = async (path: string) =>
    requestWithAuth(async (accessToken) =>
      parseSocialRelationshipEnvelope(
        await apiClient.delete<unknown>(path, {
          headers: { authorization: `Bearer ${accessToken}` },
          retry: false,
        }),
      ),
    );

  return {
    getOwnProfile: () =>
      requestWithAuth(async (accessToken) =>
        parseOwnSocialProfileEnvelope(
          await apiClient.get<unknown>('/v1/social/profile', {
            headers: { authorization: `Bearer ${accessToken}` },
          }),
        ),
      ),

    upsertOwnProfile: (input: UpsertSocialProfileInput) =>
      requestWithAuth(async (accessToken) =>
        parseOwnSocialProfileEnvelope(
          await apiClient.put<unknown, UpsertSocialProfileInput>(
            '/v1/social/profile',
            input,
            {
              headers: { authorization: `Bearer ${accessToken}` },
              retry: false,
            },
          ),
        ).then((profile) => {
          if (!profile) throw new Error('Invalid social profile response');
          return profile;
        }),
      ),

    getProfile: (username) =>
      requestWithAuth(async (accessToken) =>
        parseSocialProfileView(
          await apiClient.get<unknown>(socialProfilePath(username), {
            headers: { authorization: `Bearer ${accessToken}` },
          }),
        ),
      ),

    follow: (username) =>
      postRelationship(`${socialProfilePath(username)}/follow`),
    unfollow: (username) =>
      deleteRelationship(`${socialProfilePath(username)}/follow`),
    approveFollowRequest: (username) =>
      postRelationship(
        `/v1/social/follow-requests/${encodeURIComponent(username.trim())}/approve`,
      ),
    rejectFollowRequest: (username) =>
      postRelationship(
        `/v1/social/follow-requests/${encodeURIComponent(username.trim())}/reject`,
      ),
    block: (username) =>
      postRelationship(`${socialProfilePath(username)}/block`),
    unblock: (username) =>
      deleteRelationship(`${socialProfilePath(username)}/block`),
  };
};
