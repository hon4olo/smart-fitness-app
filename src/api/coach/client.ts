import { createApiClient, isApiError, type ApiClient } from '@/api/client';
import { getMobileApiBaseUrl } from '@/api/config';

import type {
  CoachApi,
  CoachRunEnvelope,
  CoachRunStatus,
  StartCombinedCoachRunInput,
  StartNutritionCoachRunInput,
  StartSafetyRecoveryRunInput,
} from './contracts';
import { parseCoachCapabilities, parseCoachRunEnvelope } from './parsers';

type CoachApiAuth = {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
};

const defaultApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 20_000,
  defaultRetry: { attempts: 1, delayMs: 350, factor: 2 },
});

const TERMINAL_STATUSES = new Set<CoachRunStatus>([
  'completed',
  'rejected',
  'failed',
]);

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Coach request aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Coach request aborted', 'AbortError'));
      },
      { once: true },
    );
  });

export const createCoachApi = (
  auth: CoachApiAuth,
  apiClient: ApiClient = defaultApiClient,
): CoachApi => {
  const requestWithAuth = async <T>(
    request: (accessToken: string) => Promise<T>,
  ): Promise<T> => {
    const accessToken = await auth.getAccessToken();
    if (!accessToken) throw new Error('Sign in is required to use Coach.');
    try {
      return await request(accessToken);
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) throw error;
      const refreshedToken = await auth.refreshAccessToken();
      if (!refreshedToken) {
        throw new Error('Your session expired. Sign in again to continue.');
      }
      return request(refreshedToken);
    }
  };

  const getRun = async (runId: string): Promise<CoachRunEnvelope> =>
    requestWithAuth(async (accessToken) =>
      parseCoachRunEnvelope(
        await apiClient.get<unknown>(
          `/v1/coach/runs/${encodeURIComponent(runId)}`,
          { headers: { authorization: `Bearer ${accessToken}` } },
        ),
      ),
    );

  const postRun = async <Input>(
    path: string,
    input: Input,
  ): Promise<CoachRunEnvelope> =>
    requestWithAuth(async (accessToken) =>
      parseCoachRunEnvelope(
        await apiClient.post<unknown, Input>(path, input, {
          headers: { authorization: `Bearer ${accessToken}` },
          retry: false,
        }),
      ),
    );

  return {
    getCapabilities: async () =>
      requestWithAuth(async (accessToken) =>
        parseCoachCapabilities(
          await apiClient.get<unknown>('/v1/coach/capabilities', {
            headers: { authorization: `Bearer ${accessToken}` },
          }),
        ),
      ),
    startStrengthRun: (input) =>
      postRun('/v1/coach/strength/runs', input),
    startNutritionRun: (input = {}) =>
      postRun('/v1/coach/nutrition/runs', {
        requestType: 'nutrition_review',
        ...input,
      } satisfies StartNutritionCoachRunInput),
    startSafetyRecoveryRun: (input = {}) =>
      postRun('/v1/coach/safety/runs', {
        requestType: 'safety_recovery_review',
        ...input,
      } satisfies StartSafetyRecoveryRunInput),
    startCombinedRun: (input = {}) =>
      postRun('/v1/coach/combined/runs', {
        requestType: 'combined_review',
        ...input,
      } satisfies StartCombinedCoachRunInput),
    confirmRun: (runId, input) =>
      postRun(`/v1/coach/runs/${encodeURIComponent(runId)}/confirm`, input),
    confirmCombinedEffectiveStrength: (runId, input) =>
      postRun(
        `/v1/coach/runs/${encodeURIComponent(runId)}/confirm-effective-strength`,
        input,
      ),
    getRun,
    waitForTerminalRun: async (initial, options = {}) => {
      let current = initial;
      const intervalMs = Math.max(100, options.intervalMs ?? 750);
      const maxPolls = Math.max(1, Math.floor(options.maxPolls ?? 20));
      for (let poll = 0; poll < maxPolls; poll += 1) {
        if (TERMINAL_STATUSES.has(current.run.status)) return current;
        await sleep(intervalMs, options.signal);
        current = await getRun(current.run.id);
      }
      throw new Error(
        'Coach is taking longer than expected. Try opening the run again shortly.',
      );
    },
  };
};
