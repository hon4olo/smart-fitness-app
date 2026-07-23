import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import {
  applyRemoteSafetyRecoveryChanges,
  createRecoveryCheckInQueueOperation,
  createUserLimitationQueueOperation,
} from './SafetyRecoverySync';
import type { RecoveryCheckIn, UserLimitation } from '@/types';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const limitationId = '33333333-3333-4333-8333-333333333333';
const checkInId = '44444444-4444-4444-8444-444444444444';

const limitation: UserLimitation = {
  id: limitationId,
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

const checkIn: RecoveryCheckIn = {
  id: checkInId,
  recordedAt: '2026-07-23T07:30:00.000Z',
  sleepDurationHours: 6.5,
  sleepQuality: 3,
  fatigue: 4,
  soreness: 2,
  stress: 3,
  painInterference: 1,
  readiness: 3,
  notes: 'Morning check-in.',
  createdAt: '2026-07-23T07:30:00.000Z',
  updatedAt: '2026-07-23T07:30:00.000Z',
};

describe('Safety Recovery sync', () => {
  it('creates typed limitation and recovery operations without ownership payloads', () => {
    const limitationOperation = createUserLimitationQueueOperation({
      action: 'create',
      limitation,
      userId,
      deviceId,
      baseRevision: 0,
      now: '2026-07-23T09:00:00.000Z',
    });
    const checkInOperation = createRecoveryCheckInQueueOperation({
      action: 'create',
      checkIn,
      userId,
      deviceId,
      baseRevision: 0,
      now: '2026-07-23T09:00:00.000Z',
    });

    expect(limitationOperation).toMatchObject({
      entityType: 'userLimitations',
      entityId: limitationId,
      action: 'create',
      actorId: userId,
      payload: {
        schemaVersion: 1,
        trainingImpact: 'avoid_movement',
        movementPatterns: ['overhead', 'vertical_push'],
      },
    });
    expect(checkInOperation).toMatchObject({
      entityType: 'recoveryCheckIns',
      entityId: checkInId,
      action: 'create',
      actorId: userId,
      payload: {
        schemaVersion: 1,
        fatigue: 4,
        readiness: 3,
      },
    });
    expect(limitationOperation.payload).not.toHaveProperty('userId');
    expect(checkInOperation.payload).not.toHaveProperty('userId');
  });

  it('applies remote snapshots and account-scoped metadata', () => {
    const result = applyRemoteSafetyRecoveryChanges(
      { ...defaultState, userLimitations: [], recoveryCheckIns: [] },
      [
        {
          entityType: 'user_limitations',
          entityId: limitationId,
          revision: 7,
          payload: { ...limitation, schemaVersion: 1, deviceId },
        },
        {
          entityType: 'recovery_check_ins',
          entityId: checkInId,
          revision: 8,
          payload: { ...checkIn, schemaVersion: 1, deviceId },
        },
      ],
      [],
      userId,
      new Map(),
      '2026-07-23T10:00:00.000Z',
    );

    expect(result.nextState.userLimitations).toEqual([limitation]);
    expect(result.nextState.recoveryCheckIns).toEqual([checkIn]);
    expect(result.metadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: 'userLimitations',
          id: limitationId,
          userId,
          revision: 7,
        }),
        expect.objectContaining({
          entityType: 'recoveryCheckIns',
          id: checkInId,
          userId,
          revision: 8,
        }),
      ]),
    );
  });

  it('ignores malformed payloads and applies tombstones', () => {
    const malformed = applyRemoteSafetyRecoveryChanges(
      { ...defaultState, userLimitations: [limitation], recoveryCheckIns: [checkIn] },
      [
        {
          entityType: 'recoveryCheckIns',
          entityId: checkInId,
          revision: 9,
          payload: { ...checkIn, fatigue: 8 },
        },
      ],
      [],
      userId,
    );
    expect(malformed.appliedRecordIds).toEqual([]);
    expect(malformed.nextState.recoveryCheckIns).toEqual([checkIn]);

    const deleted = applyRemoteSafetyRecoveryChanges(
      { ...defaultState, userLimitations: [limitation], recoveryCheckIns: [checkIn] },
      [],
      [
        { entityType: 'userLimitations', entityId: limitationId, revision: 10 },
        { entityType: 'recoveryCheckIns', entityId: checkInId, revision: 11 },
      ],
      userId,
    );
    expect(deleted.nextState.userLimitations).toEqual([]);
    expect(deleted.nextState.recoveryCheckIns).toEqual([]);
    expect(deleted.deletedRecordIds).toEqual([limitationId, checkInId]);
  });
});
