import type { StorageAdapter } from './StorageAdapter';

export const WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_workout_template_sync_metadata';

export type WorkoutTemplatePrescriptionSetSnapshot = {
  sourceSetId: string | null;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  targetRpe: number;
  adjustment: 'decrease' | 'maintain' | 'increase' | null;
  rationaleCode: string | null;
};

export type WorkoutTemplateCoachMetadataSnapshot = {
  schemaVersion: 1;
  runId: string;
  sourceSessionId: string;
  strategy: 'deload' | 'maintain' | 'progress';
  confirmedAt: string;
};

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
  prescription: WorkoutTemplatePrescriptionSetSnapshot[] | null;
  coachMetadata: WorkoutTemplateCoachMetadataSnapshot | null;
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

const RPE_VALUES = new Set([6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readPrescription = (
  value: unknown,
): WorkoutTemplatePrescriptionSetSnapshot[] | null | undefined => {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const result: WorkoutTemplatePrescriptionSetSnapshot[] = [];
  const sourceIds = new Set<string>();
  for (const set of value) {
    if (
      !isRecord(set) ||
      (set.sourceSetId !== undefined &&
        (typeof set.sourceSetId !== 'string' || !set.sourceSetId.trim())) ||
      typeof set.exerciseId !== 'string' ||
      !set.exerciseId.trim() ||
      typeof set.exerciseName !== 'string' ||
      !set.exerciseName.trim() ||
      typeof set.weight !== 'number' ||
      !Number.isFinite(set.weight) ||
      set.weight < 0 ||
      typeof set.reps !== 'number' ||
      !Number.isSafeInteger(set.reps) ||
      set.reps < 1 ||
      typeof set.targetRpe !== 'number' ||
      !RPE_VALUES.has(set.targetRpe) ||
      (set.adjustment !== undefined &&
        set.adjustment !== 'decrease' &&
        set.adjustment !== 'maintain' &&
        set.adjustment !== 'increase') ||
      (set.rationaleCode !== undefined &&
        (typeof set.rationaleCode !== 'string' || !set.rationaleCode.trim()))
    ) {
      return undefined;
    }
    const sourceSetId =
      typeof set.sourceSetId === 'string' ? set.sourceSetId.trim() : null;
    if (sourceSetId && sourceIds.has(sourceSetId)) return undefined;
    if (sourceSetId) sourceIds.add(sourceSetId);
    result.push({
      sourceSetId,
      exerciseId: set.exerciseId.trim(),
      exerciseName: set.exerciseName.trim(),
      weight: set.weight,
      reps: set.reps,
      targetRpe: set.targetRpe,
      adjustment:
        set.adjustment === 'decrease' ||
        set.adjustment === 'maintain' ||
        set.adjustment === 'increase'
          ? set.adjustment
          : null,
      rationaleCode:
        typeof set.rationaleCode === 'string'
          ? set.rationaleCode.trim()
          : null,
    });
  }
  return result;
};

const readCoachMetadata = (
  value: unknown,
): WorkoutTemplateCoachMetadataSnapshot | null | undefined => {
  if (value === undefined || value === null) return null;
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    typeof value.runId !== 'string' ||
    !value.runId.trim() ||
    typeof value.sourceSessionId !== 'string' ||
    !value.sourceSessionId.trim() ||
    (value.strategy !== 'deload' &&
      value.strategy !== 'maintain' &&
      value.strategy !== 'progress') ||
    typeof value.confirmedAt !== 'string' ||
    !Number.isFinite(new Date(value.confirmedAt).getTime())
  ) {
    return undefined;
  }
  return {
    schemaVersion: 1,
    runId: value.runId.trim(),
    sourceSessionId: value.sourceSessionId.trim(),
    strategy: value.strategy,
    confirmedAt: new Date(value.confirmedAt).toISOString(),
  };
};

const readSnapshot = (value: unknown): WorkoutTemplateSyncSnapshot | null => {
  const prescription = isRecord(value)
    ? readPrescription(value.prescription)
    : undefined;
  const coachMetadata = isRecord(value)
    ? readCoachMetadata(value.coachMetadata)
    : undefined;
  if (
    !isRecord(value) ||
    typeof value.title !== 'string' ||
    !value.title.trim() ||
    (value.description !== null && typeof value.description !== 'string') ||
    typeof value.duration !== 'string' ||
    !value.duration.trim() ||
    value.isCustom !== true ||
    !Array.isArray(value.exercises) ||
    value.exercises.length === 0 ||
    prescription === undefined ||
    coachMetadata === undefined ||
    Boolean(prescription) !== Boolean(coachMetadata)
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

  const exerciseIds = new Set(exercises.map((exercise) => exercise.id));
  if (prescription?.some((set) => !exerciseIds.has(set.exerciseId))) return null;

  return {
    title: value.title.trim(),
    description:
      typeof value.description === 'string' ? value.description.trim() : null,
    duration: value.duration.trim(),
    exercises,
    prescription,
    coachMetadata,
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
        version: 2,
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
