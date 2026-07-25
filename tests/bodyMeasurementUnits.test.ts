import { describe, expect, it } from 'vitest';

import {
  buildBodyMeasurement,
  createBodyMeasurementDraft,
  getBodyMeasurementUnits,
  resolveBodyMeasurementStructuredValue,
} from '@/features/progress/bodyMeasurementModel';
import { getMeasurementInsights } from '@/lib/progress/measurements';
import type { BodyMeasurement } from '@/types';

describe('body measurement unit boundaries', () => {
  it('restricts units by metric and follows the preferred length unit for new drafts', () => {
    expect(getBodyMeasurementUnits('waist')).toEqual(['cm', 'in']);
    expect(getBodyMeasurementUnits('body_fat')).toEqual(['percent']);
    expect(getBodyMeasurementUnits('custom')).toEqual(['cm', 'in', 'percent']);
    expect(createBodyMeasurementDraft('in')).toMatchObject({ metric: 'waist', unit: 'in' });
  });

  it('rejects incompatible metric and unit combinations', () => {
    const result = buildBodyMeasurement({
      draft: { metric: 'waist', customLabel: '', value: '15', unit: 'percent' },
      id: 'measurement-1',
      now: '2026-07-25T10:00:00.000Z',
    });

    expect(result).toEqual({ ok: false, message: 'Choose a unit supported by this measurement.' });
  });

  it('normalizes legacy and structured values without discarding their source unit', () => {
    const legacy: BodyMeasurement = {
      id: 'legacy',
      label: 'Waist',
      value: '39.4 in',
      createdAt: '2026-07-25T10:00:00.000Z',
      metric: 'waist',
    };

    expect(resolveBodyMeasurementStructuredValue(legacy)).toMatchObject({
      numericValue: 39.4,
      unit: 'in',
      canonicalUnit: 'cm',
    });
    expect(resolveBodyMeasurementStructuredValue(legacy)?.canonicalNumericValue).toBeCloseTo(100.076, 3);
  });

  it('compares mixed cm and in history in the latest entry unit', () => {
    const measurements: BodyMeasurement[] = [
      {
        id: 'first',
        label: 'Waist',
        value: '100 cm',
        numericValue: 100,
        unit: 'cm',
        metric: 'waist',
        createdAt: '2026-07-20T10:00:00.000Z',
      },
      {
        id: 'latest',
        label: 'Waist',
        value: '39.4 in',
        numericValue: 39.4,
        unit: 'in',
        metric: 'waist',
        createdAt: '2026-07-25T10:00:00.000Z',
      },
    ];

    const [insight] = getMeasurementInsights(measurements);

    expect(insight.latestNumericValue).toBe(39.4);
    expect(insight.latestUnit).toBe('in');
    expect(insight.canonicalUnit).toBe('cm');
    expect(insight.canonicalNumericValue).toBeCloseTo(100.076, 3);
    expect(insight.delta).toBeCloseTo(0.0299, 3);
    expect(insight.deltaLabel).toBe('+0.0 in');
  });
});
