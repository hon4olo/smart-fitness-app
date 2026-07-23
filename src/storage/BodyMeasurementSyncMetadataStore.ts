import type { BodyMeasurementMetric, BodyMeasurementUnit } from '@/types';

import type { StorageAdapter } from './StorageAdapter';

export const BODY_MEASUREMENT_SYNC_METADATA_STORAGE_KEY =
  '@smart_fitness_mvp_body_measurement_sync_metadata';

export type BodyMeasurementSyncSnapshot = {
  metric: BodyMeasurementMetric;
  label: string;
  numericValue: number;
  unit: BodyMeasurementUnit;
  measuredAt: string;
};

export type BodyMeasurementSyncMetadata = {
  id: string;
  userId: string;
  revision: number;
  deviceId: string;
  createdAt: string;
  syncedAt: string;
  snapshot: BodyMeasurementSyncSnapshot;
  deletedAt?: string | null;
};

export type BodyMeasurementSyncMetadataStore = {
  load(): Promise<Map<string, BodyMeasurementSyncMetadata>>;
  get(id: string): Promise<BodyMeasurementSyncMetadata | null>;
  set(record: BodyMeasurementSyncMetadata): Promise<Map<string, BodyMeasurementSyncMetadata>>;
  clear(): Promise<void>;
};

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

const readSnapshot = (value: unknown): BodyMeasurementSyncSnapshot | null => {
  if (
    !isRecord(value) ||
    typeof value.metric !== 'string' ||
    !METRICS.has(value.metric as BodyMeasurementMetric) ||
    typeof value.label !== 'string' ||
    !value.label.trim() ||
    typeof value.numericValue !== 'number' ||
    !Number.isFinite(value.numericValue) ||
    value.numericValue <= 0 ||
    typeof value.unit !== 'string' ||
    !UNITS.has(value.unit as BodyMeasurementUnit) ||
    !isTimestamp(value.measuredAt)
  ) {
    return null;
  }
  if (
    (value.metric === 'body_fat' && value.unit !== 'percent') ||
    (value.metric !== 'body_fat' && value.unit === 'percent')
  ) {
    return null;
  }
  return {
    metric: value.metric as BodyMeasurementMetric,
    label: value.label.trim(),
    numericValue: value.numericValue,
    unit: value.unit as BodyMeasurementUnit,
    measuredAt: new Date(value.measuredAt).toISOString(),
  };
};

const normalize = (value: unknown): BodyMeasurementSyncMetadata | null => {
  const snapshot = isRecord(value) ? readSnapshot(value.snapshot) : null;
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.userId !== 'string' ||
    !value.userId.trim() ||
    typeof value.revision !== 'number' ||
    !Number.isFinite(value.revision) ||
    typeof value.deviceId !== 'string' ||
    !value.deviceId.trim() ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.syncedAt) ||
    !snapshot ||
    (value.deletedAt !== undefined && value.deletedAt !== null && !isTimestamp(value.deletedAt))
  ) {
    return null;
  }
  return {
    id: value.id.trim(),
    userId: value.userId.trim(),
    revision: Math.max(0, Math.floor(value.revision)),
    deviceId: value.deviceId.trim(),
    createdAt: new Date(value.createdAt).toISOString(),
    syncedAt: new Date(value.syncedAt).toISOString(),
    snapshot,
    ...(typeof value.deletedAt === 'string'
      ? { deletedAt: new Date(value.deletedAt).toISOString() }
      : value.deletedAt === null
        ? { deletedAt: null }
        : {}),
  };
};

const parse = async (
  storage: StorageAdapter,
): Promise<Map<string, BodyMeasurementSyncMetadata>> => {
  const raw = await storage.read(BODY_MEASUREMENT_SYNC_METADATA_STORAGE_KEY);
  if (!raw) return new Map();
  try {
    const parsed = JSON.parse(raw) as unknown;
    const values = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.records)
        ? parsed.records
        : [];
    const records = values
      .map(normalize)
      .filter((record): record is BodyMeasurementSyncMetadata => Boolean(record));
    return new Map(records.map((record) => [`${record.userId}:${record.id}`, record]));
  } catch {
    return new Map();
  }
};

export const createBodyMeasurementSyncMetadataStore = (
  storage: StorageAdapter,
): BodyMeasurementSyncMetadataStore => {
  const persist = async (
    records: Map<string, BodyMeasurementSyncMetadata>,
  ): Promise<Map<string, BodyMeasurementSyncMetadata>> => {
    await storage.write(
      BODY_MEASUREMENT_SYNC_METADATA_STORAGE_KEY,
      JSON.stringify({ version: 1, records: [...records.values()] }),
    );
    return records;
  };

  return {
    load: () => parse(storage),
    async get(id) {
      const records = await parse(storage);
      return [...records.values()].find((record) => record.id === id) ?? null;
    },
    async set(record) {
      const records = await parse(storage);
      records.set(`${record.userId}:${record.id}`, record);
      return persist(records);
    },
    async clear() {
      await storage.remove(BODY_MEASUREMENT_SYNC_METADATA_STORAGE_KEY);
    },
  };
};
