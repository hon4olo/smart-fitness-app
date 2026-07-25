import { createApiClient, isApiError, type ApiClient } from '@/api/client';
import { getMobileApiBaseUrl } from '@/api/config';

import type { CoachDomain, CoachRequestType, CoachRunStatus } from './contracts';

export type CoachRunHistoryItem = {
  id: string;
  domain: CoachDomain;
  requestType: CoachRequestType;
  status: CoachRunStatus;
  policyVersions: Record<string, string>;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export type CoachRunHistoryQuery = {
  limit?: number;
  domain?: CoachDomain;
  status?: CoachRunStatus;
};

type CoachHistoryAuth = {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
};

const defaultApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 20_000,
  defaultRetry: { attempts: 1, delayMs: 350, factor: 2 },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const STATUSES = new Set<CoachRunStatus>(['queued', 'running', 'completed', 'rejected', 'failed']);
const DOMAINS = new Set<CoachDomain>(['strength', 'nutrition', 'safety_recovery', 'combined']);

const parseItem = (value: unknown): CoachRunHistoryItem => {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim()) {
    throw new Error('Invalid Coach history response');
  }
  if (typeof value.domain !== 'string' || !DOMAINS.has(value.domain as CoachDomain)) {
    throw new Error('Invalid Coach history domain');
  }
  if (typeof value.status !== 'string' || !STATUSES.has(value.status as CoachRunStatus)) {
    throw new Error('Invalid Coach history status');
  }
  if (typeof value.requestType !== 'string' || !value.requestType.trim()) {
    throw new Error('Invalid Coach history request type');
  }
  const policyVersions = isRecord(value.policyVersions)
    ? Object.fromEntries(
        Object.entries(value.policyVersions).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
      )
    : {};
  const readDate = (key: string): string => {
    const date = value[key];
    if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) {
      throw new Error(`Invalid Coach history ${key}`);
    }
    return date;
  };
  const readNullableDate = (key: string): string | null => {
    if (value[key] === null) return null;
    return readDate(key);
  };
  return {
    id: value.id,
    domain: value.domain as CoachDomain,
    requestType: value.requestType as CoachRequestType,
    status: value.status as CoachRunStatus,
    policyVersions,
    requestedAt: readDate('requestedAt'),
    startedAt: readNullableDate('startedAt'),
    completedAt: readNullableDate('completedAt'),
    updatedAt: readDate('updatedAt'),
  };
};

export const parseCoachRunHistory = (value: unknown): CoachRunHistoryItem[] => {
  if (!Array.isArray(value)) throw new Error('Invalid Coach history response');
  return value.map(parseItem);
};

const buildQuery = (query: CoachRunHistoryQuery): string => {
  const params = new URLSearchParams();
  params.set('limit', String(Math.min(100, Math.max(1, Math.floor(query.limit ?? 30)))));
  if (query.domain) params.set('domain', query.domain);
  if (query.status) params.set('status', query.status);
  return params.toString();
};

export const createCoachHistoryApi = (
  auth: CoachHistoryAuth,
  apiClient: ApiClient = defaultApiClient,
) => ({
  listRuns: async (query: CoachRunHistoryQuery = {}): Promise<CoachRunHistoryItem[]> => {
    const request = async (accessToken: string) =>
      parseCoachRunHistory(
        await apiClient.get<unknown>(`/v1/coach/runs?${buildQuery(query)}`, {
          headers: { authorization: `Bearer ${accessToken}` },
        }),
      );
    const accessToken = await auth.getAccessToken();
    if (!accessToken) throw new Error('Sign in is required to view Coach history.');
    try {
      return await request(accessToken);
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) throw error;
      const refreshedToken = await auth.refreshAccessToken();
      if (!refreshedToken) throw new Error('Your session expired. Sign in again to continue.');
      return request(refreshedToken);
    }
  },
});
