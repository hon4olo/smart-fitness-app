import type { ExerciseDifficulty, ExerciseType } from '@/domain/models';

import type { StorageAdapter } from './StorageAdapter';

export const CUSTOM_EXERCISE_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_custom_exercise_sync_metadata';

export type CustomExerciseSyncSnapshot = {
  name: string;
  aliases: string[];
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  movementPattern: string[];
  difficulty: ExerciseDifficulty;
  exerciseType: ExerciseType;
  unilateral: boolean;
  tags: string[];
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  estimatedSetupTime: number | null;
  muscleGroup: string | null;
  notes: string | null;
  source: 'user' | 'imported' | 'remote';
  favorite: boolean;
  metadata: Record<string, unknown> | null;
};

export type CustomExerciseSyncMetadata = {
  id: string;
  userId: string;
  revision: number;
  deviceId: string;
  createdAt: string;
  syncedAt: string;
  snapshot: CustomExerciseSyncSnapshot;
  deletedAt?: string | null;
};

export type CustomExerciseSyncMetadataStore = {
  load(): Promise<Map<string, CustomExerciseSyncMetadata>>;
  get(id: string): Promise<CustomExerciseSyncMetadata | null>;
  set(
    record: CustomExerciseSyncMetadata,
  ): Promise<Map<string, CustomExerciseSyncMetadata>>;
  clear(): Promise<void>;
};

const DIFFICULTIES = new Set<ExerciseDifficulty>([
  'beginner',
  'intermediate',
  'advanced',
]);
const EXERCISE_TYPES = new Set<ExerciseType>([
  'compound',
  'isolation',
  'cardio',
  'mobility',
  'skill',
]);
const SOURCES = new Set(['user', 'imported', 'remote'] as const);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const readStringList = (value: unknown): string[] | null => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return null;
  }
  return value.map((item) => item.trim()).filter(Boolean);
};

const readNullableString = (value: unknown): string | null | undefined => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  return value.trim() || null;
};

const readNullableNumber = (value: unknown): number | null | undefined => {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
};

const readSnapshot = (value: unknown): CustomExerciseSyncSnapshot | null => {
  if (!isRecord(value)) return null;
  const aliases = readStringList(value.aliases);
  const primaryMuscles = readStringList(value.primaryMuscles);
  const secondaryMuscles = readStringList(value.secondaryMuscles);
  const equipment = readStringList(value.equipment);
  const movementPattern = readStringList(value.movementPattern);
  const tags = readStringList(value.tags);
  const instructions = readStringList(value.instructions);
  const tips = readStringList(value.tips);
  const commonMistakes = readStringList(value.commonMistakes);
  const category = readNullableString(value.category);
  const muscleGroup = readNullableString(value.muscleGroup);
  const notes = readNullableString(value.notes);
  const estimatedSetupTime = readNullableNumber(value.estimatedSetupTime);
  if (
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    !aliases ||
    !primaryMuscles ||
    !secondaryMuscles ||
    !equipment ||
    !movementPattern ||
    !tags ||
    !instructions ||
    !tips ||
    !commonMistakes ||
    category === undefined ||
    muscleGroup === undefined ||
    notes === undefined ||
    estimatedSetupTime === undefined ||
    typeof value.difficulty !== 'string' ||
    !DIFFICULTIES.has(value.difficulty as ExerciseDifficulty) ||
    typeof value.exerciseType !== 'string' ||
    !EXERCISE_TYPES.has(value.exerciseType as ExerciseType) ||
    typeof value.unilateral !== 'boolean' ||
    typeof value.source !== 'string' ||
    !SOURCES.has(value.source as 'user' | 'imported' | 'remote') ||
    typeof value.favorite !== 'boolean' ||
    (value.metadata !== null && value.metadata !== undefined && !isRecord(value.metadata))
  ) {
    return null;
  }
  return {
    name: value.name.trim(),
    aliases,
    category,
    primaryMuscles,
    secondaryMuscles,
    equipment,
    movementPattern,
    difficulty: value.difficulty as ExerciseDifficulty,
    exerciseType: value.exerciseType as ExerciseType,
    unilateral: value.unilateral,
    tags,
    instructions,
    tips,
    commonMistakes,
    estimatedSetupTime,
    muscleGroup,
    notes,
    source: value.source as 'user' | 'imported' | 'remote',
    favorite: value.favorite,
    metadata: isRecord(value.metadata) ? { ...value.metadata } : null,
  };
};

const normalize = (value: unknown): CustomExerciseSyncMetadata | null => {
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
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.syncedAt) ||
    !snapshot ||
    (value.deletedAt !== undefined &&
      value.deletedAt !== null &&
      !isTimestamp(value.deletedAt))
  ) {
    return null;
  }
  return {
    id: value.id.trim(),
    userId: value.userId.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    createdAt: new Date(value.createdAt).toISOString(),
    syncedAt: new Date(value.syncedAt).toISOString(),
    snapshot,
    ...(typeof value.deletedAt === 'string'
      ? { deletedAt: new Date(value.deletedAt).toISOString() }
      : value.deletedAt === null
        ? { deletedAt: null }
        : {}),
  };
};

const parse = async (
  storage: StorageAdapter,
): Promise<Map<string, CustomExerciseSyncMetadata>> => {
  const raw = await storage.read(CUSTOM_EXERCISE_SYNC_METADATA_STORAGE_KEY);
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
      .filter((record): record is CustomExerciseSyncMetadata => Boolean(record));
    return new Map(records.map((record) => [`${record.userId}:${record.id}`, record]));
  } catch {
    return new Map();
  }
};

export const createCustomExerciseSyncMetadataStore = (
  storage: StorageAdapter,
): CustomExerciseSyncMetadataStore => {
  const persist = async (
    records: Map<string, CustomExerciseSyncMetadata>,
  ): Promise<Map<string, CustomExerciseSyncMetadata>> => {
    await storage.write(
      CUSTOM_EXERCISE_SYNC_METADATA_STORAGE_KEY,
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
      await storage.remove(CUSTOM_EXERCISE_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
