import {
  createApiClient,
  isApiError,
  type ApiClient,
  type HttpMethod,
} from '@/api/client';
import { getMobileApiBaseUrl } from '@/api/config';

import type {
  ListSocialProfilesInput,
  SocialApiAuth,
  SocialProfileDto,
  SocialProfileListPageDto,
  SocialProfileViewDto,
  SocialRelationshipDto,
  UpsertOwnSocialProfileInput,
} from './contracts';
import {
  parseOwnSocialProfileResponse,
  parseSocialProfileListPageResponse,
  parseSocialProfileResponse,
  parseSocialProfileViewResponse,
  parseSocialRelationshipResponse,
} from './parsers';
import type {
  CreateSocialWorkoutPostInput,
  ListSocialWorkoutPostsInput,
  SocialWorkoutPostDto,
  SocialWorkoutPostPageDto,
} from './workout-post-contracts';
import {
  parseDeleteSocialWorkoutPostResponse,
  parseSocialWorkoutPostPageResponse,
  parseSocialWorkoutPostResponse,
} from './workout-post-parsers';

const defaultApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 12_000,
  defaultRetry: { attempts: 1, delayMs: 300, factor: 2 },
});

const requirePathSegment = (value: string, label: string): string => {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required`);
  return encodeURIComponent(trimmed);
};

const requireUsernamePath = (username: string): string =>
  requirePathSegment(username, 'Social username');

const requirePostIdPath = (postId: string): string =>
  requirePathSegment(postId, 'Social workout post ID');

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

const buildWorkoutPostPayload = (
  input: CreateSocialWorkoutPostInput,
): CreateSocialWorkoutPostInput => ({
  sourceWorkoutSessionId: input.sourceWorkoutSessionId.trim(),
  idempotencyKey: input.idempotencyKey.trim(),
  share: { ...input.share },
  ...(input.caption !== undefined
    ? { caption: input.caption === null ? null : input.caption.trim() }
    : {}),
});

const buildListQuery = (
  input: { limit?: number; cursor?: string },
  label: string,
): string => {
  const query: string[] = [];
  if (input.limit !== undefined) {
    if (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 50) {
      throw new Error(`${label} limit must be between 1 and 50`);
    }
    query.push(`limit=${input.limit}`);
  }
  if (input.cursor !== undefined) {
    const cursor = input.cursor.trim();
    if (!cursor) throw new Error(`${label} cursor must not be empty`);
    query.push(`cursor=${encodeURIComponent(cursor)}`);
  }
  return query.length > 0 ? `?${query.join('&')}` : '';
};

const buildSocialProfileListPath = (
  path: string,
  input: ListSocialProfilesInput = {},
): string => `${path}${buildListQuery(input, 'Social profile list')}`;

const buildWorkoutPostListPath = (
  username: string,
  input: ListSocialWorkoutPostsInput = {},
): string =>
  `/v1/social/profiles/${requireUsernamePath(username)}/workout-posts${buildListQuery(
    input,
    'Social workout post',
  )}`;

const buildFollowingFeedPath = (
  input: ListSocialWorkoutPostsInput = {},
): string => `/v1/social/feed${buildListQuery(input, 'Social feed')}`;

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
  listFollowers(input?: ListSocialProfilesInput): Promise<SocialProfileListPageDto>;
  listFollowing(input?: ListSocialProfilesInput): Promise<SocialProfileListPageDto>;
  listIncomingFollowRequests(
    input?: ListSocialProfilesInput,
  ): Promise<SocialProfileListPageDto>;
  listOutgoingFollowRequests(
    input?: ListSocialProfilesInput,
  ): Promise<SocialProfileListPageDto>;
  follow(username: string): Promise<SocialRelationshipDto>;
  unfollow(username: string): Promise<SocialRelationshipDto>;
  cancelFollowRequest(username: string): Promise<SocialRelationshipDto>;
  approveFollowRequest(username: string): Promise<SocialRelationshipDto>;
  rejectFollowRequest(username: string): Promise<SocialRelationshipDto>;
  block(username: string): Promise<SocialRelationshipDto>;
  unblock(username: string): Promise<SocialRelationshipDto>;
  createWorkoutPost(input: CreateSocialWorkoutPostInput): Promise<SocialWorkoutPostDto>;
  getWorkoutPost(postId: string): Promise<SocialWorkoutPostDto>;
  listWorkoutPosts(
    username: string,
    input?: ListSocialWorkoutPostsInput,
  ): Promise<SocialWorkoutPostPageDto>;
  listFollowingFeed(
    input?: ListSocialWorkoutPostsInput,
  ): Promise<SocialWorkoutPostPageDto>;
  deleteWorkoutPost(postId: string): Promise<void>;
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

  const listProfiles = async (
    path: string,
    input: ListSocialProfilesInput = {},
  ): Promise<SocialProfileListPageDto> =>
    parseSocialProfileListPageResponse(
      await requestWithAuth(
        auth,
        apiClient,
        'GET',
        buildSocialProfileListPath(path, input),
      ),
    );

  const listWorkoutPostPage = async (
    path: string,
  ): Promise<SocialWorkoutPostPageDto> =>
    parseSocialWorkoutPostPageResponse(
      await requestWithAuth(auth, apiClient, 'GET', path),
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

    listFollowers(input = {}) {
      return listProfiles('/v1/social/followers', input);
    },

    listFollowing(input = {}) {
      return listProfiles('/v1/social/following', input);
    },

    listIncomingFollowRequests(input = {}) {
      return listProfiles('/v1/social/follow-requests/incoming', input);
    },

    listOutgoingFollowRequests(input = {}) {
      return listProfiles('/v1/social/follow-requests/outgoing', input);
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

    async createWorkoutPost(input) {
      return parseSocialWorkoutPostResponse(
        await requestWithAuth(
          auth,
          apiClient,
          'POST',
          '/v1/social/workout-posts',
          buildWorkoutPostPayload(input),
        ),
      );
    },

    async getWorkoutPost(postId) {
      return parseSocialWorkoutPostResponse(
        await requestWithAuth(
          auth,
          apiClient,
          'GET',
          `/v1/social/workout-posts/${requirePostIdPath(postId)}`,
        ),
      );
    },

    async listWorkoutPosts(username, input = {}) {
      return listWorkoutPostPage(buildWorkoutPostListPath(username, input));
    },

    async listFollowingFeed(input = {}) {
      return listWorkoutPostPage(buildFollowingFeedPath(input));
    },

    async deleteWorkoutPost(postId) {
      parseDeleteSocialWorkoutPostResponse(
        await requestWithAuth(
          auth,
          apiClient,
          'DELETE',
          `/v1/social/workout-posts/${requirePostIdPath(postId)}`,
        ),
      );
    },
  };
};
