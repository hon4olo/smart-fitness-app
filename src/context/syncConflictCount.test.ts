import { describe, expect, it } from 'vitest';

import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';
import type { SyncOperation } from '@/cloud/CloudSyncTypes';
import { resolveConflicts } from '@/cloud/SyncCoordinator';

import {
  countUnresolvedSyncConflicts,
  isUnresolvedSyncConflict,
} from './syncContextModel';

const entityId = '11111111-1111-4111-8111-111111111111';
const now = '2026-07-24T12:00:00.000Z';

const localOperation: OfflineSyncQueueOperation = {
  opId: `nutritionTargets:${entityId}`,
  entityType: 'nutritionTargets',
  entityId,
  action: 'update',
  payload: {
    schemaVersion: 1,
    id: entityId,
    calories: 2400,
    protein: 180,
    carbs: 260,
    fats: 70,
    effectiveFrom: '2026-07-24T10:00:00.000Z',
  },
  baseRevision: {
    id: 'local-rev-4',
    number: 4,
    createdAt: '2026-07-24T11:00:00.000Z',
  },
  clientTimestamp: '2026-07-24T11:10:00.000Z',
  idempotencyKey: 'nutrition-target-update',
  retryCount: 0,
  status: 'pending',
  metadata: {
    deviceId: 'device-a',
    source: 'local',
  },
};

const remoteOperation: SyncOperation = {
  id: 'remote-nutrition-target',
  entity: 'nutritionTargets',
  entityId,
  action: 'upsert',
  payload: {
    schemaVersion: 1,
    id: entityId,
    calories: 2200,
    protein: 170,
    carbs: 240,
    fats: 65,
    effectiveFrom: '2026-07-24T10:30:00.000Z',
  },
  revision: {
    id: 'remote-rev-5',
    number: 5,
    createdAt: '2026-07-24T11:30:00.000Z',
  },
  metadata: {
    deviceId: 'device-b',
    source: 'remote',
  },
  createdAt: '2026-07-24T11:30:00.000Z',
};

const resolveRemoteDelivery = () =>
  resolveConflicts(
    {},
    [localOperation],
    {
      id: 'remote-batch',
      operations: [remoteOperation],
      createdAt: now,
    },
    now,
  );

describe('sync conflict counting', () => {
  it('keeps duplicate remote delivery cursor-safe after deterministic auto-resolution', async () => {
    const firstDelivery = await resolveRemoteDelivery();
    const duplicateDelivery = await resolveRemoteDelivery();

    expect(firstDelivery.results[0]).toMatchObject({
      outcome: 'autoResolved',
      requiresManualReview: false,
      reason: 'remote version is newer',
    });
    expect(firstDelivery.unresolvedCount).toBe(0);
    expect(duplicateDelivery.unresolvedCount).toBe(0);
    expect(duplicateDelivery.records[0]?.conflictId).toBe(
      firstDelivery.records[0]?.conflictId,
    );
    expect(
      countUnresolvedSyncConflicts({
        localUnresolvedCount: duplicateDelivery.unresolvedCount,
      }),
    ).toBe(0);
  });

  it('ignores terminal server conflict records but counts pending records', () => {
    expect(isUnresolvedSyncConflict({ status: 'pending' })).toBe(true);
    expect(isUnresolvedSyncConflict({ status: 'needsReview' })).toBe(true);
    expect(isUnresolvedSyncConflict({ status: 'autoResolved' })).toBe(false);
    expect(isUnresolvedSyncConflict({ status: 'resolved' })).toBe(false);
    expect(isUnresolvedSyncConflict({ status: 'ignored' })).toBe(false);

    expect(
      countUnresolvedSyncConflicts({
        localUnresolvedCount: 1,
        pushConflicts: [{ status: 'pending' }, { status: 'resolved' }],
        pullConflicts: [{ status: 'autoResolved' }, { status: 'needsReview' }],
      }),
    ).toBe(3);
  });
});
