import { describe, expect, it } from 'vitest';

import {
  buildRecoveryCheckIn,
  emptyRecoveryCheckInDraft,
} from './recoveryCheckInForm';

const id = '11111111-1111-4111-8111-111111111111';
const now = '2026-07-23T12:00:00.000Z';

describe('recovery check-in form', () => {
  it('requires at least two explicit recovery signals', () => {
    expect(
      buildRecoveryCheckIn({
        draft: { ...emptyRecoveryCheckInDraft(), readiness: 4 },
        id,
        now,
      }),
    ).toEqual({
      ok: false,
      message: 'Add at least two recovery signals before saving.',
    });
  });

  it('rejects invalid sleep duration without coercing it to missing data', () => {
    expect(
      buildRecoveryCheckIn({
        draft: {
          ...emptyRecoveryCheckInDraft(),
          sleepDurationHours: '25',
          fatigue: 3,
        },
        id,
        now,
      }),
    ).toEqual({
      ok: false,
      message: 'Sleep duration must be between 0 and 24 hours.',
    });
  });

  it('normalizes decimal sleep and preserves canonical score values', () => {
    expect(
      buildRecoveryCheckIn({
        draft: {
          ...emptyRecoveryCheckInDraft(),
          sleepDurationHours: '7,55',
          sleepQuality: 4,
          fatigue: 2,
          soreness: 1,
          stress: 3,
          painInterference: 0,
          readiness: 4,
        },
        id,
        now,
      }),
    ).toEqual({
      ok: true,
      signalCount: 7,
      checkIn: {
        id,
        recordedAt: now,
        sleepDurationHours: 7.55,
        sleepQuality: 4,
        fatigue: 2,
        soreness: 1,
        stress: 3,
        painInterference: 0,
        readiness: 4,
        createdAt: now,
        updatedAt: now,
      },
    });
  });
});
