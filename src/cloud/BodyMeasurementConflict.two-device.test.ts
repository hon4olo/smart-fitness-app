import { describe, expect, it } from 'vitest';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { createConflictResolver } from './CloudConflictResolver';
import type { SyncOperation } from './CloudSyncTypes';
import { resolveConflicts } from './SyncCoordinator';

const now = '2026-07-24T12:00:00.000Z';

const revision = (id: string, number: number, createdAt: string) => ({
  id,
  number,
  createdAt,
});

const measurementPayload = (
  id: string,
  numericValue: number,
): Record<string, unknown> => ({
  schemaVersion: 1,
  id,
  metric: 'waist',
  label: 'Waist',
  numericValue,
  unit: 'cm',
  measuredAt: '2026-07-24T10:00:00.000Z',
});

const localOperation = (
  entityId: string,
  payload: Record<string, unknown>,
): OfflineSyncQueueOperation => ({
  opId: `bodyMeasurements:${entityId}`,
  entityType: 'bodyMeasurements',
  entityId,
  action: 'update',
  payload,
  baseRevision: revision('local-base-1', 1, '2026-07-24T10:30:00.000Z'),
  clientTimestamp: '2026-07-24T11:00:00.000Z',
  idempotencyKey: `body-measurement-${entityId}`,
  retryCount: 0,
  status: 'pending',
  metadata: {
    deviceId: 'device-a',
    source: 'local',
  },
});

const remoteOperation = (
  entityId: string,
  payload: Record<string, unknown>,
): SyncOperation => ({
  id: `remote-${entityId}`,
  entity: 'bodyMeasurements',
  entityId,
  action: 'upsert',
  payload,
  revision: revision('remote-rev-2', 2, '2026-07-24T11:30:00.000Z'),
  metadata: {
    deviceId: 'device-b',
    source: 'remote',
  },
  createdAt: '2026-07-24T11:30:00.000Z',
});

describe('body measurement two-device conflict matrix', () => {
  it('does not conflict when devices append different measurement records', async () => {
    const localId = '11111111-1111-4111-8111-111111111111';
    const remoteId = '22222222-2222-4222-8222-222222222222';

    const result = await resolveConflicts(
      {},
      [localOperation(localId, measurementPayload(localId, 82.5))],
      {
        id: 'remote-batch',
        operations: [remoteOperation(remoteId, measurementPayload(remoteId, 81.5))],
        createdAt: now,
      },
      now,
    );

    expect(result.records).toEqual([]);
    expect(result.results).toEqual([]);
    expect(result.unresolvedCount).toBe(0);
  });

  it('does not conflict on duplicate delivery of the same measurement snapshot', async () => {
    const entityId = '33333333-3333-4333-8333-333333333333';
    const payload = measurementPayload(entityId, 82.5);

    const result = await resolveConflicts(
      {},
      [localOperation(entityId, payload)],
      {
        id: 'remote-batch',
        operations: [remoteOperation(entityId, payload)],
        createdAt: now,
      },
      now,
    );

    expect(result.records).toEqual([]);
    expect(result.unresolvedCount).toBe(0);
  });

  it('keeps divergent edits to the same measurement visible for review', async () => {
    const entityId = '44444444-4444-4444-8444-444444444444';

    const result = await resolveConflicts(
      {},
      [localOperation(entityId, measurementPayload(entityId, 82.5))],
      {
        id: 'remote-batch',
        operations: [remoteOperation(entityId, measurementPayload(entityId, 81.5))],
        createdAt: now,
      },
      now,
    );

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      entityType: 'bodyMeasurements',
      entityId,
      resolutionStrategy: 'appendUnion',
    });
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      outcome: 'needsReview',
      chosenStrategy: 'appendUnion',
      conflictingFields: ['root'],
      requiresManualReview: true,
    });
    expect(result.unresolvedCount).toBe(1);
  });

  it('unions independent append-only measurement collections deterministically', () => {
    const resolver = createConflictResolver();
    const localMeasurement = {
      id: '55555555-5555-4555-8555-555555555555',
      metric: 'waist',
      numericValue: 82.5,
      unit: 'cm',
    };
    const remoteMeasurement = {
      id: '66666666-6666-4666-8666-666666666666',
      metric: 'body_fat',
      numericValue: 14,
      unit: 'percent',
    };
    const record = resolver.detectConflict({
      entityType: 'bodyMeasurements',
      entityId: 'body-measurement-collection',
      localVersion: [localMeasurement],
      remoteVersion: [remoteMeasurement],
      localRevision: revision('local-rev-2', 2, '2026-07-24T11:00:00.000Z'),
      remoteRevision: revision('remote-rev-2', 2, '2026-07-24T11:01:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.requiresManualReview).toBe(false);
    expect(result.resolvedValue).toEqual([localMeasurement, remoteMeasurement]);
  });
});
