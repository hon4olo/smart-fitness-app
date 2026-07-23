import { createApiClient, isApiError, type ApiClient } from '@/api/client';
import { getMobileApiBaseUrl } from '@/api/config';

export type CoachRunStatus = 'queued' | 'running' | 'completed' | 'rejected' | 'failed';
export type CoachDomain = 'strength' | 'nutrition';
export type StrengthCoachRequestType = 'session_review' | 'next_workout_proposal';
export type NutritionCoachRequestType =
  | 'nutrition_review'
  | 'nutrition_target_proposal'
  | 'nutrition_strategy_proposal';
export type CoachRequestType = StrengthCoachRequestType | NutritionCoachRequestType;

export type CoachCapabilities = {
  schemaVersion: 1 | 2;
  nutrition: {
    deterministicReview: true;
    deterministicTargetProposal: true;
    structuredStrategyProposal: boolean;
    structuredStrategyConfirmation?: boolean;
    strategyRequiresConfirmation: true;
  };
};

export type CoachRunError = {
  code: string;
  message: string;
  details?: unknown;
};

export type CoachRunRecord = {
  id: string;
  userId: string;
  domain: CoachDomain;
  requestType: CoachRequestType;
  status: CoachRunStatus;
  idempotencyKey: string | null;
  requestData: Record<string, unknown>;
  contextSnapshot: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: CoachRunError | null;
  policyVersions: Record<string, string>;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoachAgentRunRecord = {
  id: string;
  coachRunId: string;
  userId: string;
  sequence: number;
  agentName: string;
  status: CoachRunStatus;
  policyVersion: string | null;
  inputSnapshot: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: CoachRunError | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoachRunEnvelope = {
  run: CoachRunRecord;
  agentRuns: CoachAgentRunRecord[];
};

export type StartStrengthCoachRunInput = {
  requestType: StrengthCoachRequestType;
  requestedSessionId?: string;
  historyLimit?: number;
  idempotencyKey?: string;
};

export type StartNutritionCoachRunInput = {
  requestType?: NutritionCoachRequestType;
  lookbackDays?: number;
  idempotencyKey?: string;
};

export type ConfirmCoachRunInput = {
  idempotencyKey: string;
};

type CoachApiAuth = {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
};

type WaitForRunOptions = {
  intervalMs?: number;
  maxPolls?: number;
  signal?: AbortSignal;
};

export type CoachApi = {
  getCapabilities(): Promise<CoachCapabilities>;
  startStrengthRun(input: StartStrengthCoachRunInput): Promise<CoachRunEnvelope>;
  startNutritionRun(input?: StartNutritionCoachRunInput): Promise<CoachRunEnvelope>;
  confirmRun(runId: string, input: ConfirmCoachRunInput): Promise<CoachRunEnvelope>;
  getRun(runId: string): Promise<CoachRunEnvelope>;
  waitForTerminalRun(initial: CoachRunEnvelope, options?: WaitForRunOptions): Promise<CoachRunEnvelope>;
};

const defaultApiClient = createApiClient({
  baseUrl: getMobileApiBaseUrl(),
  defaultTimeoutMs: 20_000,
  defaultRetry: { attempts: 1, delayMs: 350, factor: 2 },
});

const TERMINAL_STATUSES = new Set<CoachRunStatus>(['completed', 'rejected', 'failed']);
const RUN_STATUSES = new Set<CoachRunStatus>(['queued', 'running', 'completed', 'rejected', 'failed']);
const STRENGTH_REQUEST_TYPES = new Set<StrengthCoachRequestType>([
  'session_review',
  'next_workout_proposal',
]);
const NUTRITION_REQUEST_TYPES = new Set<NutritionCoachRequestType>([
  'nutrition_review',
  'nutrition_target_proposal',
  'nutrition_strategy_proposal',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid coach response: ${key}`);
  }
  return value;
};

const readNullableString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error(`Invalid coach response: ${key}`);
  }
  return value;
};

const readRecord = (record: Record<string, unknown>, key: string): Record<string, unknown> => {
  const value = record[key];
  if (!isRecord(value)) {
    throw new Error(`Invalid coach response: ${key}`);
  }
  return value;
};

const readNullableRecord = (
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null => {
  const value = record[key];
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    throw new Error(`Invalid coach response: ${key}`);
  }
  return value;
};

const parseError = (value: unknown): CoachRunError | null => {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    throw new Error('Invalid coach response: error');
  }
  const code = readString(value, 'code');
  const message = readString(value, 'message');
  return value.details === undefined ? { code, message } : { code, message, details: value.details };
};

const parseStatus = (value: unknown): CoachRunStatus => {
  if (typeof value !== 'string' || !RUN_STATUSES.has(value as CoachRunStatus)) {
    throw new Error('Invalid coach response: status');
  }
  return value as CoachRunStatus;
};

const parseDomain = (value: unknown): CoachDomain => {
  if (value !== 'strength' && value !== 'nutrition') {
    throw new Error('Invalid coach response: domain');
  }
  return value;
};

const parseRequestType = (domain: CoachDomain, value: unknown): CoachRequestType => {
  if (typeof value !== 'string') {
    throw new Error('Invalid coach response: requestType');
  }
  if (
    domain === 'strength' &&
    STRENGTH_REQUEST_TYPES.has(value as StrengthCoachRequestType)
  ) {
    return value as StrengthCoachRequestType;
  }
  if (
    domain === 'nutrition' &&
    NUTRITION_REQUEST_TYPES.has(value as NutritionCoachRequestType)
  ) {
    return value as NutritionCoachRequestType;
  }
  throw new Error('Invalid coach response: requestType');
};

const parseCoachRun = (value: unknown): CoachRunRecord => {
  if (!isRecord(value)) {
    throw new Error('Invalid coach response: run');
  }
  const domain = parseDomain(value.domain);

  return {
    id: readString(value, 'id'),
    userId: readString(value, 'userId'),
    domain,
    requestType: parseRequestType(domain, value.requestType),
    status: parseStatus(value.status),
    idempotencyKey: readNullableString(value, 'idempotencyKey'),
    requestData: readRecord(value, 'requestData'),
    contextSnapshot: readNullableRecord(value, 'contextSnapshot'),
    result: readNullableRecord(value, 'result'),
    error: parseError(value.error),
    policyVersions: Object.fromEntries(
      Object.entries(readRecord(value, 'policyVersions')).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    ),
    requestedAt: readString(value, 'requestedAt'),
    startedAt: readNullableString(value, 'startedAt'),
    completedAt: readNullableString(value, 'completedAt'),
    createdAt: readString(value, 'createdAt'),
    updatedAt: readString(value, 'updatedAt'),
  };
};

const parseAgentRun = (value: unknown): CoachAgentRunRecord => {
  if (!isRecord(value) || typeof value.sequence !== 'number' || !Number.isInteger(value.sequence)) {
    throw new Error('Invalid coach response: agent run');
  }

  return {
    id: readString(value, 'id'),
    coachRunId: readString(value, 'coachRunId'),
    userId: readString(value, 'userId'),
    sequence: value.sequence,
    agentName: readString(value, 'agentName'),
    status: parseStatus(value.status),
    policyVersion: readNullableString(value, 'policyVersion'),
    inputSnapshot: readRecord(value, 'inputSnapshot'),
    output: readNullableRecord(value, 'output'),
    error: parseError(value.error),
    startedAt: readNullableString(value, 'startedAt'),
    completedAt: readNullableString(value, 'completedAt'),
    createdAt: readString(value, 'createdAt'),
    updatedAt: readString(value, 'updatedAt'),
  };
};

export const parseCoachCapabilities = (value: unknown): CoachCapabilities => {
  if (
    !isRecord(value) ||
    (value.schemaVersion !== 1 && value.schemaVersion !== 2) ||
    !isRecord(value.nutrition)
  ) {
    throw new Error('Invalid coach capabilities response');
  }

  const nutrition = value.nutrition;
  if (
    nutrition.deterministicReview !== true ||
    nutrition.deterministicTargetProposal !== true ||
    typeof nutrition.structuredStrategyProposal !== 'boolean' ||
    nutrition.strategyRequiresConfirmation !== true ||
    (value.schemaVersion === 2 &&
      typeof nutrition.structuredStrategyConfirmation !== 'boolean')
  ) {
    throw new Error('Invalid coach capabilities response');
  }

  return {
    schemaVersion: value.schemaVersion,
    nutrition: {
      deterministicReview: true,
      deterministicTargetProposal: true,
      structuredStrategyProposal: nutrition.structuredStrategyProposal,
      ...(value.schemaVersion === 2
        ? {
            structuredStrategyConfirmation:
              nutrition.structuredStrategyConfirmation as boolean,
          }
        : {}),
      strategyRequiresConfirmation: true,
    },
  };
};

export const parseCoachRunEnvelope = (value: unknown): CoachRunEnvelope => {
  if (!isRecord(value) || !Array.isArray(value.agentRuns)) {
    throw new Error('Invalid coach response envelope');
  }

  const run = parseCoachRun(value.run);
  const agentRuns = value.agentRuns.map(parseAgentRun).sort((left, right) => left.sequence - right.sequence);
  if (agentRuns.some((agentRun) => agentRun.coachRunId !== run.id || agentRun.userId !== run.userId)) {
    throw new Error('Invalid coach response ownership');
  }

  return { run, agentRuns };
};

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
  const requestWithAuth = async <T>(request: (accessToken: string) => Promise<T>): Promise<T> => {
    const accessToken = await auth.getAccessToken();
    if (!accessToken) {
      throw new Error('Sign in is required to use Coach.');
    }

    try {
      return await request(accessToken);
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) {
        throw error;
      }

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
        await apiClient.get<unknown>(`/v1/coach/runs/${encodeURIComponent(runId)}`, {
          headers: { authorization: `Bearer ${accessToken}` },
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
    startStrengthRun: async (input) =>
      requestWithAuth(async (accessToken) =>
        parseCoachRunEnvelope(
          await apiClient.post<unknown, StartStrengthCoachRunInput>('/v1/coach/strength/runs', input, {
            headers: { authorization: `Bearer ${accessToken}` },
            retry: false,
          }),
        ),
      ),
    startNutritionRun: async (input = {}) => {
      const body: StartNutritionCoachRunInput = {
        requestType: 'nutrition_review',
        ...input,
      };
      return requestWithAuth(async (accessToken) =>
        parseCoachRunEnvelope(
          await apiClient.post<unknown, StartNutritionCoachRunInput>('/v1/coach/nutrition/runs', body, {
            headers: { authorization: `Bearer ${accessToken}` },
            retry: false,
          }),
        ),
      );
    },
    confirmRun: async (runId, input) =>
      requestWithAuth(async (accessToken) =>
        parseCoachRunEnvelope(
          await apiClient.post<unknown, ConfirmCoachRunInput>(
            `/v1/coach/runs/${encodeURIComponent(runId)}/confirm`,
            input,
            {
              headers: { authorization: `Bearer ${accessToken}` },
              retry: false,
            },
          ),
        ),
      ),
    getRun,
    waitForTerminalRun: async (initial, options = {}) => {
      let current = initial;
      const intervalMs = Math.max(100, options.intervalMs ?? 750);
      const maxPolls = Math.max(1, Math.floor(options.maxPolls ?? 20));

      for (let poll = 0; poll < maxPolls; poll += 1) {
        if (TERMINAL_STATUSES.has(current.run.status)) {
          return current;
        }
        await sleep(intervalMs, options.signal);
        current = await getRun(current.run.id);
      }

      throw new Error('Coach is taking longer than expected. Try opening the run again shortly.');
    },
  };
};
