import type { AppState } from '@/types';

import type { StorageAdapter } from './StorageAdapter';

export const LOCAL_STATE_DIAGNOSTICS_STORAGE_KEY =
  '@smart_fitness_local_state_diagnostics_v1';

export type LocalStateEntityCounts = {
  workouts: number;
  trainingPrograms: number;
  exercises: number;
  workoutSessions: number;
  foodEntries: number;
  mealTemplates: number;
  weightHistory: number;
  bodyMeasurements: number;
  userLimitations: number;
  recoveryCheckIns: number;
};

export type LocalStateDiagnostics = {
  schemaVersion: 1;
  loadCount: number;
  loadFailureCount: number;
  saveCount: number;
  saveFailureCount: number;
  lastSerializedBytes: number;
  maximumSerializedBytes: number;
  lastLoadDurationMs: number;
  maximumLoadDurationMs: number;
  lastSaveDurationMs: number;
  maximumSaveDurationMs: number;
  entityCounts: LocalStateEntityCounts;
  updatedAt: string;
};

export type LocalStateDiagnosticEvent = {
  operation: 'load' | 'save';
  durationMs: number;
  success: boolean;
  serializedState?: string;
  state?: AppState;
};

export type LocalStateDiagnosticsRecorder = {
  record(event: LocalStateDiagnosticEvent): void;
  reset(): void;
  read(): Promise<LocalStateDiagnostics>;
  flush(): Promise<void>;
};

const emptyCounts = (): LocalStateEntityCounts => ({
  workouts: 0,
  trainingPrograms: 0,
  exercises: 0,
  workoutSessions: 0,
  foodEntries: 0,
  mealTemplates: 0,
  weightHistory: 0,
  bodyMeasurements: 0,
  userLimitations: 0,
  recoveryCheckIns: 0,
});

const createEmptyDiagnostics = (now: string): LocalStateDiagnostics => ({
  schemaVersion: 1,
  loadCount: 0,
  loadFailureCount: 0,
  saveCount: 0,
  saveFailureCount: 0,
  lastSerializedBytes: 0,
  maximumSerializedBytes: 0,
  lastLoadDurationMs: 0,
  maximumLoadDurationMs: 0,
  lastSaveDurationMs: 0,
  maximumSaveDurationMs: 0,
  entityCounts: emptyCounts(),
  updatedAt: now,
});

export const countLocalStateEntities = (state: AppState): LocalStateEntityCounts => ({
  workouts: state.workouts.length,
  trainingPrograms: state.trainingPrograms.length,
  exercises: state.exercises.length,
  workoutSessions: state.workoutSessions.length,
  foodEntries: state.foodEntries.length,
  mealTemplates: state.mealTemplates.length,
  weightHistory: state.weightHistory.length,
  bodyMeasurements: state.bodyMeasurements.length,
  userLimitations: state.userLimitations.length,
  recoveryCheckIns: state.recoveryCheckIns.length,
});

export const utf8ByteLength = (value: string): number => {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x7f) bytes += 1;
    else if (codePoint <= 0x7ff) bytes += 2;
    else if (codePoint <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
};

const nonNegativeNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

const parseCounts = (value: unknown): LocalStateEntityCounts => {
  const record =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    workouts: nonNegativeNumber(record.workouts),
    trainingPrograms: nonNegativeNumber(record.trainingPrograms),
    exercises: nonNegativeNumber(record.exercises),
    workoutSessions: nonNegativeNumber(record.workoutSessions),
    foodEntries: nonNegativeNumber(record.foodEntries),
    mealTemplates: nonNegativeNumber(record.mealTemplates),
    weightHistory: nonNegativeNumber(record.weightHistory),
    bodyMeasurements: nonNegativeNumber(record.bodyMeasurements),
    userLimitations: nonNegativeNumber(record.userLimitations),
    recoveryCheckIns: nonNegativeNumber(record.recoveryCheckIns),
  };
};

const parseDiagnostics = (value: string | null, now: string): LocalStateDiagnostics => {
  if (!value) return createEmptyDiagnostics(now);
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (parsed.schemaVersion !== 1) return createEmptyDiagnostics(now);
    return {
      schemaVersion: 1,
      loadCount: nonNegativeNumber(parsed.loadCount),
      loadFailureCount: nonNegativeNumber(parsed.loadFailureCount),
      saveCount: nonNegativeNumber(parsed.saveCount),
      saveFailureCount: nonNegativeNumber(parsed.saveFailureCount),
      lastSerializedBytes: nonNegativeNumber(parsed.lastSerializedBytes),
      maximumSerializedBytes: nonNegativeNumber(parsed.maximumSerializedBytes),
      lastLoadDurationMs: nonNegativeNumber(parsed.lastLoadDurationMs),
      maximumLoadDurationMs: nonNegativeNumber(parsed.maximumLoadDurationMs),
      lastSaveDurationMs: nonNegativeNumber(parsed.lastSaveDurationMs),
      maximumSaveDurationMs: nonNegativeNumber(parsed.maximumSaveDurationMs),
      entityCounts: parseCounts(parsed.entityCounts),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : now,
    };
  } catch {
    return createEmptyDiagnostics(now);
  }
};

export const createLocalStateDiagnosticsRecorder = (
  storage: StorageAdapter,
  options: { now?: () => Date } = {},
): LocalStateDiagnosticsRecorder => {
  const now = options.now ?? (() => new Date());
  let cached: LocalStateDiagnostics | null = null;
  let queue = Promise.resolve();

  const load = async (): Promise<LocalStateDiagnostics> => {
    if (cached) return cached;
    try {
      cached = parseDiagnostics(
        await storage.read(LOCAL_STATE_DIAGNOSTICS_STORAGE_KEY),
        now().toISOString(),
      );
    } catch {
      cached = createEmptyDiagnostics(now().toISOString());
    }
    return cached;
  };

  const enqueue = (mutation: (current: LocalStateDiagnostics) => LocalStateDiagnostics) => {
    queue = queue.then(async () => {
      const next = mutation(await load());
      cached = next;
      try {
        await storage.write(LOCAL_STATE_DIAGNOSTICS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Diagnostics are local and fail-open; app-state persistence remains authoritative.
      }
    });
  };

  return {
    record(event) {
      enqueue((current) => {
        const duration = Math.max(0, event.durationMs);
        const serializedBytes = event.serializedState
          ? utf8ByteLength(event.serializedState)
          : current.lastSerializedBytes;
        const entityCounts = event.state
          ? countLocalStateEntities(event.state)
          : current.entityCounts;
        return {
          ...current,
          loadCount: current.loadCount + (event.operation === 'load' ? 1 : 0),
          loadFailureCount:
            current.loadFailureCount +
            (event.operation === 'load' && !event.success ? 1 : 0),
          saveCount: current.saveCount + (event.operation === 'save' ? 1 : 0),
          saveFailureCount:
            current.saveFailureCount +
            (event.operation === 'save' && !event.success ? 1 : 0),
          lastSerializedBytes: serializedBytes,
          maximumSerializedBytes: Math.max(current.maximumSerializedBytes, serializedBytes),
          lastLoadDurationMs:
            event.operation === 'load' ? duration : current.lastLoadDurationMs,
          maximumLoadDurationMs:
            event.operation === 'load'
              ? Math.max(current.maximumLoadDurationMs, duration)
              : current.maximumLoadDurationMs,
          lastSaveDurationMs:
            event.operation === 'save' ? duration : current.lastSaveDurationMs,
          maximumSaveDurationMs:
            event.operation === 'save'
              ? Math.max(current.maximumSaveDurationMs, duration)
              : current.maximumSaveDurationMs,
          entityCounts,
          updatedAt: now().toISOString(),
        };
      });
    },
    reset() {
      enqueue(() => createEmptyDiagnostics(now().toISOString()));
    },
    async read() {
      await queue;
      return { ...(await load()), entityCounts: { ...(await load()).entityCounts } };
    },
    async flush() {
      await queue;
    },
  };
};
