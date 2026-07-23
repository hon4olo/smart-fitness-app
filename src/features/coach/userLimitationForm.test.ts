import { describe, expect, it } from 'vitest';

import {
  buildUserLimitation,
  emptyUserLimitationDraft,
} from './userLimitationForm';

const id = '11111111-1111-4111-8111-111111111111';
const now = '2026-07-23T12:00:00.000Z';

const validDraft = () => ({
  ...emptyUserLimitationDraft(),
  kind: 'pain' as const,
  bodyRegion: 'shoulder' as const,
  side: 'left' as const,
  severity: 'moderate' as const,
  trainingImpact: 'monitor' as const,
  onsetDate: '2026-07-20',
});

describe('user limitation form', () => {
  it('requires an explicit training impact', () => {
    expect(
      buildUserLimitation({
        draft: { ...validDraft(), trainingImpact: null },
        id,
        now,
      }),
    ).toEqual({
      ok: false,
      message: 'Select an explicit training impact.',
    });
  });

  it('requires movement patterns for avoid-movement limitations', () => {
    expect(
      buildUserLimitation({
        draft: {
          ...validDraft(),
          trainingImpact: 'avoid_movement',
          movementPatterns: [],
        },
        id,
        now,
      }),
    ).toEqual({
      ok: false,
      message: 'Select at least one movement pattern to avoid.',
    });
  });

  it('enforces resolved status and date consistency', () => {
    expect(
      buildUserLimitation({
        draft: { ...validDraft(), status: 'resolved' },
        id,
        now,
      }),
    ).toEqual({
      ok: false,
      message: 'Resolved limitations require a resolved date.',
    });

    expect(
      buildUserLimitation({
        draft: {
          ...validDraft(),
          status: 'resolved',
          resolvedDate: '2026-07-19',
        },
        id,
        now,
      }),
    ).toEqual({
      ok: false,
      message: 'Resolved date cannot be before onset date.',
    });
  });

  it('normalizes movement patterns and preserves creation time when editing', () => {
    const existing = {
      id,
      kind: 'pain' as const,
      bodyRegion: 'shoulder' as const,
      side: 'left' as const,
      severity: 'moderate' as const,
      status: 'active' as const,
      trainingImpact: 'monitor' as const,
      movementPatterns: [],
      onsetDate: '2026-07-20',
      resolvedDate: null,
      createdAt: '2026-07-20T08:00:00.000Z',
      updatedAt: '2026-07-20T08:00:00.000Z',
    };

    expect(
      buildUserLimitation({
        draft: {
          ...validDraft(),
          trainingImpact: 'avoid_movement',
          movementPatterns: ['vertical_push', 'overhead', 'vertical_push'],
          notes: '  Self-reported only.  ',
        },
        id,
        now,
        existing,
      }),
    ).toEqual({
      ok: true,
      limitation: {
        id,
        kind: 'pain',
        bodyRegion: 'shoulder',
        side: 'left',
        severity: 'moderate',
        status: 'active',
        trainingImpact: 'avoid_movement',
        movementPatterns: ['overhead', 'vertical_push'],
        onsetDate: '2026-07-20',
        resolvedDate: null,
        notes: 'Self-reported only.',
        createdAt: '2026-07-20T08:00:00.000Z',
        updatedAt: now,
      },
    });
  });
});
