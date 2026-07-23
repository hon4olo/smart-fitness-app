import type { StorageAdapter } from './StorageAdapter';

export const WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_workout_template_sync_metadata';

export type WorkoutTemplateSyncMetadata = {
  id: string;
  revision: number;
  deviceId: string;
  createdAt: string;
  syncedAt: string;
  deletedAt?: string | null;
};

export type WorkoutTemplateSyncMetadataStore = {
  load(): Promise<Map<string, WorkoutTemplateSyncMetadata>>;
  get(id: string): Promise<WorkoutTemplateSyncMetadata | null>;
  set(record: WorkoutTemplateSyncMetadata): Promise<Map<string, WorkoutTemplateSyncMetadata>>;
  clear(): Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalize = (value: unknown): WorkoutTemplateSyncMetadata | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.revision !== 'number' ||
    !Number.isFinite(value.revision) ||
    typeof value.deviceId !== 'string' ||
    !value.deviceId.trim() ||
    typeof value.createdAt !== 'string' ||
    !value.createdAt.trim() ||
    typeof value.syncedAt !== 'string' ||
    !value.syncedAt.trim()
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    createdAt: value.createdAt.trim(),
    syncedAt: value.syncedAt.trim(),
    ...(typeof value.deletedAt === 'string'
      ? { deletedAt: value.deletedAt.trim() }
      : value.deletedAt === null
        ? { deletedAt: null }
        : {}),
  };
};

const parse = async (
  storage: StorageAdapter,
): Promise<Map<string, WorkoutTemplateSyncMetadata>> => {
  const raw = await storage.read(WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY);
  if (!raw) return new Map();
  try {
    const parsed = JSON.parse(raw) as unknown;
    const values = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.records)
        ? parsed.records
        : [];
    const records = values
      .map(normalize)
      .filter((record): record is WorkoutTemplateSyncMetadata => Boolean(record));
    return new Map(records.map((record) => [record.id, record]));
  } catch {
    return new Map();
  }
};

export const createWorkoutTemplateSyncMetadataStore = (
  storage: StorageAdapter,
): WorkoutTemplateSyncMetadataStore => {
  const persist = async (
    records: Map<string, WorkoutTemplateSyncMetadata>,
  ): Promise<Map<string, WorkoutTemplateSyncMetadata>> => {
    await storage.write(
      WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
        records: [...records.values()],
      }),
    );
    return records;
  };

  return {
    load: () => parse(storage),
    async get(id) {
      return (await parse(storage)).get(id) ?? null;
    },
    async set(record) {
      const records = await parse(storage);
      records.set(record.id, record);
      return persist(records);
    },
    async clear() {
      await storage.remove(WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
