import type { SyncConflictSnapshot } from '@/storage';

export type SyncConflictDiagnosticKey =
  | 'status'
  | 'reason'
  | 'strategy'
  | 'entityId'
  | 'localRevision'
  | 'remoteRevision'
  | 'baseRevision'
  | 'requestId'
  | 'fields'
  | 'fingerprint';

export type SyncConflictDiagnosticItem = {
  key: SyncConflictDiagnosticKey;
  value: string;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const readFiniteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const formatRevision = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text || null;
  }
  if (!isRecord(value)) return null;

  const number = readFiniteNumber(value.number);
  const id = readString(value.id);
  const createdAt = readString(value.createdAt);
  const parts = [number === null ? null : `#${Math.floor(number)}`, id, createdAt].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length ? parts.join(' • ') : null;
};

const readStringList = (value: unknown): string | null => {
  if (!Array.isArray(value)) return null;
  const values = value
    .map(readString)
    .filter((item): item is string => Boolean(item))
    .slice(0, 12);
  return values.length ? values.join(', ') : null;
};

const makeFingerprint = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `conflict-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const addItem = (
  items: SyncConflictDiagnosticItem[],
  key: SyncConflictDiagnosticKey,
  value: string | null | undefined,
): void => {
  if (value) items.push({ key, value: value.slice(0, 320) });
};

export const getSyncConflictDiagnosticItems = (
  snapshot: SyncConflictSnapshot,
): SyncConflictDiagnosticItem[] => {
  const details = isRecord(snapshot.details) ? snapshot.details : undefined;
  const result = isRecord(details?.result) ? details.result : undefined;
  const metadata = isRecord(details?.metadata) ? details.metadata : undefined;
  const items: SyncConflictDiagnosticItem[] = [];

  addItem(items, 'status', snapshot.status);
  addItem(
    items,
    'reason',
    snapshot.reason ??
      readString(details?.reason) ??
      readString(result?.reason) ??
      readString(details?.explanation),
  );
  addItem(
    items,
    'strategy',
    readString(details?.resolutionStrategy) ??
      readString(result?.chosenStrategy) ??
      readString(result?.resolutionStrategy),
  );
  addItem(items, 'entityId', snapshot.entityId);
  addItem(items, 'localRevision', formatRevision(details?.localRevision));
  addItem(items, 'remoteRevision', formatRevision(details?.remoteRevision));
  addItem(items, 'baseRevision', formatRevision(details?.baseRevision));
  addItem(
    items,
    'requestId',
    readString(details?.requestId) ??
      readString(metadata?.requestId) ??
      readString(result?.requestId),
  );
  addItem(
    items,
    'fields',
    readStringList(details?.conflictingFields) ?? readStringList(result?.conflictingFields),
  );
  addItem(items, 'fingerprint', makeFingerprint(snapshot.conflictId));

  return items;
};
