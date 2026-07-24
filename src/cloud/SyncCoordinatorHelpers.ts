import type { ConflictRecord, SyncOperation } from './CloudSyncTypes';
import { filterFailedOfflineSyncQueueOperations } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import type { SyncCoordinatorStatistics } from './SyncCoordinatorTypes';

export const isSyncCoordinatorRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  return `{${Object.entries(value)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, entryValue]) =>
        `${JSON.stringify(key)}:${stableStringify(entryValue)}`,
    )
    .join(',')}}`;
};

export const cloneSyncCoordinatorValue = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneSyncCoordinatorValue(item)) as T;
  }

  if (isSyncCoordinatorRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        cloneSyncCoordinatorValue(entryValue),
      ]),
    ) as T;
  }

  return value;
};

export const areSyncCoordinatorValuesEqual = (
  left: unknown,
  right: unknown,
): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) =>
        areSyncCoordinatorValuesEqual(item, right[index]),
      )
    );
  }

  if (isSyncCoordinatorRecord(left) && isSyncCoordinatorRecord(right)) {
    const leftKeys = Object.keys(left)
      .filter((key) => left[key] !== undefined)
      .sort();
    const rightKeys = Object.keys(right)
      .filter((key) => right[key] !== undefined)
      .sort();
    if (
      leftKeys.length !== rightKeys.length ||
      leftKeys.some((key, index) => key !== rightKeys[index])
    ) {
      return false;
    }

    return leftKeys.every((key) =>
      areSyncCoordinatorValuesEqual(left[key], right[key]),
    );
  }

  return false;
};

export const makeSyncCoordinatorBatchId = (
  operations: SyncOperation[],
  now: string,
): string =>
  `sync:${now}:${operations.map((operation) => operation.id).join('|') || 'empty'}`;

export const makeSyncCoordinatorQueueOperationKey = (
  operation: OfflineSyncQueueOperation,
): string => `${operation.entityType}:${operation.entityId}`;

export const makeSyncCoordinatorStatistics = (
  queueOperations: OfflineSyncQueueOperation[],
  pendingOperations: OfflineSyncQueueOperation[],
  conflicts: ConflictRecord[] = [],
  lastSyncTimestamp?: string,
  estimatedDownloadCount = 0,
): SyncCoordinatorStatistics => ({
  pendingOperations: pendingOperations.length,
  failedOperations:
    filterFailedOfflineSyncQueueOperations(queueOperations).length,
  queueSize: queueOperations.length,
  estimatedUploadCount: pendingOperations.length,
  estimatedDownloadCount,
  conflictCount: conflicts.length,
  lastSyncTimestamp,
});

export const estimateSyncCoordinatorDurationMs = (
  statistics: SyncCoordinatorStatistics,
): number =>
  150 +
  statistics.pendingOperations * 25 +
  statistics.estimatedDownloadCount * 30 +
  statistics.conflictCount * 40 +
  statistics.failedOperations * 10;
