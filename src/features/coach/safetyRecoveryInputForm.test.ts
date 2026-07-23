import { describe, expect, it } from 'vitest';

import {
  createRecoveryCheckInFromForm,
  createUserLimitationFromForm,
} from './safetyRecoveryInputForm';

const id = '11111111-1111-4111-8111-111111111111';
const now = '2026-07-23T12:00:00.000Z';

describe('Safety Recovery input boundary', () => {
  it('creates a bounded recovery check-in without free-text fields', () => {
    const result = createRecoveryCheckInFromForm({
      id,
      now,
      form: {
        sleepDurationHours: '7.5',
        fatigue: 3,
        soreness: 2,
        readiness: 4,
      },
    });

    expect(result).toEqual({
      ok: true,
      value: {
        id,
        recordedAt: now,
        sleepDurationHours: 7.5,
        sleepQuality: null,
        fatigue: 3,
        soreness: 2,
        stress: null,
        painInterference: null,
        readiness: 4,
        createdAt: now,
        updatedAt: now,
      },
    });
    expect(JSON.stringify(result)).not.toContain('notes');
  });

  it('rejects invalid sleep duration', () => {
    expect(
      createRecoveryCheckInFromForm({
        id,
        now,
        form: {
          sleepDurationHours: '25',
          fatigue: 3,
          soreness: 2,
          readiness: 4,
        },
      }),
    ).toEqual({
      ok: false,
      error: 'Sleep duration must be between 0 and 24 hours.',
    });
  });

  it('requires an explicit movement for avoid-movement limitations', () => {
    expect(
      createUserLimitationFromForm({
        id,
        now,
        form: {
          kind: 'pain',
          bodyRegion: 'shoulder',
          side: 'right',
          severity: 'moderate',
          trainingImpact: 'avoid_movement',
          movementPatterns: [],
        },
      }),
    ).toEqual({
      ok: false,
      error: 'Choose at least one movement pattern for Avoid movement.',
    });
  });

  it('deduplicates explicit movement patterns and never infers a diagnosis', () => {
    const result = createUserLimitationFromForm({
      id,
      now,
      form: {
        kind: 'mobility',
        bodyRegion: 'hip',
        side: 'bilateral',
        severity: 'mild',
        trainingImpact: 'reduce_load',
        movementPatterns: ['squat', 'squat', 'hinge'],
      },
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        kind: 'mobility',
        bodyRegion: 'hip',
        trainingImpact: 'reduce_load',
        movementPatterns: ['hinge', 'squat'],
      },
    });
    expect(JSON.stringify(result)).not.toContain('diagnosis');
    expect(JSON.stringify(result)).not.toContain('notes');
  });
});
