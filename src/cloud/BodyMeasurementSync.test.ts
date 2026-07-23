import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import type { BodyMeasurementSyncMetadata } from '@/storage';
import type { StorageAdapter } from '@/storage/StorageAdapter';
import { createBodyMeasurementSyncMetadataStore } from '@/storage';
import type { BodyMeasurement } from '@/types';

import {
  createBodyMeasurementQueueOperation,
  getBodyMeasurementEntityId,
  normalizeBodyMeasurementForSync,
} from './BodyMeasurementSync';
import { applyRemoteBodyMeasurementChanges } from './BodyMeasurementRemoteSync';
import { planBodyMeasurementSyncOperations } from './BodyMeasurementSyncPlanner';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const legacyId = 'waist-legacy';
const entityId = getBodyMeasurementEntityId(legacyId);
const measurement: BodyMeasurement = {
  id: legacyId,
  label: 'Waist',
  value: '82.5 cm',
  metric: 'waist',
  numericValue: 82.5,
  unit: 'cm',
  createdAt: '2026-07-23T10:00:00.000Z',
};

const metadata = (overrides: Partial<BodyMeasurementSyncMetadata> = {}): BodyMeasurementSyncMetadata => ({
  id: entityId,
  userId,
  revision: 4,
  deviceId,
  createdAt: '2026-07-23T10:00:00.000Z',
  syncedAt: '2026-07-23T11:00:00.000Z',
  snapshot: {
    metric: 'waist',
    label: 'Waist',
    numericValue: 82.5,
    unit: 'cm',
    measuredAt: '2026-07-23T10:00:00.000Z',
  },
  deletedAt: null,
  ...overrides,
});

describe('body measurement sync', () => {
  it('normalizes legacy ids and creates ownership-free versioned payloads', () => {
    expect(normalizeBodyMeasurementForSync(measurement)).toMatchObject({
      id: entityId,
      metric: 'waist',
      numericValue: 82.5,
      unit: 'cm',
    });

    const operation = createBodyMeasurementQueueOperation({
      action: 'create',
      measurement,
      userId,
      deviceId,
      baseRevision: 0,
      now: '2026-07-23T12:00:00.000Z',
    });
    expect(operation).toMatchObject({
      opId: `bodyMeasurements:${entityId}`,
      entityType: 'bodyMeasurements',
      entityId,
      action: 'create',
      actorId: userId,
      payload: {
        schemaVersion: 1,
        id: entityId,
        metric: 'waist',
        label: 'Waist',
        numericValue: 82.5,
        unit: 'cm',
        measuredAt: '2026-07-23T10:00:00.000Z',
      },
    });
    expect(operation?.payload).not.toHaveProperty('userId');
  });

  it('infers typed fields from legacy values and rejects incompatible units', () => {
    expect(
      normalizeBodyMeasurementForSync({
        id: 'legacy-fat',
        label: 'Body fat',
        value: '14.5%',
        createdAt: '2026-07-23T10:00:00.000Z',
      }),
    ).toMatchObject({ metric: 'body_fat', numericValue: 14.5, unit: 'percent' });

    expect(
      normalizeBodyMeasurementForSync({
        ...measurement,
        metric: 'body_fat',
        unit: 'cm',
      }),
    ).toBeNull();
  });

  it('plans create, update and tombstone operations without duplicates', () => {
    const createOperations = planBodyMeasurementSyncOperations({
      measurements: [measurement],
      metadata: new Map(),
      pendingOperations: [],
      userId,
      deviceId,
      now: '2026-07-23T12:00:00.000Z',
    });
    expect(createOperations).toHaveLength(1);
    expect(createOperations[0]?.action).toBe('create');

    const unchanged = planBodyMeasurementSyncOperations({
      measurements: [measurement],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [],
      userId,
      deviceId,
    });
    expect(unchanged).toHaveLength(0);

    const updated = planBodyMeasurementSyncOperations({
      measurements: [{ ...measurement, numericValue: 81, value: '81 cm' }],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [],
      userId,
      deviceId,
    });
    expect(updated[0]?.action).toBe('update');

    const deleted = planBodyMeasurementSyncOperations({
      measurements: [],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [],
      userId,
      deviceId,
    });
    expect(deleted[0]?.action).toBe('delete');
  });

  it('materializes valid remote measurements and tombstones fail-closed', () => {
    const applied = applyRemoteBodyMeasurementChanges(
      { ...defaultState, bodyMeasurements: [] },
      [
        {
          entityType: 'bodyMeasurements',
          entityId,
          revision: 5,
          payload: {
            schemaVersion: 1,
            id: entityId,
            metric: 'waist',
            label: 'Waist',
            numericValue: 81.5,
            unit: 'cm',
            measuredAt: '2026-07-24T10:00:00.000Z',
            deviceId,
          },
        },
        {
          entityType: 'bodyMeasurements',
          entityId: '44444444-4444-4444-8444-444444444444',
          revision: 6,
          payload: { schemaVersion: 1, metric: 'body_fat', unit: 'cm' },
        },
      ],
      [],
      userId,
      new Map(),
      '2026-07-24T11:00:00.000Z',
    );
    expect(applied.appliedRecordIds).toEqual([entityId]);
    expect(applied.nextState.bodyMeasurements[0]).toMatchObject({
      id: entityId,
      numericValue: 81.5,
      unit: 'cm',
    });

    const deleted = applyRemoteBodyMeasurementChanges(
      applied.nextState,
      [],
      [
        {
          entityType: 'body_measurements',
          entityId,
          revision: 6,
          appliedAt: '2026-07-24T12:00:00.000Z',
        },
      ],
      userId,
      new Map(applied.metadata.map((record) => [`${record.userId}:${record.id}`, record])),
    );
    expect(deleted.nextState.bodyMeasurements).toHaveLength(0);
    expect(deleted.deletedRecordIds).toEqual([entityId]);
  });

  it('persists only valid revision metadata', async () => {
    const values = new Map<string, string>();
    const storage: StorageAdapter = {
      read: async (key) => values.get(key) ?? null,
      write: async (key, value) => {
        values.set(key, value);
      },
      remove: async (key) => {
        values.delete(key);
      },
    };
    const store = createBodyMeasurementSyncMetadataStore(storage);
    await store.set(metadata());
    expect(await store.get(entityId)).toMatchObject({ revision: 4, userId });

    values.set(
      '@smart_fitness_mvp_body_measurement_sync_metadata',
      JSON.stringify({ records: [{ ...metadata(), snapshot: { unit: 'kg' } }] }),
    );
    expect(await store.load()).toEqual(new Map());
  });
});
