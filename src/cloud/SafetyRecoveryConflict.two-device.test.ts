import { describe, expect, it } from 'vitest';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { createConflictPolicyRegistry } from './CloudConflictPolicies';
import { createConflictResolver } from './CloudConflictResolver';
import type { SyncOperation } from './CloudSyncTypes';
import { resolveConflicts } from './SyncCoordinator';

const now = '2026-07-24T12:00:00.000Z';

const revision = (id: string, number: number, createdAt: string) => ({
  id,
  number,
  createdAt,
});

const baseLimitation = {
  id: 'limitation-a',
  schemaVersion: 1,
  kind: 'pain',
  bodyRegion: 'shoulder',
  side: 'right',
  severity: 'moderate',
  status: 'active',
  trainingImpact: 'avoid_movement',
  movementPatterns: ['overhead', 'vertical_push'],
  onsetDate: '2026-07-20',
  resolvedDate: null,
  notes: 'Self-reported discomfort.',
  createdAt: '2026-07-20T08:00:00.000Z',
  updatedAt: '2026-07-23T08:00:00.000Z',
};

const checkInPayload = (
  id: string,
  fatigue: number,
): Record<string, unknown> => ({
  id,
  schemaVersion: 1,
  recordedAt: '2026-07-24T07:30:00.000Z',
  sleepDurationHours: 7,
  sleepQuality: 4,
  fatigue,
  soreness: 2,
  stress: 3,
  painInterference: 1,
  readiness: 3,
  notes: 'Morning check-in.',
  createdAt: '2026-07-24T07:30:00.000Z',
  updatedAt: '2026-07-24T07:30:00.000Z',
});

const localRecoveryOperation = (
  entityId: string,
  payload: Record<string, unknown>,
): OfflineSyncQueueOperation => ({
  opId: `recoveryCheckIns:${entityId}`,
  entityType: 'recoveryCheckIns',
  entityId,
  action: 'update',
  payload,
  baseRevision: revision('local-base-2', 2, '2026-07-24T10:30:00.000Z'),
  clientTimestamp: '2026-07-24T11:00:00.000Z',
  idempotencyKey: `recovery-${entityId}`,
  retryCount: 0,
  status: 'pending',
  metadata: {
    deviceId: 'device-a',
    source: 'local',
  },
});

const remoteRecoveryOperation = (
  entityId: string,
  payload: Record<string, unknown>,
): SyncOperation => ({
  id: `remote-${entityId}`,
  entity: 'recoveryCheckIns',
  entityId,
  action: 'upsert',
  payload,
  revision: revision('remote-rev-3', 3, '2026-07-24T11:30:00.000Z'),
  metadata: {
    deviceId: 'device-b',
    source: 'remote',
  },
  createdAt: '2026-07-24T11:30:00.000Z',
});

describe('safety and recovery two-device conflict matrix', () => {
  it('registers explicit limitation and recovery policies', () => {
    const registry = createConflictPolicyRegistry();

    expect(registry.getPolicy('userLimitations')).toMatchObject({
      strategy: 'mergeFields',
      allowDeleteStrategy: 'manualReview',
    });
    expect(registry.getPolicy('recoveryCheckIns')).toMatchObject({
      strategy: 'appendUnion',
      allowDeleteStrategy: 'manualReview',
    });
  });

  it('merges independent edits to a user limitation', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'userLimitations',
      entityId: baseLimitation.id,
      baseVersion: baseLimitation,
      localVersion: {
        ...baseLimitation,
        severity: 'severe',
      },
      remoteVersion: {
        ...baseLimitation,
        notes: 'Avoid painful range and reassess tomorrow.',
      },
      localRevision: revision('device-a-rev-2', 2, '2026-07-24T10:00:00.000Z'),
      remoteRevision: revision('device-b-rev-2', 2, '2026-07-24T10:01:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.requiresManualReview).toBe(false);
    expect(result.resolvedValue).toEqual({
      ...baseLimitation,
      severity: 'severe',
      notes: 'Avoid painful range and reassess tomorrow.',
    });
  });

  it('requires review when both devices edit the same limitation field', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'userLimitations',
      entityId: baseLimitation.id,
      baseVersion: baseLimitation,
      localVersion: {
        ...baseLimitation,
        trainingImpact: 'reduce_load',
      },
      remoteVersion: {
        ...baseLimitation,
        trainingImpact: 'stop_training',
      },
      localRevision: revision('device-a-rev-3', 3, '2026-07-24T10:02:00.000Z'),
      remoteRevision: revision('device-b-rev-3', 3, '2026-07-24T10:03:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
    expect(result.conflictingFields).toContain('trainingImpact');
  });

  it('does not conflict when devices append different recovery check-ins', async () => {
    const localId = '11111111-1111-4111-8111-111111111111';
    const remoteId = '22222222-2222-4222-8222-222222222222';
    const result = await resolveConflicts(
      {},
      [localRecoveryOperation(localId, checkInPayload(localId, 3))],
      {
        id: 'remote-batch',
        operations: [remoteRecoveryOperation(remoteId, checkInPayload(remoteId, 2))],
        createdAt: now,
      },
      now,
    );

    expect(result.records).toEqual([]);
    expect(result.results).toEqual([]);
    expect(result.unresolvedCount).toBe(0);
  });

  it('does not conflict on duplicate delivery of the same recovery snapshot', async () => {
    const entityId = '33333333-3333-4333-8333-333333333333';
    const payload = checkInPayload(entityId, 3);
    const result = await resolveConflicts(
      {},
      [localRecoveryOperation(entityId, payload)],
      {
        id: 'remote-batch',
        operations: [remoteRecoveryOperation(entityId, payload)],
        createdAt: now,
      },
      now,
    );

    expect(result.records).toEqual([]);
    expect(result.unresolvedCount).toBe(0);
  });

  it('keeps divergent edits to the same recovery check-in visible', async () => {
    const entityId = '44444444-4444-4444-8444-444444444444';
    const result = await resolveConflicts(
      {},
      [localRecoveryOperation(entityId, checkInPayload(entityId, 4))],
      {
        id: 'remote-batch',
        operations: [remoteRecoveryOperation(entityId, checkInPayload(entityId, 2))],
        createdAt: now,
      },
      now,
    );

    expect(result.records).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      outcome: 'needsReview',
      chosenStrategy: 'appendUnion',
      conflictingFields: ['root'],
      requiresManualReview: true,
    });
    expect(result.unresolvedCount).toBe(1);
  });
});
