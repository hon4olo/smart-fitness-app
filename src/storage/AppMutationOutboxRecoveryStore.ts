import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';
import { normalizeOfflineSyncQueueOperation } from '@/cloud/CloudQueueHelpers';

import { createAsyncStorageAdapter } from './AsyncStorageAdapter';
import { withOfflineQueueMutationLock } from './OfflineQueueMutationLock';
import type { StorageAdapter } from './StorageAdapter';

export const APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY =
  '@smart_fitness_mvp_app_mutation_outbox_recovery';

export type AppMutationOutboxRecoveryRecord = {
  id: string;
  label: string;
  operation: OfflineSyncQueueOperation;
  createdAt: string;
};

export type AppMutationOutboxRecoveryStore = {
  list(): Promise<AppMutationOutboxRecoveryRecord[]>;
  put(record: AppMutationOutboxRecoveryRecord): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
};

type StoredEnvelope = {
  version?: unknown;
  records?: unknown;
  updatedAt?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeRecoveryRecord = (
  value: unknown,
  index: number,
): AppMutationOutboxRecoveryRecord | null => {
  if (!isRecord(value)) return null;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const label = typeof value.label === 'string' ? value.label.trim() : '';
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : '';
  const createdAtTimestamp = Date.parse(createdAt);
  const operation = normalizeOfflineSyncQueueOperation(value.operation, index, createdAt);

  if (!id || !label || !Number.isFinite(createdAtTimestamp) || !operation) return null;
  if (id !== operation.opId) return null;

  return { id, label, operation, createdAt };
};

const parseStoredRecords = (value: string | null): AppMutationOutboxRecoveryRecord[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    const rawRecords = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed)
        ? (parsed as StoredEnvelope).records
        : [];
    if (!Array.isArray(rawRecords)) return [];

    const records = rawRecords
      .map(normalizeRecoveryRecord)
      .filter((record): record is AppMutationOutboxRecoveryRecord => Boolean(record));
    const deduped = new Map<string, AppMutationOutboxRecoveryRecord>();
    records.forEach((record) => deduped.set(record.id, record));
    return [...deduped.values()].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  } catch {
    return [];
  }
};

const serializeRecords = (records: AppMutationOutboxRecoveryRecord[]): string =>
  JSON.stringify({
    version: 1,
    records,
    updatedAt: new Date().toISOString(),
  });

export const createAppMutationOutboxRecoveryStore = (
  storage: StorageAdapter,
): AppMutationOutboxRecoveryStore => {
  const list = async (): Promise<AppMutationOutboxRecoveryRecord[]> =>
    parseStoredRecords(await storage.read(APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY));

  const persist = async (records: AppMutationOutboxRecoveryRecord[]): Promise<void> => {
    if (records.length === 0) {
      await storage.remove(APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY);
      return;
    }
    await storage.write(APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY, serializeRecords(records));
  };

  return {
    list,
    async put(record) {
      await withOfflineQueueMutationLock(async () => {
        const records = await list();
        const next = records.filter((item) => item.id !== record.id);
        next.push(record);
        next.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
        await persist(next);
      });
    },
    async remove(id) {
      await withOfflineQueueMutationLock(async () => {
        const records = await list();
        await persist(records.filter((record) => record.id !== id));
      });
    },
    async clear() {
      await withOfflineQueueMutationLock(async () => {
        await storage.remove(APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY);
      });
    },
  };
};

let defaultStore: AppMutationOutboxRecoveryStore | null = null;

export const getDefaultAppMutationOutboxRecoveryStore = (): AppMutationOutboxRecoveryStore => {
  defaultStore ??= createAppMutationOutboxRecoveryStore(createAsyncStorageAdapter());
  return defaultStore;
};
