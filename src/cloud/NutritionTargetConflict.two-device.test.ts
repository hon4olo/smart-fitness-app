import { describe, expect, it } from 'vitest';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import type { SyncOperation, SyncRevision } from './CloudSyncTypes';
import { resolveConflicts } from './SyncCoordinator';

const entityId = '11111111-1111-4111-8111-111111111111';
const now = '2026-07-24T12:00:00.000Z';

const revision = (id: string, number: number, createdAt: string): SyncRevision => ({
  id,
  number,
  createdAt,
});

const targetsPayload = (
  calories: number,
  protein: number,
  effectiveFrom = '2026-07-24T10:00:00.000Z',
): Record<string, unknown> => ({
  schemaVersion: 1,
  id: entityId,
  calories,
  protein,
  carbs: 260,
  fats: 70,
  effectiveFrom,
});

const localOperation = (
  payload: Record<string, unknown>,
  baseRevision: SyncRevision,
): OfflineSyncQueueOperation => ({
  opId: `nutritionTargets:${entityId}`,
  entityType: 'nutritionTargets',
  entityId,
  action: 'update',
  payload,
  baseRevision,
  clientTimestamp: '2026-07-24T11:00:00.000Z',
  idempotencyKey: 'nutrition-target-update',
  retryCount: 0,
  status: 'pending',
  metadata: {
    deviceId: 'device-a',
    source: 'local',
  },
});

const remoteOperation = (
  payload: Record<string, unknown>,
  remoteRevision: SyncRevision,
): SyncOperation => ({
  id: 'remote-nutrition-target',
  entity: 'nutritionTargets',
  entityId,
  action: 'upsert',
  payload,
  revision: remoteRevision,
  metadata: {
    deviceId: 'device-b',
    source: 'remote',
  },
  createdAt: remoteRevision.createdAt,
});

describe('nutrition target two-device conflict matrix', () => {
  it('does not create a conflict for duplicate delivery of identical targets', async () => {
    const payload = targetsPayload(2400, 180);
    const result = await resolveConflicts(
      {},
      [
        localOperation(
          payload,
          revision('local-base-3', 3, '2026-07-24T10:30:00.000Z'),
        ),
      ],
      {
        id: 'remote-batch',
        operations: [
          remoteOperation(
            payload,
            revision('remote-rev-4', 4, '2026-07-24T11:30:00.000Z'),
          ),
        ],
        createdAt: now,
      },
      now,
    );

    expect(result.records).toEqual([]);
    expect(result.results).toEqual([]);
    expect(result.unresolvedCount).toBe(0);
  });

  it('chooses the remote targets when the remote revision is newer', async () => {
    const localPayload = targetsPayload(2400, 180);
    const remotePayload = targetsPayload(2200, 170);
    const result = await resolveConflicts(
      {},
      [
        localOperation(
          localPayload,
          revision('local-base-3', 3, '2026-07-24T10:30:00.000Z'),
        ),
      ],
      {
        id: 'remote-batch',
        operations: [
          remoteOperation(
            remotePayload,
            revision('remote-rev-4', 4, '2026-07-24T11:30:00.000Z'),
          ),
        ],
        createdAt: now,
      },
      now,
    );

    expect(result.records).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      outcome: 'autoResolved',
      chosenStrategy: 'lastWriteWins',
      resolvedValue: remotePayload,
      requiresManualReview: false,
      reason: 'remote version is newer',
    });
    expect(result.unresolvedCount).toBe(0);
  });

  it('chooses the local targets when the local revision is newer', async () => {
    const localPayload = targetsPayload(2500, 185);
    const remotePayload = targetsPayload(2300, 175);
    const result = await resolveConflicts(
      {},
      [
        localOperation(
          localPayload,
          revision('local-base-6', 6, '2026-07-24T11:40:00.000Z'),
        ),
      ],
      {
        id: 'remote-batch',
        operations: [
          remoteOperation(
            remotePayload,
            revision('remote-rev-5', 5, '2026-07-24T11:30:00.000Z'),
          ),
        ],
        createdAt: now,
      },
      now,
    );

    expect(result.results[0]).toMatchObject({
      outcome: 'autoResolved',
      chosenStrategy: 'lastWriteWins',
      resolvedValue: localPayload,
      reason: 'local version is newer',
    });
  });

  it('uses revision timestamps to break equal revision numbers deterministically', async () => {
    const localPayload = targetsPayload(2450, 182);
    const remotePayload = targetsPayload(2250, 172);
    const result = await resolveConflicts(
      {},
      [
        localOperation(
          localPayload,
          revision('local-rev-7', 7, '2026-07-24T11:20:00.000Z'),
        ),
      ],
      {
        id: 'remote-batch',
        operations: [
          remoteOperation(
            remotePayload,
            revision('remote-rev-7', 7, '2026-07-24T11:21:00.000Z'),
          ),
        ],
        createdAt: now,
      },
      now,
    );

    expect(result.results[0]).toMatchObject({
      outcome: 'autoResolved',
      resolvedValue: remotePayload,
      reason: 'remote version is newer',
    });
  });

  it('uses revision ids as a stable final ordering when number and time match', async () => {
    const localPayload = targetsPayload(2425, 181);
    const remotePayload = targetsPayload(2275, 173);
    const timestamp = '2026-07-24T11:25:00.000Z';
    const result = await resolveConflicts(
      {},
      [localOperation(localPayload, revision('a-local', 8, timestamp))],
      {
        id: 'remote-batch',
        operations: [remoteOperation(remotePayload, revision('z-remote', 8, timestamp))],
        createdAt: now,
      },
      now,
    );

    expect(result.results[0]).toMatchObject({
      outcome: 'autoResolved',
      resolvedValue: remotePayload,
      reason: 'remote version is newer',
    });
  });
});
