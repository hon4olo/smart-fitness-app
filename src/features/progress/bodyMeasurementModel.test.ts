import { describe, expect, it } from 'vitest';

import {
  buildBodyMeasurement,
  createBodyMeasurementDraft,
  resolveBodyMeasurementNumericValue,
} from './bodyMeasurementModel';

describe('body measurement model', () => {
  it('builds a typed waist measurement', () => {
    const result = buildBodyMeasurement({
      draft: { ...createBodyMeasurementDraft(), value: '84,5' },
      id: 'measurement-1',
      now: '2026-07-23T18:00:00.000Z',
    });

    expect(result).toEqual({
      ok: true,
      measurement: {
        id: 'measurement-1',
        label: 'Waist',
        value: '84.5 cm',
        metric: 'waist',
        numericValue: 84.5,
        unit: 'cm',
        createdAt: '2026-07-23T18:00:00.000Z',
      },
    });
  });

  it('requires a custom label and validates percentage range', () => {
    expect(
      buildBodyMeasurement({
        draft: { metric: 'custom', customLabel: '', value: '40', unit: 'cm' },
        id: 'measurement-2',
        now: '2026-07-23T18:00:00.000Z',
      }),
    ).toMatchObject({ ok: false });

    expect(
      buildBodyMeasurement({
        draft: { metric: 'body_fat', customLabel: '', value: '101', unit: 'percent' },
        id: 'measurement-3',
        now: '2026-07-23T18:00:00.000Z',
      }),
    ).toEqual({ ok: false, message: 'Body-fat percentage cannot exceed 100%.' });
  });

  it('reads typed values and preserves legacy value strings', () => {
    expect(
      resolveBodyMeasurementNumericValue({
        id: 'typed',
        label: 'Chest',
        value: '100 cm',
        metric: 'chest',
        numericValue: 100,
        unit: 'cm',
        createdAt: '2026-07-23T18:00:00.000Z',
      }),
    ).toEqual({ numeric: 100, unit: 'cm' });

    expect(
      resolveBodyMeasurementNumericValue({
        id: 'legacy',
        label: 'Chest',
        value: '39.5 in',
        createdAt: '2026-07-23T18:00:00.000Z',
      }),
    ).toEqual({ numeric: 39.5, unit: 'in' });
  });
});
