import type { RecoveryCheckIn, UserLimitation } from '@/types';
import type { StorageAdapter } from './StorageAdapter';

export const SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_safety_recovery_sync_metadata';

export type SafetyRecoveryEntityType = 'userLimitations' | 'recoveryCheckIns';

export type SafetyRecoverySyncMetadata = {
  entityType: SafetyRecoveryEntityType;
  id: string;
  userId: string;
  revision: number;
  deviceId: string;
  createdAt: string;
  syncedAt: string;
  snapshot: UserLimitation | RecoveryCheckIn;
  deletedAt?: string | null;
};

export type SafetyRecoverySyncMetadataStore = {
  load(): Promise<Map<string, SafetyRecoverySyncMetadata>>;
  set(record: SafetyRecoverySyncMetadata): Promise<Map<string, SafetyRecoverySyncMetadata>>;
  clear(): Promise<void>;
};

const keyFor = (record: Pick<SafetyRecoverySyncMetadata, 'userId' | 'entityType' | 'id'>) =>
  `${record.userId}:${record.entityType}:${record.id}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalize = (value: unknown): SafetyRecoverySyncMetadata | null => {
  if (
    !isRecord(value) ||
    (value.entityType !== 'userLimitations' && value.entityType !== 'recoveryCheckIns') ||
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
    !isRecord(value.snapshot)
  ) {
    return null;
  }

  return {
    entityType: value.entityType,
    id: value.id.trim(),
    userId: value.userId.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    createdAt: value.createdAt.trim(),
    syncedAt: value.syncedAt.trim(),
    snapshot: value.snapshot as UserLimitation | RecoveryCheckIn,
    ...(typeof value.deletedAt === 'string'
      ? { deletedAt: value.deletedAt.trim() }
      : value.deletedAt === null
        ? { deletedAt: null }
        : {}),
  };
};

const parse = async (
  storage: StorageAdapter,
): Promise<Map<string, SafetyRecoverySyncMetadata>> => {
  const raw = await storage.read(SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY);
  if (!raw) return new Map();
  try {
    const parsed = JSON.parse(raw) as unknown;
    const values = isRecord(parsed) && Array.isArray(parsed.records)
      ? parsed.records
      : Array.isArray(parsed)
        ? parsed
        : [];
    const records = values
      .map(normalize)
      .filter((item): item is SafetyRecoverySyncMetadata => Boolean(item));
    return new Map(records.map((record) => [keyFor(record), record]));
  } catch {
    return new Map();
  }
};

export const createSafetyRecoverySyncMetadataStore = (
  storage: StorageAdapter,
): SafetyRecoverySyncMetadataStore => {
  const persist = async (records: Map<string, SafetyRecoverySyncMetadata>) => {
    await storage.write(
      SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY,
      JSON.stringify({ version: 1, records: [...records.values()] }),
    );
    return records;
  };

  return {
    load: () => parse(storage),
    async set(record) {
      const records = await parse(storage);
      records.set(keyFor(record), record);
      return persist(records);
    },
    async clear() {
      await storage.remove(SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
