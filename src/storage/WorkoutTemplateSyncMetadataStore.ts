import type { StorageAdapter } from './StorageAdapter';

export const WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_workout_template_sync_metadata';

export type WorkoutTemplateSyncSnapshot = {
  title: string;
  description: string | null;
  duration: string;
  exercises: Array<{
    id: string;
    name: string;
    muscleGroup: string | null;
    isCustom: boolean;
    createdAt: string;
  }>;
  isCustom: true;
};

export type WorkoutTemplateSyncMetadata = {
  id: string;
  userId: string;
  revision: number;
  deviceId: string;
  createdAt: string;
  syncedAt: string;
  snapshot: WorkoutTemplateSyncSnapshot;
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

const readSnapshot = (value: unknown): WorkoutTemplateSyncSnapshot | null => {
  if (
    !isRecord(value) ||
    typeof value.title !== 'string' ||
    !value.title.trim() ||
    (value.description !== null && typeof value.description !== 'string') ||
    typeof value.duration !== 'string' ||
    !value.duration.trim() ||
    value.isCustom !== true ||
    !Array.isArray(value.exercises) ||
    value.exercises.length === 0
  ) {
    return null;
  }

  const exercises: WorkoutTemplateSyncSnapshot['exercises'] = [];
  for (const exercise of value.exercises) {
    if (
      !isRecord(exercise) ||
      typeof exercise.id !== 'string' ||
      !exercise.id.trim() ||
      typeof exercise.name !== 'string' ||
      !exercise.name.trim() ||
      (exercise.muscleGroup !== null && typeof exercise.muscleGroup !== 'string') ||
      typeof exercise.isCustom !== 'boolean' ||
      typeof exercise.createdAt !== 'string' ||
      !exercise.createdAt.trim()
    ) {
      return null;
    }
    exercises.push({
      id: exercise.id.trim(),
      name: exercise.name.trim(),
      muscleGroup:
        typeof exercise.muscleGroup === 'string'
          ? exercise.muscleGroup.trim()
          : null,
      isCustom: exercise.isCustom,
      createdAt: exercise.createdAt.trim(),
    });
  }

  return {
    title: value.title.trim(),
    description:
      typeof value.description === 'string' ? value.description.trim() : null,
    duration: value.duration.trim(),
    exercises,
    isCustom: true,
  };
};

const normalize = (value: unknown): WorkoutTemplateSyncMetadata | null => {
  const snapshot = isRecord(value) ? readSnapshot(value.snapshot) : null;
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.userId !== 'string' ||
    !value.userId.trim() ||
    typeof value.revision !== 'number' ||
    !Number.isFinite(value.revision) ||
    typeof value.deviceId !== 'string' ||
    !value.deviceId.trim() ||
    typeof value.createdAt !== 'string' ||
    !value.createdAt.trim() ||
    typeof value.syncedAt !== 'string' ||
    !value.syncedAt.trim() ||
    !snapshot
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    userId: value.userId.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    createdAt: value.createdAt.trim(),
    syncedAt: value.syncedAt.trim(),
    snapshot,
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
    return new Map(records.map((record) => [`${record.userId}:${record.id}`, record]));
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
      const records = await parse(storage);
      return [...records.values()].find((record) => record.id === id) ?? null;
    },
    async set(record) {
      const records = await parse(storage);
      records.set(`${record.userId}:${record.id}`, record);
      return persist(records);
    },
    async clear() {
      await storage.remove(WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
