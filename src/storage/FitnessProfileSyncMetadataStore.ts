import type { StorageAdapter } from './StorageAdapter';

export const FITNESS_PROFILE_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_fitness_profile_sync_metadata';

export type FitnessProfileSyncSnapshot = {
  dateOfBirth: string | null;
  calculationSex: 'male' | 'female' | null;
  heightCm: number | null;
  goal: 'maintain' | 'fat_loss' | 'muscle_gain' | 'recomposition' | null;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high' | 'very_high' | null;
  trainingExperience: 'beginner' | 'intermediate' | 'advanced' | null;
  trainingDaysPerWeek: number | null;
  targetWeightKg: number | null;
  targetWeeklyWeightChangeKg: number | null;
};

export type FitnessProfileSyncMetadata = {
  id: string;
  revision: number;
  deviceId: string;
  syncedAt: string;
  snapshot: FitnessProfileSyncSnapshot;
  deletedAt?: string | null;
};

export type FitnessProfileSyncMetadataStore = {
  load(): Promise<Map<string, FitnessProfileSyncMetadata>>;
  get(id: string): Promise<FitnessProfileSyncMetadata | null>;
  set(record: FitnessProfileSyncMetadata): Promise<Map<string, FitnessProfileSyncMetadata>>;
  clear(): Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNullableString = (record: Record<string, unknown>, key: string): string | null | undefined => {
  const value = record[key];
  return value === null ? null : typeof value === 'string' ? value : undefined;
};

const readNullableNumber = (record: Record<string, unknown>, key: string): number | null | undefined => {
  const value = record[key];
  return value === null
    ? null
    : typeof value === 'number' && Number.isFinite(value)
      ? value
      : undefined;
};

const normalizeSnapshot = (value: unknown): FitnessProfileSyncSnapshot | null => {
  if (!isRecord(value)) return null;

  const dateOfBirth = readNullableString(value, 'dateOfBirth');
  const calculationSex = readNullableString(value, 'calculationSex');
  const heightCm = readNullableNumber(value, 'heightCm');
  const goal = readNullableString(value, 'goal');
  const activityLevel = readNullableString(value, 'activityLevel');
  const trainingExperience = readNullableString(value, 'trainingExperience');
  const trainingDaysPerWeek = readNullableNumber(value, 'trainingDaysPerWeek');
  const targetWeightKg = readNullableNumber(value, 'targetWeightKg');
  const targetWeeklyWeightChangeKg = readNullableNumber(
    value,
    'targetWeeklyWeightChangeKg',
  );

  if (
    dateOfBirth === undefined ||
    (calculationSex !== null && calculationSex !== 'male' && calculationSex !== 'female') ||
    heightCm === undefined ||
    (goal !== null &&
      goal !== 'maintain' &&
      goal !== 'fat_loss' &&
      goal !== 'muscle_gain' &&
      goal !== 'recomposition') ||
    (activityLevel !== null &&
      activityLevel !== 'sedentary' &&
      activityLevel !== 'light' &&
      activityLevel !== 'moderate' &&
      activityLevel !== 'high' &&
      activityLevel !== 'very_high') ||
    (trainingExperience !== null &&
      trainingExperience !== 'beginner' &&
      trainingExperience !== 'intermediate' &&
      trainingExperience !== 'advanced') ||
    trainingDaysPerWeek === undefined ||
    targetWeightKg === undefined ||
    targetWeeklyWeightChangeKg === undefined
  ) {
    return null;
  }

  return {
    dateOfBirth,
    calculationSex,
    heightCm,
    goal,
    activityLevel,
    trainingExperience,
    trainingDaysPerWeek,
    targetWeightKg,
    targetWeeklyWeightChangeKg,
  };
};

const normalize = (value: unknown): FitnessProfileSyncMetadata | null => {
  if (!isRecord(value)) return null;
  const snapshot = normalizeSnapshot(value.snapshot);
  if (
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.revision !== 'number' ||
    !Number.isFinite(value.revision) ||
    typeof value.deviceId !== 'string' ||
    !value.deviceId.trim() ||
    typeof value.syncedAt !== 'string' ||
    !value.syncedAt.trim() ||
    !snapshot
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
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
): Promise<Map<string, FitnessProfileSyncMetadata>> => {
  const raw = await storage.read(FITNESS_PROFILE_SYNC_METADATA_STORAGE_KEY);
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
      .filter((record): record is FitnessProfileSyncMetadata => Boolean(record));
    return new Map(records.map((record) => [record.id, record]));
  } catch {
    return new Map();
  }
};

export const createFitnessProfileSyncMetadataStore = (
  storage: StorageAdapter,
): FitnessProfileSyncMetadataStore => {
  const persist = async (
    records: Map<string, FitnessProfileSyncMetadata>,
  ): Promise<Map<string, FitnessProfileSyncMetadata>> => {
    await storage.write(
      FITNESS_PROFILE_SYNC_METADATA_STORAGE_KEY,
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
      await storage.remove(FITNESS_PROFILE_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
