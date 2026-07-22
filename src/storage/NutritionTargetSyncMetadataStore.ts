import type { StorageAdapter } from './StorageAdapter';

export const NUTRITION_TARGET_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_nutrition_target_sync_metadata';

export type NutritionTargetSyncMetadata = {
  id: string;
  revision: number;
  deviceId: string;
  effectiveFrom: string;
  syncedAt: string;
  deletedAt?: string | null;
};

export type NutritionTargetSyncMetadataStore = {
  load(): Promise<Map<string, NutritionTargetSyncMetadata>>;
  get(id: string): Promise<NutritionTargetSyncMetadata | null>;
  set(record: NutritionTargetSyncMetadata): Promise<Map<string, NutritionTargetSyncMetadata>>;
  clear(): Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalize = (value: unknown): NutritionTargetSyncMetadata | null => {
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
    typeof value.effectiveFrom !== 'string' ||
    !value.effectiveFrom.trim() ||
    typeof value.syncedAt !== 'string' ||
    !value.syncedAt.trim()
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    effectiveFrom: value.effectiveFrom.trim(),
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
): Promise<Map<string, NutritionTargetSyncMetadata>> => {
  const raw = await storage.read(NUTRITION_TARGET_SYNC_METADATA_STORAGE_KEY);
  if (!raw) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const values = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.records)
        ? parsed.records
        : [];
    const records = values
      .map(normalize)
      .filter((record): record is NutritionTargetSyncMetadata => Boolean(record));
    return new Map(records.map((record) => [record.id, record]));
  } catch {
    return new Map();
  }
};

export const createNutritionTargetSyncMetadataStore = (
  storage: StorageAdapter,
): NutritionTargetSyncMetadataStore => {
  const persist = async (
    records: Map<string, NutritionTargetSyncMetadata>,
  ): Promise<Map<string, NutritionTargetSyncMetadata>> => {
    await storage.write(
      NUTRITION_TARGET_SYNC_METADATA_STORAGE_KEY,
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
      await storage.remove(NUTRITION_TARGET_SYNC_METADATA_STORAGE_KEY);
    },
  };
};