import {
  BODY_MEASUREMENT_METRICS,
  resolveBodyMeasurementNumericValue,
} from '@/features/progress/bodyMeasurementModel';
import { ensureUuid } from '@/lib/ids';
import type {
  BodyMeasurement,
  BodyMeasurementMetric,
  BodyMeasurementUnit,
} from '@/types';
import type {
  BodyMeasurementSyncMetadata,
  BodyMeasurementSyncSnapshot,
} from '@/storage/BodyMeasurementSyncMetadataStore';

import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';

const METRICS = new Set(BODY_MEASUREMENT_METRICS.map((option) => option.metric));
const UNITS = new Set<BodyMeasurementUnit>(['cm', 'in', 'percent']);
const LABEL_TO_METRIC = new Map(
  BODY_MEASUREMENT_METRICS
    .filter((option) => option.metric !== 'custom')
    .map((option) => [option.label.toLowerCase(), option.metric] as const),
);

export const isBodyMeasurementEntity = (entityType: string): boolean =>
  entityType === 'bodyMeasurements' || entityType === 'body_measurements';

export const isBodyMeasurementQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isBodyMeasurementEntity(operation.entityType);

export const getBodyMeasurementEntityId = (id: string): string => ensureUuid(id);

const inferMetric = (measurement: BodyMeasurement): BodyMeasurementMetric =>
  measurement.metric && METRICS.has(measurement.metric)
    ? measurement.metric
    : LABEL_TO_METRIC.get(measurement.label.trim().toLowerCase()) ?? 'custom';

const inferUnit = (
  measurement: BodyMeasurement,
  parsedUnit: string,
  metric: BodyMeasurementMetric,
): BodyMeasurementUnit | null => {
  if (measurement.unit && UNITS.has(measurement.unit)) return measurement.unit;
  const normalized = parsedUnit.trim().toLowerCase();
  if (normalized === '%' || normalized === 'percent') return 'percent';
  if (normalized === 'in') return 'in';
  if (normalized === 'cm') return 'cm';
  return metric === 'body_fat' ? 'percent' : 'cm';
};

export const normalizeBodyMeasurementForSync = (
  measurement: BodyMeasurement,
): BodyMeasurement | null => {
  const parsed = resolveBodyMeasurementNumericValue(measurement);
  if (!parsed || parsed.numeric <= 0) return null;
  const metric = inferMetric(measurement);
  const unit = inferUnit(measurement, parsed.unit, metric);
  if (!unit) return null;
  if (
    (metric === 'body_fat' && unit !== 'percent') ||
    (metric !== 'body_fat' && unit === 'percent')
  ) {
    return null;
  }
  const createdAt = new Date(measurement.createdAt);
  if (!Number.isFinite(createdAt.getTime())) return null;
  const label = measurement.label.trim();
  if (!label) return null;

  return {
    id: getBodyMeasurementEntityId(measurement.id),
    label,
    value: measurement.value,
    metric,
    numericValue: parsed.numeric,
    unit,
    createdAt: createdAt.toISOString(),
  };
};

export const toBodyMeasurementSyncSnapshot = (
  measurement: BodyMeasurement,
): BodyMeasurementSyncSnapshot | null => {
  const normalized = normalizeBodyMeasurementForSync(measurement);
  if (!normalized?.metric || normalized.numericValue === undefined || !normalized.unit) {
    return null;
  }
  return {
    metric: normalized.metric,
    label: normalized.label,
    numericValue: normalized.numericValue,
    unit: normalized.unit,
    measuredAt: normalized.createdAt,
  };
};

export const areBodyMeasurementSnapshotsEqual = (
  left: BodyMeasurementSyncSnapshot,
  right: BodyMeasurementSyncSnapshot,
): boolean => JSON.stringify(left) === JSON.stringify(right);

export const bodyMeasurementFromMetadata = (
  metadata: BodyMeasurementSyncMetadata,
): BodyMeasurement => ({
  id: metadata.id,
  label: metadata.snapshot.label,
  value: `${metadata.snapshot.numericValue} ${
    metadata.snapshot.unit === 'percent' ? '%' : metadata.snapshot.unit
  }`,
  metric: metadata.snapshot.metric,
  numericValue: metadata.snapshot.numericValue,
  unit: metadata.snapshot.unit,
  createdAt: metadata.snapshot.measuredAt,
});

export const createBodyMeasurementQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  measurement: BodyMeasurement;
  userId: string;
  deviceId: string;
  baseRevision: number;
  previous?: BodyMeasurementSyncMetadata | null;
  now?: string;
}): OfflineSyncQueueOperation | null => {
  const measurement = normalizeBodyMeasurementForSync(input.measurement);
  if (!measurement) return null;
  const snapshot = toBodyMeasurementSyncSnapshot(measurement);
  if (!snapshot) return null;
  const now = Number.isFinite(new Date(input.now ?? '').getTime())
    ? new Date(input.now!).toISOString()
    : new Date().toISOString();
  const previous = input.previous?.userId === input.userId ? input.previous : null;
  const baseRevision = {
    id: previous ? `rev-${previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: previous?.syncedAt ?? now,
  };
  const payload =
    input.action === 'delete'
      ? { id: measurement.id, deletedAt: now, deviceId: input.deviceId }
      : {
          schemaVersion: 1,
          id: measurement.id,
          metric: snapshot.metric,
          label: snapshot.label,
          numericValue: snapshot.numericValue,
          unit: snapshot.unit,
          measuredAt: snapshot.measuredAt,
          createdAt: previous?.createdAt ?? measurement.createdAt,
          updatedAt: now,
          deviceId: input.deviceId,
        };
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'bodyMeasurements',
    entityId: measurement.id,
    action: input.action,
    clientTimestamp: now,
    actorId: input.userId,
    baseRevision,
    payload,
  });

  return {
    opId: `bodyMeasurements:${measurement.id}`,
    entityType: 'bodyMeasurements',
    entityId: measurement.id,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'bodyMeasurements',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      lastSyncedAt: previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};
