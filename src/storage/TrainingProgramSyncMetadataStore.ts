import type { TrainingProgramDifficulty, WeekdayKey } from '@/types';

import type { StorageAdapter } from './StorageAdapter';

export const TRAINING_PROGRAM_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_training_program_sync_metadata';

export type TrainingProgramDaySyncSnapshot = {
  id: string;
  weekday: WeekdayKey;
  workoutTemplateId: string | null;
  workoutTemplateName: string | null;
  notes: string | null;
  restDay: boolean;
};

export type TrainingProgramProgressionSyncSnapshot = {
  targetReps: number | null;
  targetWeight: number | null;
  rir: number | null;
  strategy: string | null;
};

export type TrainingProgramSyncSnapshot = {
  name: string;
  description: string | null;
  goal: string;
  difficulty: TrainingProgramDifficulty;
  durationWeeks: number;
  days: TrainingProgramDaySyncSnapshot[];
  progression: TrainingProgramProgressionSyncSnapshot | null;
  isCustom: true;
  metadata: Record<string, unknown> | null;
};

export type TrainingProgramSyncMetadata = {
  id: string;
  userId: string;
  revision: number;
  deviceId: string;
  createdAt: string;
  syncedAt: string;
  snapshot: TrainingProgramSyncSnapshot;
  deletedAt?: string | null;
};

export type TrainingProgramSyncMetadataStore = {
  load(): Promise<Map<string, TrainingProgramSyncMetadata>>;
  get(id: string): Promise<TrainingProgramSyncMetadata | null>;
  set(
    record: TrainingProgramSyncMetadata,
  ): Promise<Map<string, TrainingProgramSyncMetadata>>;
  clear(): Promise<void>;
};

const WEEKDAYS = new Set<WeekdayKey>([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

const DIFFICULTIES = new Set<TrainingProgramDifficulty>([
  'beginner',
  'intermediate',
  'advanced',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const readNullableString = (value: unknown): string | null | undefined => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.trim();
};

const readNullableNumber = (value: unknown): number | null | undefined => {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const readDay = (value: unknown): TrainingProgramDaySyncSnapshot | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.weekday !== 'string' ||
    !WEEKDAYS.has(value.weekday as WeekdayKey) ||
    typeof value.restDay !== 'boolean'
  ) {
    return null;
  }
  const workoutTemplateId = readNullableString(value.workoutTemplateId);
  const workoutTemplateName = readNullableString(value.workoutTemplateName);
  const notes = readNullableString(value.notes);
  if (
    workoutTemplateId === undefined ||
    workoutTemplateName === undefined ||
    notes === undefined ||
    (!value.restDay && !workoutTemplateId)
  ) {
    return null;
  }
  return {
    id: value.id.trim(),
    weekday: value.weekday as WeekdayKey,
    workoutTemplateId,
    workoutTemplateName,
    notes,
    restDay: value.restDay,
  };
};

const readProgression = (
  value: unknown,
): TrainingProgramProgressionSyncSnapshot | null | undefined => {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return undefined;
  const targetReps = readNullableNumber(value.targetReps);
  const targetWeight = readNullableNumber(value.targetWeight);
  const rir = readNullableNumber(value.rir);
  const strategy = readNullableString(value.strategy);
  if (
    targetReps === undefined ||
    targetWeight === undefined ||
    rir === undefined ||
    strategy === undefined ||
    (targetReps !== null && (!Number.isSafeInteger(targetReps) || targetReps < 1)) ||
    (targetWeight !== null && targetWeight < 0) ||
    (rir !== null && (rir < 0 || rir > 10))
  ) {
    return undefined;
  }
  return { targetReps, targetWeight, rir, strategy };
};

const readSnapshot = (value: unknown): TrainingProgramSyncSnapshot | null => {
  if (!isRecord(value)) return null;
  const progression = readProgression(value.progression);
  if (
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    (value.description !== null && typeof value.description !== 'string') ||
    typeof value.goal !== 'string' ||
    !value.goal.trim() ||
    typeof value.difficulty !== 'string' ||
    !DIFFICULTIES.has(value.difficulty as TrainingProgramDifficulty) ||
    typeof value.durationWeeks !== 'number' ||
    !Number.isSafeInteger(value.durationWeeks) ||
    value.durationWeeks < 1 ||
    !Array.isArray(value.days) ||
    value.days.length === 0 ||
    value.isCustom !== true ||
    progression === undefined ||
    (value.metadata !== null && value.metadata !== undefined && !isRecord(value.metadata))
  ) {
    return null;
  }

  const days = value.days.map(readDay);
  if (days.some((day) => !day)) return null;
  const dayIds = new Set<string>();
  const weekdays = new Set<WeekdayKey>();
  for (const day of days as TrainingProgramDaySyncSnapshot[]) {
    if (dayIds.has(day.id) || weekdays.has(day.weekday)) return null;
    dayIds.add(day.id);
    weekdays.add(day.weekday);
  }

  return {
    name: value.name.trim(),
    description:
      typeof value.description === 'string' ? value.description.trim() || null : null,
    goal: value.goal.trim(),
    difficulty: value.difficulty as TrainingProgramDifficulty,
    durationWeeks: value.durationWeeks,
    days: days as TrainingProgramDaySyncSnapshot[],
    progression,
    isCustom: true,
    metadata: isRecord(value.metadata) ? { ...value.metadata } : null,
  };
};

const normalize = (value: unknown): TrainingProgramSyncMetadata | null => {
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
    (value.deletedAt !== undefined && value.deletedAt !== null && !isTimestamp(value.deletedAt))
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
): Promise<Map<string, TrainingProgramSyncMetadata>> => {
  const raw = await storage.read(TRAINING_PROGRAM_SYNC_METADATA_STORAGE_KEY);
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
      .filter((record): record is TrainingProgramSyncMetadata => Boolean(record));
    return new Map(records.map((record) => [`${record.userId}:${record.id}`, record]));
  } catch {
    return new Map();
  }
};

export const createTrainingProgramSyncMetadataStore = (
  storage: StorageAdapter,
): TrainingProgramSyncMetadataStore => {
  const persist = async (
    records: Map<string, TrainingProgramSyncMetadata>,
  ): Promise<Map<string, TrainingProgramSyncMetadata>> => {
    await storage.write(
      TRAINING_PROGRAM_SYNC_METADATA_STORAGE_KEY,
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
      await storage.remove(TRAINING_PROGRAM_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
