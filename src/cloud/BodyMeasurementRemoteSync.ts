import type { BodyMeasurementSyncMetadata } from '@/storage';
import type {
  AppState,
  BodyMeasurement,
  BodyMeasurementMetric,
  BodyMeasurementUnit,
} from '@/types';
import { isUuid } from '@/lib/ids';

import {
  isBodyMeasurementEntity,
  toBodyMeasurementSyncSnapshot,
} from './BodyMeasurementSync';

const METRICS = new Set<BodyMeasurementMetric>([
  'waist',
  'chest',
  'hips',
  'shoulders',
  'neck',
  'upper_arm',
  'thigh',
  'calf',
  'body_fat',
  'custom',
]);
const UNITS = new Set<BodyMeasurementUnit>(['cm', 'in', 'percent']);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const readRemoteMeasurement = (
  payload: Record<string, unknown>,
): BodyMeasurement | null => {
  if (
    payload.schemaVersion !== 1 ||
    typeof payload.id !== 'string' ||
    !isUuid(payload.id) ||
    typeof payload.metric !== 'string' ||
    !METRICS.has(payload.metric as BodyMeasurementMetric) ||
    typeof payload.label !== 'string' ||
    !payload.label.trim() ||
    typeof payload.numericValue !== 'number' ||
    !Number.isFinite(payload.numericValue) ||
    payload.numericValue <= 0 ||
    typeof payload.unit !== 'string' ||
    !UNITS.has(payload.unit as BodyMeasurementUnit) ||
    !isTimestamp(payload.measuredAt)
  ) {
    return null;
  }
  if (
    (payload.metric === 'body_fat' && payload.unit !== 'percent') ||
    (payload.metric !== 'body_fat' && payload.unit === 'percent')
  ) {
    return null;
  }
  const unit = payload.unit as BodyMeasurementUnit;
  const numericValue = payload.numericValue;
  return {
    id: payload.id,
    label: payload.label.trim(),
    value: `${numericValue} ${unit === 'percent' ? '%' : unit}`,
    metric: payload.metric as BodyMeasurementMetric,
    numericValue,
    unit,
    createdAt: new Date(payload.measuredAt).toISOString(),
  };
};

export type BodyMeasurementSyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: BodyMeasurementSyncMetadata[];
};

export const applyRemoteBodyMeasurementChanges = (
  state: AppState,
  changedEntities: Array<{
    payload?: Record<string, unknown> | null;
    entityId?: string | null;
    entityType: string;
    revision?: number;
    operationType?: string;
  }>,
  deletedEntities: Array<{
    id?: string;
    entityId?: string;
    entityType: string;
    revision?: number;
    appliedAt?: string | null;
  }>,
  userId: string,
  existingMetadata: Map<string, BodyMeasurementSyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): BodyMeasurementSyncResult => {
  const metadata = new Map(existingMetadata);
  let bodyMeasurements = [...state.bodyMeasurements];
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (
      !isBodyMeasurementEntity(entity.entityType) ||
      entity.operationType === 'delete' ||
      !isRecord(entity.payload)
    ) {
      continue;
    }
    const measurement = readRemoteMeasurement(entity.payload);
    const entityId = entity.entityId ?? measurement?.id ?? '';
    if (!measurement || measurement.id !== entityId) continue;
    const snapshot = toBodyMeasurementSyncSnapshot(measurement);
    if (!snapshot) continue;

    bodyMeasurements = [
      measurement,
      ...bodyMeasurements.filter((item) => item.id !== measurement.id),
    ];
    appliedRecordIds.push(measurement.id);
    metadata.set(`${userId}:${measurement.id}`, {
      id: measurement.id,
      userId,
      revision:
        typeof entity.revision === 'number' && Number.isFinite(entity.revision)
          ? Math.max(0, Math.floor(entity.revision))
          : 0,
      deviceId:
        typeof entity.payload.deviceId === 'string' && entity.payload.deviceId.trim()
          ? entity.payload.deviceId.trim()
          : 'unknown',
      createdAt: measurement.createdAt,
      syncedAt,
      snapshot,
      deletedAt: null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isBodyMeasurementEntity(deleted.entityType)) continue;
    const id = deleted.entityId ?? deleted.id;
    if (!id || !isUuid(id)) continue;
    bodyMeasurements = bodyMeasurements.filter((item) => item.id !== id);
    deletedRecordIds.push(id);
    const key = `${userId}:${id}`;
    const previous = metadata.get(key);
    if (previous) {
      metadata.set(key, {
        ...previous,
        revision:
          typeof deleted.revision === 'number' && Number.isFinite(deleted.revision)
            ? Math.max(0, Math.floor(deleted.revision))
            : previous.revision,
        syncedAt,
        deletedAt: deleted.appliedAt ?? syncedAt,
      });
    }
  }

  return {
    nextState: { ...state, bodyMeasurements },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};
