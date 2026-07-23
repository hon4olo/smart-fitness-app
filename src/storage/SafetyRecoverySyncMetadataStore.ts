import type { StorageAdapter } from './StorageAdapter';

export const SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_safety_recovery_sync_metadata';

export type SafetyRecoverySyncEntityType = 'userLimitations' | 'recoveryCheckIns';

export type SafetyRecoverySyncMetadata = {
  id: string;
  entityType: SafetyRecoverySyncEntityType;
  revision: number;
  deviceId: string;
  syncedAt: string;
  deletedAt?: string | null;
};

export type SafetyRecoverySyncMetadataStore = {
  load(): Promise<Map<string, SafetyRecoverySyncMetadata>>;
  get(
    entityType: SafetyRecoverySyncEntityType,
    id: string,
  ): Promise<SafetyRecoverySyncMetadata | null>;
  set(record: SafetyRecoverySyncMetadata): Promise<Map<string, SafetyRecoverySyncMetadata>>;
  remove(
    entityType: SafetyRecoverySyncEntityType,
    id: string,
  ): Promise<Map<string, SafetyRecoverySyncMetadata>>;
  clear(): Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const getSafetyRecoverySyncMetadataKey = (
  entityType: SafetyRecoverySyncEntityType,
  id: string,
): string => `${entityType}:${id.trim().toLowerCase()}`;

const normalizeMetadata = (value: unknown): SafetyRecoverySyncMetadata | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    (value.entityType !== 'userLimitations' && value.entityType !== 'recoveryCheckIns') ||
    typeof value.revision !== 'number' ||
    !Number.isFinite(value.revision) ||
    typeof value.deviceId !== 'string' ||
    !value.deviceId.trim() ||
    typeof value.syncedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.syncedAt))
  ) {
    return null;
  }

  const record: SafetyRecoverySyncMetadata = {
    id: value.id.trim().toLowerCase(),
    entityType: value.entityType,
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    syncedAt: new Date(value.syncedAt).toISOString(),
  };
  if (value.deletedAt === null) {
    record.deletedAt = null;
  } else if (
    typeof value.deletedAt === 'string' &&
    Number.isFinite(Date.parse(value.deletedAt))
  ) {
    record.deletedAt = new Date(value.deletedAt).toISOString();
  }
  return record;
};

const parse = async (
  storage: StorageAdapter,
): Promise<Map<string, SafetyRecoverySyncMetadata>> => {
  const raw = await storage.read(SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY);
  if (!raw) return new Map();

  try {
    const parsed = JSON.parse(raw) as unknown;
    const rawRecords = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.records)
        ? parsed.records
        : [];
    const records = rawRecords
      .map(normalizeMetadata)
      .filter((record): record is SafetyRecoverySyncMetadata => Boolean(record));
    return new Map(
      records.map((record) => [
        getSafetyRecoverySyncMetadataKey(record.entityType, record.id),
        record,
      ]),
    );
  } catch {
    return new Map();
  }
};

const serialize = (records: SafetyRecoverySyncMetadata[]): string =>
  JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    records,
  });

export const createSafetyRecoverySyncMetadataStore = (
  storage: StorageAdapter,
): SafetyRecoverySyncMetadataStore => {
  const persist = async (
    records: Map<string, SafetyRecoverySyncMetadata>,
  ): Promise<Map<string, SafetyRecoverySyncMetadata>> => {
    await storage.write(
      SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY,
      serialize([...records.values()]),
    );
    return records;
  };

  return {
    async load() {
      return parse(storage);
    },
    async get(entityType, id) {
      return (
        (await parse(storage)).get(getSafetyRecoverySyncMetadataKey(entityType, id)) ?? null
      );
    },
    async set(record) {
      const records = await parse(storage);
      records.set(
        getSafetyRecoverySyncMetadataKey(record.entityType, record.id),
        record,
      );
      return persist(records);
    },
    async remove(entityType, id) {
      const records = await parse(storage);
      records.delete(getSafetyRecoverySyncMetadataKey(entityType, id));
      return persist(records);
    },
    async clear() {
      await storage.remove(SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
