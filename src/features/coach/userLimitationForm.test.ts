import { describe, expect, it } from 'vitest';

import {
  buildActiveUserLimitation,
  emptyUserLimitationDraft,
  transitionUserLimitationStatus,
} from './userLimitationForm';

const id = '11111111-1111-4111-8111-111111111111';
const now = '2026-07-23T12:00:00.000Z';

describe('user limitation form', () => {
  it('requires all explicit classification fields', () => {
    expect(
      buildActiveUserLimitation({
        draft: emptyUserLimitationDraft(),
        id,
        now,
      }),
    ).toEqual({ ok: false, message: 'Select a limitation type.' });
  });

  it('requires movement patterns only for avoid-movement impact', () => {
    const draft = {
      ...emptyUserLimitationDraft(),
      kind: 'pain' as const,
      bodyRegion: 'shoulder' as const,
      side: 'right' as const,
      severity: 'moderate' as const,
      trainingImpact: 'avoid_movement' as const,
    };
    expect(buildActiveUserLimitation({ draft, id, now })).toEqual({
      ok: false,
      message: 'Select at least one movement pattern to avoid.',
    });

    expect(
      buildActiveUserLimitation({
        draft: { ...draft, trainingImpact: 'reduce_load' },
        id,
        now,
      }),
    ).toMatchObject({
      ok: true,
      limitation: { trainingImpact: 'reduce_load', movementPatterns: [] },
    });
  });

  it('builds a canonical active limitation and deduplicates movements', () => {
    expect(
      buildActiveUserLimitation({
        draft: {
          kind: 'mobility',
          bodyRegion: 'hip',
          side: 'bilateral',
          severity: 'mild',
          trainingImpact: 'avoid_movement',
          movementPatterns: ['squat', 'lunge', 'squat'],
          onsetDate: '2026-07-20',
        },
        id,
        now,
      }),
    ).toEqual({
      ok: true,
      limitation: {
        id,
        kind: 'mobility',
        bodyRegion: 'hip',
        side: 'bilateral',
        severity: 'mild',
        status: 'active',
        trainingImpact: 'avoid_movement',
        movementPatterns: ['lunge', 'squat'],
        onsetDate: '2026-07-20',
        resolvedDate: null,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  it('rejects future or malformed onset dates', () => {
    const base = {
      ...emptyUserLimitationDraft(),
      kind: 'injury' as const,
      bodyRegion: 'knee' as const,
      side: 'left' as const,
      severity: 'severe' as const,
      trainingImpact: 'pause_training' as const,
    };
    expect(
      buildActiveUserLimitation({
        draft: { ...base, onsetDate: '2026-07-24' },
        id,
        now,
      }),
    ).toEqual({
      ok: false,
      message: 'Onset date must be a valid past or current YYYY-MM-DD date.',
    });
  });

  it('resolves and reactivates without changing the original creation time', () => {
    const created = buildActiveUserLimitation({
      draft: {
        kind: 'pain',
        bodyRegion: 'lower_back',
        side: 'midline',
        severity: 'moderate',
        trainingImpact: 'reduce_load',
        movementPatterns: ['hinge'],
        onsetDate: '2026-07-20',
      },
      id,
      now,
    });
    if (!created.ok) throw new Error('Missing limitation fixture');

    const resolved = transitionUserLimitationStatus({
      limitation: created.limitation,
      status: 'resolved',
      now: '2026-07-24T08:00:00.000Z',
    });
    expect(resolved).toMatchObject({
      ok: true,
      limitation: {
        status: 'resolved',
        resolvedDate: '2026-07-24',
        createdAt: now,
        updatedAt: '2026-07-24T08:00:00.000Z',
      },
    });
    if (!resolved.ok) throw new Error('Missing resolved fixture');

    expect(
      transitionUserLimitationStatus({
        limitation: resolved.limitation,
        status: 'active',
        now: '2026-07-25T08:00:00.000Z',
      }),
    ).toMatchObject({
      ok: true,
      limitation: {
        status: 'active',
        resolvedDate: null,
        createdAt: now,
      },
    });
  });
});
