import type { StorageAdapter } from './StorageAdapter';

export const SYNC_CURSOR_STORAGE_KEY = '@smart_fitness_mvp_sync_cursors';

export type SyncCursor = {
  userId: string;
  deviceId: string;
  serverRevision: number;
  lastSyncedAt: string;
};

export type SyncCursorStore = {
  get(userId: string): Promise<SyncCursor | null>;
  set(cursor: SyncCursor): Promise<SyncCursor>;
  remove(userId: string): Promise<void>;
  clear(): Promise<void>;
};

type StoredSyncCursorEnvelope = {
  version?: unknown;
  records?: unknown;
  updatedAt?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeCursor = (value: unknown): SyncCursor | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.userId !== 'string' ||
    !value.userId.trim() ||
    typeof value.deviceId !== 'string' ||
    !value.deviceId.trim() ||
    typeof value.serverRevision !== 'number' ||
    !Number.isFinite(value.serverRevision) ||
    typeof value.lastSyncedAt !== 'string' ||
    !value.lastSyncedAt.trim()
  ) {
    return null;
  }

  return {
    userId: value.userId.trim(),
    deviceId: value.deviceId.trim(),
    serverRevision: Math.max(0, Math.floor(value.serverRevision)),
    lastSyncedAt: value.lastSyncedAt.trim(),
  };
};

const parse = async (storage: StorageAdapter): Promise<Map<string, SyncCursor>> => {
  const raw = await storage.read(SYNC_CURSOR_STORAGE_KEY);
  if (!raw) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const rawRecords: unknown[] = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray((parsed as StoredSyncCursorEnvelope).records)
        ? ((parsed as StoredSyncCursorEnvelope).records as unknown[])
        : [];
    const records = rawRecords
      .map(normalizeCursor)
      .filter((cursor): cursor is SyncCursor => Boolean(cursor));

    return new Map(records.map((cursor) => [cursor.userId, cursor]));
  } catch {
    return new Map();
  }
};

const serialize = (records: SyncCursor[]): string =>
  JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    records,
  });

export const createSyncCursorStore = (storage: StorageAdapter): SyncCursorStore => {
  const persist = async (records: Map<string, SyncCursor>): Promise<void> => {
    await storage.write(SYNC_CURSOR_STORAGE_KEY, serialize([...records.values()]));
  };

  return {
    async get(userId) {
      return (await parse(storage)).get(userId) ?? null;
    },
    async set(cursor) {
      const normalized = normalizeCursor(cursor);
      if (!normalized) {
        throw new Error('Invalid sync cursor');
      }

      const records = await parse(storage);
      records.set(normalized.userId, normalized);
      await persist(records);
      return normalized;
    },
    async remove(userId) {
      const records = await parse(storage);
      records.delete(userId);
      if (records.size === 0) {
        await storage.remove(SYNC_CURSOR_STORAGE_KEY);
        return;
      }
      await persist(records);
    },
    async clear() {
      await storage.remove(SYNC_CURSOR_STORAGE_KEY);
    },
  };
};
