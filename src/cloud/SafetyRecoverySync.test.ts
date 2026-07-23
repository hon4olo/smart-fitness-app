import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import type { RecoveryCheckIn, UserLimitation } from '@/types';
import {
  applyRemoteSafetyRecoveryChanges,
  createRecoveryCheckInQueueOperation,
  createUserLimitationQueueOperation,
} from './SafetyRecoverySync';

const limitationId = '11111111-1111-4111-8111-111111111111';
const checkInId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';
const deviceId = '44444444-4444-4444-8444-444444444444';
const now = '2026-07-23T12:00:00.000Z';

const limitation: UserLimitation = {
  id: limitationId,
  kind: 'pain',
  bodyRegion: 'shoulder',
  side: 'left',
  severity: 'moderate',
  status: 'active',
  trainingImpact: 'avoid_movement',
  movementPatterns: ['overhead', 'vertical_push'],
  onsetDate: '2026-07-20',
  resolvedDate: null,
  notes: 'Self-reported discomfort.',
  createdAt: now,
  updatedAt: now,
};

const checkIn: RecoveryCheckIn = {
  id: checkInId,
  recordedAt: now,
  sleepDurationHours: 6.5,
  sleepQuality: 3,
  fatigue: 4,
  soreness: 2,
  stress: 3,
  painInterference: 1,
  readiness: 2,
  createdAt: now,
  updatedAt: now,
};

describe('Safety Recovery sync contract', () => {
  it('creates a strict limitation payload without ownership fields', () => {
    const operation = createUserLimitationQueueOperation({
      action: 'create',
      limitation,
      actorId: userId,
      deviceId,
      baseRevision: 0,
      now,
    });

    expect(operation.entityType).toBe('userLimitations');
    expect(operation.payload).toEqual({
      schemaVersion: 1,
      id: limitationId,
      kind: 'pain',
      bodyRegion: 'shoulder',
      side: 'left',
      severity: 'moderate',
      status: 'active',
      trainingImpact: 'avoid_movement',
      movementPatterns: ['overhead', 'vertical_push'],
      onsetDate: '2026-07-20',
      resolvedDate: null,
      notes: 'Self-reported discomfort.',
      createdAt: now,
      updatedAt: now,
    });
    expect(JSON.stringify(operation.payload)).not.toContain('userId');
    expect(JSON.stringify(operation.payload)).not.toContain('deviceId');
  });

  it('creates a bounded recovery payload with nullable signals', () => {
    const operation = createRecoveryCheckInQueueOperation({
      action: 'create',
      checkIn,
      actorId: userId,
      deviceId,
      baseRevision: 0,
      now,
    });

    expect(operation.entityType).toBe('recoveryCheckIns');
    expect(operation.payload).toMatchObject({
      schemaVersion: 1,
      id: checkInId,
      recordedAt: now,
      sleepDurationHours: 6.5,
      fatigue: 4,
      readiness: 2,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('applies remote records and preserves revision metadata', () => {
    const result = applyRemoteSafetyRecoveryChanges(
      defaultState,
      [
        {
          entityType: 'userLimitations',
          entityId: limitationId,
          revision: 11,
          operationType: 'create',
          payload: { schemaVersion: 1, ...limitation },
        },
        {
          entityType: 'recoveryCheckIns',
          entityId: checkInId,
          revision: 12,
          operationType: 'create',
          payload: { schemaVersion: 1, ...checkIn },
        },
      ],
      [],
      new Map(),
      '2026-07-23T12:01:00.000Z',
    );

    expect(result.nextState.userLimitations).toEqual([limitation]);
    expect(result.nextState.recoveryCheckIns).toEqual([checkIn]);
    expect(result.appliedRecordIds).toEqual([limitationId, checkInId]);
    expect(result.metadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: limitationId,
          entityType: 'userLimitations',
          revision: 11,
        }),
        expect.objectContaining({
          id: checkInId,
          entityType: 'recoveryCheckIns',
          revision: 12,
        }),
      ]),
    );
  });

  it('applies remote soft deletes to both local collections', () => {
    const state = {
      ...defaultState,
      userLimitations: [limitation],
      recoveryCheckIns: [checkIn],
    };
    const result = applyRemoteSafetyRecoveryChanges(
      state,
      [],
      [
        {
          entityType: 'userLimitations',
          entityId: limitationId,
          revision: 13,
          appliedAt: now,
        },
        {
          entityType: 'recoveryCheckIns',
          entityId: checkInId,
          revision: 14,
          appliedAt: now,
        },
      ],
    );

    expect(result.nextState.userLimitations).toEqual([]);
    expect(result.nextState.recoveryCheckIns).toEqual([]);
    expect(result.deletedRecordIds).toEqual([limitationId, checkInId]);
  });
});
