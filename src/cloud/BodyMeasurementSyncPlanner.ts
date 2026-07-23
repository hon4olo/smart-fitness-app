import type { BodyMeasurementSyncMetadata } from '@/storage';
import type { BodyMeasurement } from '@/types';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import {
  areBodyMeasurementSnapshotsEqual,
  bodyMeasurementFromMetadata,
  createBodyMeasurementQueueOperation,
  getBodyMeasurementEntityId,
  normalizeBodyMeasurementForSync,
  toBodyMeasurementSyncSnapshot,
} from './BodyMeasurementSync';

export const planBodyMeasurementSyncOperations = (input: {
  measurements: BodyMeasurement[];
  metadata: Map<string, BodyMeasurementSyncMetadata>;
  pendingOperations: OfflineSyncQueueOperation[];
  userId: string;
  deviceId: string;
  now?: string;
}): OfflineSyncQueueOperation[] => {
  const pendingEntityIds = new Set(
    input.pendingOperations
      .filter(
        (operation) =>
          operation.entityType === 'bodyMeasurements' &&
          operation.metadata?.userId === input.userId,
      )
      .map((operation) => operation.entityId),
  );
  const currentMetadata = [...input.metadata.values()].filter(
    (record) => record.userId === input.userId,
  );
  const metadataById = new Map(currentMetadata.map((record) => [record.id, record]));
  const localById = new Map<string, BodyMeasurement>();

  for (const measurement of input.measurements) {
    const normalized = normalizeBodyMeasurementForSync(measurement);
    if (!normalized) continue;
    localById.set(getBodyMeasurementEntityId(normalized.id), normalized);
  }

  const operations: OfflineSyncQueueOperation[] = [];
  for (const [id, measurement] of localById) {
    if (pendingEntityIds.has(id)) continue;
    const previous = metadataById.get(id) ?? null;
    const snapshot = toBodyMeasurementSyncSnapshot(measurement);
    if (!snapshot) continue;
    if (
      previous &&
      !previous.deletedAt &&
      areBodyMeasurementSnapshotsEqual(snapshot, previous.snapshot)
    ) {
      continue;
    }
    const operation = createBodyMeasurementQueueOperation({
      action: previous && !previous.deletedAt ? 'update' : 'create',
      measurement,
      userId: input.userId,
      deviceId: input.deviceId,
      baseRevision: previous?.revision ?? 0,
      previous,
      ...(input.now ? { now: input.now } : {}),
    });
    if (operation) operations.push(operation);
  }

  for (const previous of currentMetadata) {
    if (
      previous.deletedAt ||
      localById.has(previous.id) ||
      pendingEntityIds.has(previous.id)
    ) {
      continue;
    }
    const operation = createBodyMeasurementQueueOperation({
      action: 'delete',
      measurement: bodyMeasurementFromMetadata(previous),
      userId: input.userId,
      deviceId: input.deviceId,
      baseRevision: previous.revision,
      previous,
      ...(input.now ? { now: input.now } : {}),
    });
    if (operation) operations.push(operation);
  }

  return operations;
};
