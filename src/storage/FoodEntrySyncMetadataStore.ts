import type { StorageAdapter } from './StorageAdapter';

export const FOOD_ENTRY_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_food_entry_sync_metadata';

type StoredFoodEntrySyncMetadataEnvelope = {
  version?: unknown;
  records?: unknown;
  updatedAt?: unknown;
};

export type FoodEntrySyncMetadata = {
  id: string;
  revision: number;
  deviceId: string;
  consumedAt: string;
  syncedAt: string;
  deletedAt?: string | null;
};

export type FoodEntrySyncMetadataStore = {
  load(): Promise<Map<string, FoodEntrySyncMetadata>>;
  get(id: string): Promise<FoodEntrySyncMetadata | null>;
  set(record: FoodEntrySyncMetadata): Promise<Map<string, FoodEntrySyncMetadata>>;
  remove(id: string): Promise<Map<string, FoodEntrySyncMetadata>>;
  clear(): Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeMetadata = (value: unknown): FoodEntrySyncMetadata | null => {
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
    typeof value.consumedAt !== 'string' ||
    !value.consumedAt.trim() ||
    typeof value.syncedAt !== 'string' ||
    !value.syncedAt.trim()
  ) {
    return null;
  }

  const record: FoodEntrySyncMetadata = {
    id: value.id.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    consumedAt: value.consumedAt.trim(),
    syncedAt: value.syncedAt.trim(),
  };

  if (typeof value.deletedAt === 'string') {
    record.deletedAt = value.deletedAt.trim();
  } else if (value.deletedAt === null) {
    record.deletedAt = null;
  }

  return record;
};

const serialize = (records: FoodEntrySyncMetadata[]): string =>
  JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    records,
  });

const parse = async (
  storage: StorageAdapter,
): Promise<Map<string, FoodEntrySyncMetadata>> => {
  const raw = await storage.read(FOOD_ENTRY_SYNC_METADATA_STORAGE_KEY);
  if (!raw) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const rawRecords: unknown[] = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) &&
          Array.isArray((parsed as StoredFoodEntrySyncMetadataEnvelope).records)
        ? ((parsed as StoredFoodEntrySyncMetadataEnvelope).records as unknown[])
        : [];

    const records = rawRecords
      .map(normalizeMetadata)
      .filter((record): record is FoodEntrySyncMetadata => Boolean(record));

    return new Map(records.map((record) => [record.id, record]));
  } catch {
    return new Map();
  }
};

export const createFoodEntrySyncMetadataStore = (
  storage: StorageAdapter,
): FoodEntrySyncMetadataStore => {
  const persist = async (
    records: Map<string, FoodEntrySyncMetadata>,
  ): Promise<Map<string, FoodEntrySyncMetadata>> => {
    await storage.write(
      FOOD_ENTRY_SYNC_METADATA_STORAGE_KEY,
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
      await storage.remove(FOOD_ENTRY_SYNC_METADATA_STORAGE_KEY);
    },
  };
};