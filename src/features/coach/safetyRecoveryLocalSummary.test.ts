import { describe, expect, it } from 'vitest';

import type { RecoveryCheckIn, UserLimitation } from '@/types';
import { buildSafetyRecoveryLocalSummary } from './safetyRecoveryLocalSummary';

const now = '2026-07-23T12:00:00.000Z';

const makeCheckIn = (recordedAt: string): RecoveryCheckIn => ({
  id: '11111111-1111-4111-8111-111111111111',
  recordedAt,
  sleepDurationHours: 7,
  sleepQuality: 4,
  fatigue: null,
  soreness: null,
  stress: null,
  painInterference: null,
  readiness: null,
  createdAt: recordedAt,
  updatedAt: recordedAt,
});

const limitation: UserLimitation = {
  id: '22222222-2222-4222-8222-222222222222',
  kind: 'pain',
  bodyRegion: 'shoulder',
  side: 'left',
  severity: 'moderate',
  status: 'active',
  trainingImpact: 'monitor',
  movementPatterns: [],
  onsetDate: null,
  resolvedDate: null,
  createdAt: now,
  updatedAt: now,
};

describe('Safety Recovery local preflight', () => {
  it('requires a recent check-in before a backend review', () => {
    expect(
      buildSafetyRecoveryLocalSummary({
        recoveryCheckIns: [],
        userLimitations: [],
        now,
      }),
    ).toMatchObject({
      readiness: 'missing_check_in',
      reviewReady: false,
      latestSignalCount: 0,
    });

    expect(
      buildSafetyRecoveryLocalSummary({
        recoveryCheckIns: [makeCheckIn('2026-07-20T11:59:00.000Z')],
        userLimitations: [],
        now,
      }),
    ).toMatchObject({
      readiness: 'stale_check_in',
      reviewReady: false,
      latestCheckInAgeHours: 72.02,
    });
  });

  it('requires at least two explicit recovery signals', () => {
    const checkIn = {
      ...makeCheckIn('2026-07-23T10:00:00.000Z'),
      sleepQuality: null,
    };

    expect(
      buildSafetyRecoveryLocalSummary({
        recoveryCheckIns: [checkIn],
        userLimitations: [],
        now,
      }),
    ).toMatchObject({
      readiness: 'insufficient_signals',
      reviewReady: false,
      latestSignalCount: 1,
    });
  });

  it('uses the latest check-in and counts limitation status without interpreting notes', () => {
    const resolved = {
      ...limitation,
      id: '33333333-3333-4333-8333-333333333333',
      status: 'resolved' as const,
      resolvedDate: '2026-07-22',
      notes: 'This text must not affect readiness.',
    };

    expect(
      buildSafetyRecoveryLocalSummary({
        recoveryCheckIns: [
          makeCheckIn('2026-07-22T08:00:00.000Z'),
          makeCheckIn('2026-07-23T10:00:00.000Z'),
        ],
        userLimitations: [limitation, resolved],
        now,
      }),
    ).toEqual({
      readiness: 'ready',
      reviewReady: true,
      latestCheckInId: '11111111-1111-4111-8111-111111111111',
      latestCheckInAt: '2026-07-23T10:00:00.000Z',
      latestCheckInAgeHours: 2,
      latestSignalCount: 2,
      activeLimitationCount: 1,
      resolvedLimitationCount: 1,
    });
  });
});
