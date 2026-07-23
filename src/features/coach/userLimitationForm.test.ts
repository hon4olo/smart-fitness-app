import { describe, expect, it } from 'vitest';

import {
  buildUserLimitation,
  emptyUserLimitationDraft,
} from './userLimitationForm';

const id = '11111111-1111-4111-8111-111111111111';
const now = '2026-07-23T12:00:00.000Z';

describe('user limitation form', () => {
  it('builds a canonical active limitation without notes or diagnosis fields', () => {
    const result = buildUserLimitation({
      id,
      now,
      draft: {
        ...emptyUserLimitationDraft(),
        kind: 'mobility',
        bodyRegion: 'hip',
        side: 'bilateral',
        severity: 'moderate',
        trainingImpact: 'reduce_load',
        movementPatterns: ['squat', 'hinge', 'squat'],
      },
    });

    expect(result).toEqual({
      ok: true,
      limitation: {
        id,
        kind: 'mobility',
        bodyRegion: 'hip',
        side: 'bilateral',
        severity: 'moderate',
        status: 'active',
        trainingImpact: 'reduce_load',
        movementPatterns: ['hinge', 'squat'],
        onsetDate: null,
        resolvedDate: null,
        createdAt: now,
        updatedAt: now,
      },
    });
    expect(JSON.stringify(result)).not.toContain('notes');
    expect(JSON.stringify(result)).not.toContain('diagnosis');
  });

  it('requires explicit movement patterns for avoid movement', () => {
    expect(
      buildUserLimitation({
        id,
        now,
        draft: {
          ...emptyUserLimitationDraft(),
          trainingImpact: 'avoid_movement',
          movementPatterns: [],
        },
      }),
    ).toEqual({
      ok: false,
      message: 'Choose at least one movement pattern for Avoid movement.',
    });
  });

  it('allows an explicit pause without inventing movement restrictions', () => {
    expect(
      buildUserLimitation({
        id,
        now,
        draft: {
          ...emptyUserLimitationDraft(),
          kind: 'medical_restriction',
          bodyRegion: 'systemic',
          severity: 'severe',
          trainingImpact: 'pause_training',
        },
      }),
    ).toMatchObject({
      ok: true,
      limitation: {
        status: 'active',
        trainingImpact: 'pause_training',
        movementPatterns: [],
      },
    });
  });

  it('rejects an invalid timestamp', () => {
    expect(
      buildUserLimitation({
        id,
        now: 'bad-date',
        draft: emptyUserLimitationDraft(),
      }),
    ).toEqual({ ok: false, message: 'The limitation timestamp is invalid.' });
  });
});
