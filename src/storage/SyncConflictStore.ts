import type { StorageAdapter } from './StorageAdapter';

export const SYNC_CONFLICT_STORAGE_KEY = '@smart_fitness_mvp_sync_conflicts';

export type SyncConflictSource = 'client' | 'push' | 'pull';

export type SyncConflictSnapshot = {
  conflictId: string;
  source: SyncConflictSource;
  status: string;
  entityType: string;
  entityId: string;
  detectedAt: string;
  reason?: string;
  details: unknown;
};

export type SyncConflictStore = {
  list(userId: string): Promise<SyncConflictSnapshot[]>;
  merge(userId: string, snapshots: SyncConflictSnapshot[]): Promise<SyncConflictSnapshot[]>;
  remove(userId: string, conflictId: string): Promise<void>;
  clear(userId?: string): Promise<void>;
};

type StoredConflictUserRecord = {
  userId?: unknown;
  conflicts?: unknown;
};

type StoredConflictEnvelope = {
  version?: unknown;
  records?: unknown;
  updatedAt?: unknown;
};

const TERMINAL_STATUSES = new Set(['autoResolved', 'resolved', 'ignored']);
const SOURCES = new Set<SyncConflictSource>(['client', 'push', 'pull']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeSnapshot = (value: unknown): SyncConflictSnapshot | null => {
  if (!isRecord(value)) return null;

  const conflictId = nonEmptyString(value.conflictId);
  const source = nonEmptyString(value.source);
  const status = nonEmptyString(value.status);
  const entityType = nonEmptyString(value.entityType);
  const entityId = nonEmptyString(value.entityId);
  const detectedAt = nonEmptyString(value.detectedAt);

  if (
    !conflictId ||
    !source ||
    !SOURCES.has(source as SyncConflictSource) ||
    !status ||
    !entityType ||
    !entityId ||
    !detectedAt
  ) {
    return null;
  }

  const reason = nonEmptyString(value.reason);
  return {
    conflictId,
    source: source as SyncConflictSource,
    status,
    entityType,
    entityId,
    detectedAt,
    ...(reason ? { reason } : {}),
    details: value.details,
  };
};

const revisionToken = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (isRecord(value)) {
    return (
      nonEmptyString(value.id) ??
      (typeof value.number === 'number' && Number.isFinite(value.number)
        ? String(value.number)
        : '')
    );
  }
  return '';
};

export const createSyncConflictSnapshot = (
  value: unknown,
  source: SyncConflictSource,
  fallbackDetectedAt: string,
): SyncConflictSnapshot | null => {
  if (!isRecord(value)) return null;

  const entityType =
    nonEmptyString(value.entityType) ?? nonEmptyString(value.entity) ?? 'unknown';
  const entityId = nonEmptyString(value.entityId) ?? 'unknown';
  const status = nonEmptyString(value.status) ?? 'unresolved';
  const detectedAt =
    nonEmptyString(value.detectedAt) ??
    nonEmptyString(value.createdAt) ??
    fallbackDetectedAt;
  const conflictId =
    nonEmptyString(value.conflictId) ??
    nonEmptyString(value.id) ??
    [
      source,
      entityType,
      entityId,
      revisionToken(value.baseRevision),
      revisionToken(value.localRevision),
      revisionToken(value.remoteRevision),
    ].join(':');
  const reason = nonEmptyString(value.reason);

  return {
    conflictId,
    source,
    status,
    entityType,
    entityId,
    detectedAt,
    ...(reason ? { reason } : {}),
    details: value,
  };
};

export const isTerminalSyncConflict = (snapshot: SyncConflictSnapshot): boolean =>
  TERMINAL_STATUSES.has(snapshot.status);

const parse = async (
  storage: StorageAdapter,
): Promise<Map<string, Map<string, SyncConflictSnapshot>>> => {
  const raw = await storage.read(SYNC_CONFLICT_STORAGE_KEY);
  if (!raw) return new Map();

  try {
    const parsed = JSON.parse(raw) as unknown;
    const rawRecords: unknown[] = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray((parsed as StoredConflictEnvelope).records)
        ? ((parsed as StoredConflictEnvelope).records as unknown[])
        : [];
    const users = new Map<string, Map<string, SyncConflictSnapshot>>();

    for (const rawRecord of rawRecords) {
      if (!isRecord(rawRecord)) continue;
      const userRecord = rawRecord as StoredConflictUserRecord;
      const userId = nonEmptyString(userRecord.userId);
      if (!userId || !Array.isArray(userRecord.conflicts)) continue;
      const conflicts = userRecord.conflicts
        .map(normalizeSnapshot)
        .filter((snapshot): snapshot is SyncConflictSnapshot => Boolean(snapshot))
        .filter((snapshot) => !isTerminalSyncConflict(snapshot));
      users.set(
        userId,
        new Map(conflicts.map((snapshot) => [snapshot.conflictId, snapshot])),
      );
    }

    return users;
  } catch {
    return new Map();
  }
};

const sortSnapshots = (snapshots: SyncConflictSnapshot[]): SyncConflictSnapshot[] =>
  [...snapshots].sort((left, right) =>
    left.detectedAt === right.detectedAt
      ? left.conflictId.localeCompare(right.conflictId)
      : left.detectedAt.localeCompare(right.detectedAt),
  );

const serialize = (
  users: Map<string, Map<string, SyncConflictSnapshot>>,
): string =>
  JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    records: [...users.entries()].map(([userId, conflicts]) => ({
      userId,
      conflicts: sortSnapshots([...conflicts.values()]),
    })),
  });

export const createSyncConflictStore = (
  storage: StorageAdapter,
): SyncConflictStore => {
  const persist = async (
    users: Map<string, Map<string, SyncConflictSnapshot>>,
  ): Promise<void> => {
    for (const [userId, conflicts] of users) {
      if (conflicts.size === 0) users.delete(userId);
    }
    if (users.size === 0) {
      await storage.remove(SYNC_CONFLICT_STORAGE_KEY);
      return;
    }
    await storage.write(SYNC_CONFLICT_STORAGE_KEY, serialize(users));
  };

  return {
    async list(userId) {
      const normalizedUserId = userId.trim();
      if (!normalizedUserId) return [];
      const users = await parse(storage);
      return sortSnapshots([...(users.get(normalizedUserId)?.values() ?? [])]);
    },
    async merge(userId, snapshots) {
      const normalizedUserId = userId.trim();
      if (!normalizedUserId) throw new Error('Invalid sync conflict user');
      const users = await parse(storage);
      const conflicts = users.get(normalizedUserId) ?? new Map();

      for (const rawSnapshot of snapshots) {
        const snapshot = normalizeSnapshot(rawSnapshot);
        if (!snapshot) continue;
        if (isTerminalSyncConflict(snapshot)) {
          conflicts.delete(snapshot.conflictId);
        } else {
          conflicts.set(snapshot.conflictId, snapshot);
        }
      }

      users.set(normalizedUserId, conflicts);
      await persist(users);
      return sortSnapshots([...conflicts.values()]);
    },
    async remove(userId, conflictId) {
      const normalizedUserId = userId.trim();
      const normalizedConflictId = conflictId.trim();
      if (!normalizedUserId || !normalizedConflictId) return;
      const users = await parse(storage);
      const conflicts = users.get(normalizedUserId);
      if (!conflicts) return;
      conflicts.delete(normalizedConflictId);
      users.set(normalizedUserId, conflicts);
      await persist(users);
    },
    async clear(userId) {
      if (!userId) {
        await storage.remove(SYNC_CONFLICT_STORAGE_KEY);
        return;
      }
      const normalizedUserId = userId.trim();
      if (!normalizedUserId) return;
      const users = await parse(storage);
      users.delete(normalizedUserId);
      await persist(users);
    },
  };
};
