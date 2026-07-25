import { createApiClient, isApiError } from '@/api/client';
import { getMobileApiBaseUrl } from '@/api';

import type { AuthSessionSummary } from './types';

type SessionListEnvelope = {
  sessions: AuthSessionSummary[];
};

type RevokeOthersEnvelope = {
  success: true;
  revokedCount: number;
};

const authHeader = (accessToken: string) => ({
  authorization: `Bearer ${accessToken}`,
});

const client = createApiClient({ baseUrl: getMobileApiBaseUrl() });

export const listAuthSessions = async (
  accessToken: string,
): Promise<AuthSessionSummary[]> => {
  const response = await client.request<SessionListEnvelope>({
    method: 'GET',
    path: '/v1/auth/sessions',
    headers: authHeader(accessToken),
    retry: false,
  });
  return response.sessions;
};

export const revokeAuthSession = async (
  accessToken: string,
  sessionId: string,
): Promise<void> => {
  await client.request<{ success: true }>({
    method: 'DELETE',
    path: `/v1/auth/sessions/${encodeURIComponent(sessionId)}`,
    headers: authHeader(accessToken),
    retry: false,
  });
};

export const revokeOtherAuthSessions = async (
  accessToken: string,
): Promise<number> => {
  const response = await client.post<RevokeOthersEnvelope, undefined>(
    '/v1/auth/sessions/revoke-others',
    undefined,
    { headers: authHeader(accessToken), retry: false },
  );
  return response.revokedCount;
};

export const getSafeSessionManagementError = (error: unknown): string => {
  if (!isApiError(error)) {
    return 'Unable to update your signed-in devices right now.';
  }
  if (error.code === 'network_error' || error.code === 'timeout') {
    return 'Connect to the internet and try again.';
  }
  if (error.status === 401) {
    return 'Your session expired. Sign in again.';
  }
  if (error.status === 429) {
    return 'Too many requests. Wait a moment and try again.';
  }
  return 'Unable to update your signed-in devices right now.';
};
