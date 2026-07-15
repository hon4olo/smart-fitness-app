import type { ApiClient } from '@/api/client';

import type { AuthProfile, AuthProfileUpdate, TokenManager } from '@/auth/types';

export type RemoteProfileRepository = {
  fetchProfile(accessToken?: string): Promise<AuthProfile | null>;
  updateProfile(patch: AuthProfileUpdate, accessToken?: string): Promise<AuthProfile | null>;
};

const authHeader = (token?: string): Record<string, string> | undefined => (token ? { authorization: `Bearer ${token}` } : undefined);

export const createRemoteProfileRepository = (apiClient: ApiClient, tokenManager: TokenManager): RemoteProfileRepository => ({
  async fetchProfile(accessToken) {
    const token = accessToken ?? (await tokenManager.getAccessToken());
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.get<{ user: AuthProfile }>('/v1/user', {
        headers: authHeader(token),
        retry: false,
      });
      return response.user;
    } catch (error) {
      if (error instanceof Error && error.name === 'ApiError') {
        return null;
      }

      return null;
    }
  },
  async updateProfile(patch, accessToken) {
    const token = accessToken ?? (await tokenManager.getAccessToken());
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.patch<{ user: AuthProfile }, AuthProfileUpdate>('/v1/user', patch, {
        headers: authHeader(token),
        retry: false,
      });
      return response.user;
    } catch {
      return null;
    }
  },
});
