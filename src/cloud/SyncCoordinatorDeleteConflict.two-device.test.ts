import { describe, expect, it } from 'vitest';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import type { SyncOperation, SyncRevision } from './CloudSyncTypes';
import { resolveConflicts } from './SyncCoordinator';

const now = '2026-07-24T12:00:00.000Z';
const mutableEntityTypes = [
  'workoutSessions',
  'weightHistory',
  'bodyMeasurements',
  'foodEntries',
  'recoveryCheckIns',
  'profile',
  'nutritionTargets',
  'workouts',
  'mealTemplates',
  'trainingPrograms',
  'customExercises',
  'userLimitations',
] as const;

type MutableEntityType = (typeof mutableEntityTypes)[number];

const revision = (id: string, number: number, createdAt: string): SyncRevision => ({
  id,
  number,
  createdAt,
});

const localOperation = (
  entityType: MutableEntityType,
  action: 'update' | 'delete',
): OfflineSyncQueueOperation => ({
  opId: `${entityType}:entity-a`,
  entityType,
  entityId: 'entity-a',
  action,
  payload:
    action === 'delete'
      ? undefined
      : {
          id: 'entity-a',
          value: 'local update',
        },
  baseRevision: revision('local-rev-4', 4, '2026-07-24T11:00:00.000Z'),
  clientTimestamp: '2026-07-24T11:10:00.000Z',
  idempotencyKey: `queue:${entityType}:entity-a:${action}:2026-07-24T11:10:00.000Z`,
  retryCount: 0,
  status: 'pending',
  metadata: {
    deviceId: 'device-a',
    source: 'local',
  },
});

const remoteOperation = (
  entityType: MutableEntityType,
  action: 'upsert' | 'delete',
): SyncOperation => ({
  id: `remote-${entityType}-entity-a`,
  entity: entityType as SyncOperation['entity'],
  entityId: 'entity-a',
  action,
  payload:
    action === 'delete'
      ? undefined
      : {
          id: 'entity-a',
          value: 'remote update',
        },
  revision: revision('remote-rev-5', 5, '2026-07-24T11:30:00.000Z'),
  metadata: {
    deviceId: 'device-b',
    source: 'remote',
  },
  createdAt: '2026-07-24T11:30:00.000Z',
});

const resolve = (
  entityType: MutableEntityType,
  localAction: 'update' | 'delete',
  remoteAction: 'upsert' | 'delete',
) =>
  resolveConflicts(
    {},
    [localOperation(entityType, localAction)],
    {
      id: 'remote-batch',
      operations: [remoteOperation(entityType, remoteAction)],
      createdAt: now,
    },
    now,
  );

describe('SyncCoordinator update-versus-delete conflicts', () => {
  it.each(mutableEntityTypes)(
    'keeps local delete versus remote update visible for %s',
    async (entityType) => {
      const result = await resolve(entityType, 'delete', 'upsert');

      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        entityType,
        localVersion: null,
        remoteVersion: {
          id: 'entity-a',
          value: 'remote update',
        },
      });
      expect(result.results[0]).toMatchObject({
        outcome: 'needsReview',
        conflictingFields: ['root'],
        requiresManualReview: true,
        reason: 'local delete versus remote update',
      });
      expect(result.unresolvedCount).toBe(1);
    },
  );

  it.each(mutableEntityTypes)(
    'keeps local update versus remote delete visible for %s',
    async (entityType) => {
      const result = await resolve(entityType, 'update', 'delete');

      expect(result.records).toHaveLength(1);
      expect(result.records[0]).toMatchObject({
        entityType,
        localVersion: {
          id: 'entity-a',
          value: 'local update',
        },
        remoteVersion: null,
      });
      expect(result.results[0]).toMatchObject({
        outcome: 'needsReview',
        conflictingFields: ['root'],
        requiresManualReview: true,
        reason: 'local update versus remote delete',
      });
      expect(result.unresolvedCount).toBe(1);
    },
  );

  it.each(mutableEntityTypes)(
    'ignores matching deletes from both devices for %s',
    async (entityType) => {
      const result = await resolve(entityType, 'delete', 'delete');

      expect(result.records).toEqual([]);
      expect(result.results).toEqual([]);
      expect(result.unresolvedCount).toBe(0);
    },
  );
});
