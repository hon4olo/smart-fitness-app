import type { StorageAdapter } from './StorageAdapter';

export const WORKOUT_SESSION_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_workout_session_sync_metadata';

type StoredWorkoutSessionSyncMetadataEnvelope = {
  version?: unknown;
  records?: unknown;
  updatedAt?: unknown;
};

export type WorkoutSessionSyncMetadata = {
  id: string;
  revision: number;
  deviceId: string;
  startedAt: string;
  syncedAt: string;
  deletedAt?: string | null;
};

export type WorkoutSessionSyncMetadataStore = {
  load(): Promise<Map<string, WorkoutSessionSyncMetadata>>;
  get(id: string): Promise<WorkoutSessionSyncMetadata | null>;
  set(record: WorkoutSessionSyncMetadata): Promise<Map<string, WorkoutSessionSyncMetadata>>;
  remove(id: string): Promise<Map<string, WorkoutSessionSyncMetadata>>;
  clear(): Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeMetadata = (value: unknown): WorkoutSessionSyncMetadata | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.revision !== 'number' ||
    !Number.isFinite(value.revision) ||
    typeof value.deviceId !== 'string' ||
    !value.deviceId.trim() ||
    typeof value.startedAt !== 'string' ||
    !value.startedAt.trim() ||
    typeof value.syncedAt !== 'string' ||
    !value.syncedAt.trim()
  ) {
    return null;
  }

  const record: WorkoutSessionSyncMetadata = {
    id: value.id.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    startedAt: value.startedAt.trim(),
    syncedAt: value.syncedAt.trim(),
  };

  if (typeof value.deletedAt === 'string') {
    record.deletedAt = value.deletedAt.trim();
  } else if (value.deletedAt === null) {
    record.deletedAt = null;
  }

  return record;
};

const serialize = (records: WorkoutSessionSyncMetadata[]): string =>
  JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    records,
  });

const parse = async (
  storage: StorageAdapter,
): Promise<Map<string, WorkoutSessionSyncMetadata>> => {
  const raw = await storage.read(WORKOUT_SESSION_SYNC_METADATA_STORAGE_KEY);
  if (!raw) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const rawRecords: unknown[] = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) &&
          Array.isArray((parsed as StoredWorkoutSessionSyncMetadataEnvelope).records)
        ? ((parsed as StoredWorkoutSessionSyncMetadataEnvelope).records as unknown[])
        : [];

    const records = rawRecords
      .map(normalizeMetadata)
      .filter((record): record is WorkoutSessionSyncMetadata => Boolean(record));

    return new Map(records.map((record) => [record.id, record]));
  } catch {
    return new Map();
  }
};

export const createWorkoutSessionSyncMetadataStore = (
  storage: StorageAdapter,
): WorkoutSessionSyncMetadataStore => {
  const persist = async (
    records: Map<string, WorkoutSessionSyncMetadata>,
  ): Promise<Map<string, WorkoutSessionSyncMetadata>> => {
    await storage.write(
      WORKOUT_SESSION_SYNC_METADATA_STORAGE_KEY,
      serialize([...records.values()]),
    );
    return records;
  };

  return {
    async load() {
      return parse(storage);
    },
    async get(id) {
      return (await parse(storage)).get(id) ?? null;
    },
    async set(record) {
      const records = await parse(storage);
      records.set(record.id, record);
      return persist(records);
    },
    async remove(id) {
      const records = await parse(storage);
      records.delete(id);
      return persist(records);
    },
    async clear() {
      await storage.remove(WORKOUT_SESSION_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
