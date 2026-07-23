import { describe, expect, it } from 'vitest';

import { getMeasurementInsights } from '@/lib/progress/measurements';

import {
  createBodyMeasurement,
  formatBodyMeasurementValue,
  normalizeBodyMeasurementList,
} from './bodyMeasurementModel';

describe('typed body measurement model', () => {
  it('migrates legacy labels and string values into typed entries', () => {
    const entries = normalizeBodyMeasurementList([
      {
        id: 'legacy-waist',
        label: ' Waist ',
        value: '84 cm',
        createdAt: '2026-07-20T10:00:00.000Z',
      },
      {
        id: 'legacy-fat',
        label: 'Body fat',
        value: '14.5%',
        createdAt: '2026-07-21T10:00:00.000Z',
      },
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      kind: 'body_fat',
      label: 'Body fat',
      unit: 'percent',
      value: 14.5,
    });
    expect(entries[1]).toMatchObject({
      kind: 'waist',
      label: 'Waist',
      unit: 'cm',
      value: 84,
    });
  });

  it('keeps unknown legacy labels as typed custom measurements', () => {
    expect(
      normalizeBodyMeasurementList([
        {
          id: 'legacy-shoulders',
          label: 'Shoulders',
          value: '121.5 cm',
          createdAt: '2026-07-21T10:00:00.000Z',
        },
      ])[0],
    ).toMatchObject({
      kind: 'custom',
      label: 'Shoulders',
      unit: 'cm',
      value: 121.5,
    });
  });

  it('rejects invalid values and incompatible units', () => {
    expect(
      createBodyMeasurement({ kind: 'body_fat', value: 15, unit: 'cm' }),
    ).toBeNull();
    expect(
      createBodyMeasurement({ kind: 'waist', value: 0, unit: 'cm' }),
    ).toBeNull();
    expect(
      createBodyMeasurement({ kind: 'custom', value: 40, unit: 'cm' }),
    ).toBeNull();
  });

  it('compares only matching typed units and formats percentage deltas as points', () => {
    const entries = [
      createBodyMeasurement({
        id: 'fat-old',
        kind: 'body_fat',
        value: 15.5,
        unit: 'percent',
        createdAt: '2026-07-01T10:00:00.000Z',
      }),
      createBodyMeasurement({
        id: 'fat-new',
        kind: 'body_fat',
        value: 14,
        unit: 'percent',
        createdAt: '2026-07-20T10:00:00.000Z',
      }),
    ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const insight = getMeasurementInsights(entries)[0];
    expect(insight).toMatchObject({
      label: 'Body fat',
      latestValue: '14%',
      delta: -1.5,
      deltaLabel: '-1.5 pp',
      improved: true,
    });
    expect(formatBodyMeasurementValue(entries[0])).toBe('15.5%');
  });
});
