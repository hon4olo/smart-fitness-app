import type { StorageAdapter } from './StorageAdapter';

export const WEIGHT_SYNC_METADATA_STORAGE_KEY = '@smart_fitness_mvp_weight_sync_metadata';

type StoredWeightSyncMetadataEnvelope = {
  version?: unknown;
  records?: unknown;
  updatedAt?: unknown;
};

export type WeightSyncMetadata = {
  id: string;
  revision: number;
  deviceId: string;
  recordedAt: string;
  syncedAt: string;
  deletedAt?: string | null;
};

export type WeightSyncMetadataStore = {
  load(): Promise<Map<string, WeightSyncMetadata>>;
  get(id: string): Promise<WeightSyncMetadata | null>;
  set(record: WeightSyncMetadata): Promise<Map<string, WeightSyncMetadata>>;
  remove(id: string): Promise<Map<string, WeightSyncMetadata>>;
  clear(): Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeMetadata = (value: unknown): WeightSyncMetadata | null => {
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
    typeof value.recordedAt !== 'string' ||
    !value.recordedAt.trim() ||
    typeof value.syncedAt !== 'string' ||
    !value.syncedAt.trim()
  ) {
    return null;
  }

  const record: WeightSyncMetadata = {
    id: value.id.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    recordedAt: value.recordedAt.trim(),
    syncedAt: value.syncedAt.trim(),
  };

  if (typeof value.deletedAt === 'string') {
    record.deletedAt = value.deletedAt.trim();
  } else if (value.deletedAt === null) {
    record.deletedAt = null;
  }

  return record;
};

const serialize = (records: WeightSyncMetadata[]): string =>
  JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    records,
  });

const parse = async (storage: StorageAdapter): Promise<Map<string, WeightSyncMetadata>> => {
  const raw = await storage.read(WEIGHT_SYNC_METADATA_STORAGE_KEY);
  if (!raw) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const rawRecords: unknown[] = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray((parsed as StoredWeightSyncMetadataEnvelope).records)
        ? ((parsed as StoredWeightSyncMetadataEnvelope).records as unknown[])
        : [];

    const records = rawRecords
      .map(normalizeMetadata)
      .filter((record): record is WeightSyncMetadata => Boolean(record));

    return new Map(records.map((record) => [record.id, record]));
  } catch {
    return new Map();
  }
};

export const createWeightSyncMetadataStore = (storage: StorageAdapter): WeightSyncMetadataStore => {
  const persist = async (records: Map<string, WeightSyncMetadata>): Promise<Map<string, WeightSyncMetadata>> => {
    await storage.write(WEIGHT_SYNC_METADATA_STORAGE_KEY, serialize([...records.values()]));
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
      await storage.remove(WEIGHT_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
