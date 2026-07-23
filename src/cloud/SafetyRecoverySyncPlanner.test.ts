import { describe, expect, it } from 'vitest';

import type { SafetyRecoverySyncMetadata } from '@/storage';
import type { RecoveryCheckIn, UserLimitation } from '@/types';
import { planSafetyRecoverySyncOperations } from './SafetyRecoverySyncPlanner';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '99999999-9999-4999-8999-999999999999';
const deviceId = '22222222-2222-4222-8222-222222222222';
const limitationId = '33333333-3333-4333-8333-333333333333';
const checkInId = '44444444-4444-4444-8444-444444444444';

const limitation: UserLimitation = {
  id: limitationId,
  kind: 'mobility',
  bodyRegion: 'hip',
  side: 'bilateral',
  severity: 'moderate',
  status: 'active',
  trainingImpact: 'reduce_load',
  movementPatterns: ['squat'],
  onsetDate: null,
  resolvedDate: null,
  createdAt: '2026-07-20T08:00:00.000Z',
  updatedAt: '2026-07-23T08:00:00.000Z',
};
const checkIn: RecoveryCheckIn = {
  id: checkInId,
  recordedAt: '2026-07-23T07:30:00.000Z',
  sleepDurationHours: 7,
  sleepQuality: 4,
  fatigue: 2,
  soreness: 1,
  stress: 2,
  painInterference: 0,
  readiness: 4,
  createdAt: '2026-07-23T07:30:00.000Z',
  updatedAt: '2026-07-23T07:30:00.000Z',
};

const metadata = (
  entityType: 'userLimitations' | 'recoveryCheckIns',
  snapshot: UserLimitation | RecoveryCheckIn,
  overrides: Partial<SafetyRecoverySyncMetadata> = {},
): SafetyRecoverySyncMetadata => ({
  entityType,
  id: snapshot.id,
  userId,
  revision: 5,
  deviceId,
  createdAt: snapshot.createdAt,
  syncedAt: '2026-07-23T09:00:00.000Z',
  snapshot,
  deletedAt: null,
  ...overrides,
});

describe('Safety Recovery sync planner', () => {
  it('creates operations for unsynchronized local records', () => {
    const operations = planSafetyRecoverySyncOperations({
      userLimitations: [limitation],
      recoveryCheckIns: [checkIn],
      metadata: new Map(),
      pendingOperations: [],
      userId,
      deviceId,
      now: '2026-07-23T10:00:00.000Z',
    });

    expect(operations.map((item) => [item.entityType, item.action])).toEqual([
      ['userLimitations', 'create'],
      ['recoveryCheckIns', 'create'],
    ]);
  });

  it('skips unchanged records and queues offline updates', () => {
    const limitationMetadata = metadata('userLimitations', limitation);
    const checkInMetadata = metadata('recoveryCheckIns', checkIn);
    const metadataMap = new Map([
      [`${userId}:userLimitations:${limitationId}`, limitationMetadata],
      [`${userId}:recoveryCheckIns:${checkInId}`, checkInMetadata],
    ]);

    expect(
      planSafetyRecoverySyncOperations({
        userLimitations: [limitation],
        recoveryCheckIns: [checkIn],
        metadata: metadataMap,
        pendingOperations: [],
        userId,
        deviceId,
      }),
    ).toEqual([]);

    const operations = planSafetyRecoverySyncOperations({
      userLimitations: [{ ...limitation, severity: 'severe' }],
      recoveryCheckIns: [{ ...checkIn, fatigue: 4 }],
      metadata: metadataMap,
      pendingOperations: [],
      userId,
      deviceId,
      now: '2026-07-23T10:00:00.000Z',
    });
    expect(operations.map((item) => item.action)).toEqual(['update', 'update']);
    expect(operations.map((item) => item.baseRevision?.number)).toEqual([5, 5]);
  });

  it('queues deletions for previously synchronized absent records', () => {
    const limitationMetadata = metadata('userLimitations', limitation);
    const checkInMetadata = metadata('recoveryCheckIns', checkIn);
    const operations = planSafetyRecoverySyncOperations({
      userLimitations: [],
      recoveryCheckIns: [],
      metadata: new Map([
        [`${userId}:userLimitations:${limitationId}`, limitationMetadata],
        [`${userId}:recoveryCheckIns:${checkInId}`, checkInMetadata],
      ]),
      pendingOperations: [],
      userId,
      deviceId,
      now: '2026-07-23T10:00:00.000Z',
    });

    expect(operations.map((item) => item.action)).toEqual(['delete', 'delete']);
  });

  it('ignores other-account metadata and existing pending operations', () => {
    const otherMetadata = metadata('userLimitations', limitation, {
      userId: otherUserId,
      revision: 9,
    });
    const initial = planSafetyRecoverySyncOperations({
      userLimitations: [limitation],
      recoveryCheckIns: [],
      metadata: new Map([
        [`${otherUserId}:userLimitations:${limitationId}`, otherMetadata],
      ]),
      pendingOperations: [],
      userId,
      deviceId,
    });
    expect(initial[0]).toMatchObject({ action: 'create', actorId: userId });

    expect(
      planSafetyRecoverySyncOperations({
        userLimitations: [limitation],
        recoveryCheckIns: [],
        metadata: new Map(),
        pendingOperations: initial,
        userId,
        deviceId,
      }),
    ).toEqual([]);
  });
});
