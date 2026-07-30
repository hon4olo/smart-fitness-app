import type { ApiErrorCode } from './errors';
import type { ApiDiagnosticCategory, ApiRequestOutcome } from './types';
import type { StorageAdapter } from '@/storage/StorageAdapter';

export const LOCAL_API_DIAGNOSTICS_STORAGE_KEY =
  '@smart_fitness_api_diagnostics_v1';

const CATEGORIES: ApiDiagnosticCategory[] = [
  'auth',
  'auth_refresh',
  'sync',
  'coach',
  'food',
  'profile',
  'other',
];

const FAILURE_CODES: ApiErrorCode[] = [
  'network_error',
  'timeout',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'validation_error',
  'rate_limited',
  'unavailable',
  'parse_error',
  'unknown',
];

export type ApiCategoryDiagnostics = {
  requests: number;
  failures: number;
};

export type LocalApiDiagnostics = {
  schemaVersion: 1;
  totalRequests: number;
  totalFailures: number;
  authRefreshFailures: number;
  byCategory: Record<ApiDiagnosticCategory, ApiCategoryDiagnostics>;
  byFailureCode: Record<ApiErrorCode, number>;
  lastCategory: ApiDiagnosticCategory | null;
  lastOutcome: ApiRequestOutcome['outcome'] | null;
  lastDurationMs: number;
  maximumDurationMs: number;
  lastAttempts: number;
  maximumAttempts: number;
  updatedAt: string;
};

export type LocalApiDiagnosticsRecorder = {
  record(outcome: ApiRequestOutcome): void;
  read(): Promise<LocalApiDiagnostics>;
  reset(): void;
  flush(): Promise<void>;
};

const emptyCategories = (): Record<ApiDiagnosticCategory, ApiCategoryDiagnostics> =>
  Object.fromEntries(
    CATEGORIES.map((category) => [category, { requests: 0, failures: 0 }]),
  ) as Record<ApiDiagnosticCategory, ApiCategoryDiagnostics>;

const emptyFailureCodes = (): Record<ApiErrorCode, number> =>
  Object.fromEntries(FAILURE_CODES.map((code) => [code, 0])) as Record<ApiErrorCode, number>;

const createEmpty = (updatedAt: string): LocalApiDiagnostics => ({
  schemaVersion: 1,
  totalRequests: 0,
  totalFailures: 0,
  authRefreshFailures: 0,
  byCategory: emptyCategories(),
  byFailureCode: emptyFailureCodes(),
  lastCategory: null,
  lastOutcome: null,
  lastDurationMs: 0,
  maximumDurationMs: 0,
  lastAttempts: 0,
  maximumAttempts: 0,
  updatedAt,
});

const nonNegative = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

const parse = (raw: string | null, updatedAt: string): LocalApiDiagnostics => {
  if (!raw) return createEmpty(updatedAt);
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.schemaVersion !== 1) return createEmpty(updatedAt);
    const parsed = createEmpty(updatedAt);
    const categorySource =
      typeof value.byCategory === 'object' && value.byCategory !== null
        ? (value.byCategory as Record<string, unknown>)
        : {};
    const failureSource =
      typeof value.byFailureCode === 'object' && value.byFailureCode !== null
        ? (value.byFailureCode as Record<string, unknown>)
        : {};
    for (const category of CATEGORIES) {
      const entry =
        typeof categorySource[category] === 'object' && categorySource[category] !== null
          ? (categorySource[category] as Record<string, unknown>)
          : {};
      parsed.byCategory[category] = {
        requests: nonNegative(entry.requests),
        failures: nonNegative(entry.failures),
      };
    }
    for (const code of FAILURE_CODES) {
      parsed.byFailureCode[code] = nonNegative(failureSource[code]);
    }
    parsed.totalRequests = nonNegative(value.totalRequests);
    parsed.totalFailures = nonNegative(value.totalFailures);
    parsed.authRefreshFailures = nonNegative(value.authRefreshFailures);
    parsed.lastCategory = CATEGORIES.includes(value.lastCategory as ApiDiagnosticCategory)
      ? (value.lastCategory as ApiDiagnosticCategory)
      : null;
    parsed.lastOutcome =
      value.lastOutcome === 'success' || FAILURE_CODES.includes(value.lastOutcome as ApiErrorCode)
        ? (value.lastOutcome as ApiRequestOutcome['outcome'])
        : null;
    parsed.lastDurationMs = nonNegative(value.lastDurationMs);
    parsed.maximumDurationMs = nonNegative(value.maximumDurationMs);
    parsed.lastAttempts = nonNegative(value.lastAttempts);
    parsed.maximumAttempts = nonNegative(value.maximumAttempts);
    parsed.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : updatedAt;
    return parsed;
  } catch {
    return createEmpty(updatedAt);
  }
};

const clone = (value: LocalApiDiagnostics): LocalApiDiagnostics => ({
  ...value,
  byCategory: Object.fromEntries(
    CATEGORIES.map((category) => [category, { ...value.byCategory[category] }]),
  ) as LocalApiDiagnostics['byCategory'],
  byFailureCode: { ...value.byFailureCode },
});

export const createLocalApiDiagnosticsRecorder = (
  storage: StorageAdapter,
  options: { now?: () => Date } = {},
): LocalApiDiagnosticsRecorder => {
  const now = options.now ?? (() => new Date());
  let cached: LocalApiDiagnostics | null = null;
  let queue = Promise.resolve();

  const load = async () => {
    if (cached) return cached;
    try {
      cached = parse(
        await storage.read(LOCAL_API_DIAGNOSTICS_STORAGE_KEY),
        now().toISOString(),
      );
    } catch {
      cached = createEmpty(now().toISOString());
    }
    return cached;
  };

  const enqueue = (mutation: (current: LocalApiDiagnostics) => LocalApiDiagnostics) => {
    queue = queue.then(async () => {
      const next = mutation(await load());
      cached = next;
      try {
        await storage.write(LOCAL_API_DIAGNOSTICS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Local diagnostics are fail-open and never change API behavior.
      }
    });
  };

  return {
    record(outcome) {
      enqueue((current) => {
        const next = clone(current);
        const failed = outcome.outcome !== 'success';
        next.totalRequests += 1;
        next.totalFailures += failed ? 1 : 0;
        next.authRefreshFailures +=
          failed && outcome.category === 'auth_refresh' ? 1 : 0;
        next.byCategory[outcome.category].requests += 1;
        next.byCategory[outcome.category].failures += failed ? 1 : 0;
        if (failed) next.byFailureCode[outcome.outcome as ApiErrorCode] += 1;
        next.lastCategory = outcome.category;
        next.lastOutcome = outcome.outcome;
        next.lastDurationMs = Math.max(0, outcome.durationMs);
        next.maximumDurationMs = Math.max(
          next.maximumDurationMs,
          next.lastDurationMs,
        );
        next.lastAttempts = Math.max(1, Math.floor(outcome.attempts));
        next.maximumAttempts = Math.max(next.maximumAttempts, next.lastAttempts);
        next.updatedAt = now().toISOString();
        return next;
      });
    },
    async read() {
      await queue;
      return clone(await load());
    },
    reset() {
      enqueue(() => createEmpty(now().toISOString()));
    },
    async flush() {
      await queue;
    },
  };
};
