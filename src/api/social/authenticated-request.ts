import {
  isApiError,
  type ApiClient,
  type HttpMethod,
} from '@/api/client';

import type { SocialApiAuth } from './contracts';

export const requestSocialApiWithAuth = async <TBody = unknown>(
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

export const buildSocialListQuery = (
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

export const requireSocialPathSegment = (
  value: string,
  label: string,
): string => {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required`);
  return encodeURIComponent(trimmed);
};
