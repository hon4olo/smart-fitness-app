import type {
  BodyMeasurement,
  BodyMeasurementMetric,
  BodyMeasurementUnit,
} from '@/types';

export type BodyMeasurementMetricOption = {
  label: string;
  metric: BodyMeasurementMetric;
  defaultUnit: BodyMeasurementUnit;
};

export const BODY_MEASUREMENT_METRICS: readonly BodyMeasurementMetricOption[] = [
  { label: 'Waist', metric: 'waist', defaultUnit: 'cm' },
  { label: 'Chest', metric: 'chest', defaultUnit: 'cm' },
  { label: 'Hips', metric: 'hips', defaultUnit: 'cm' },
  { label: 'Shoulders', metric: 'shoulders', defaultUnit: 'cm' },
  { label: 'Neck', metric: 'neck', defaultUnit: 'cm' },
  { label: 'Upper arm', metric: 'upper_arm', defaultUnit: 'cm' },
  { label: 'Thigh', metric: 'thigh', defaultUnit: 'cm' },
  { label: 'Calf', metric: 'calf', defaultUnit: 'cm' },
  { label: 'Body fat', metric: 'body_fat', defaultUnit: 'percent' },
  { label: 'Custom', metric: 'custom', defaultUnit: 'cm' },
];

export const BODY_MEASUREMENT_UNITS: readonly BodyMeasurementUnit[] = [
  'cm',
  'in',
  'percent',
];

const UNIT_LABELS: Record<BodyMeasurementUnit, string> = {
  cm: 'cm',
  in: 'in',
  percent: '%',
};

export type BodyMeasurementDraft = {
  metric: BodyMeasurementMetric;
  customLabel: string;
  value: string;
  unit: BodyMeasurementUnit;
};

export const createBodyMeasurementDraft = (): BodyMeasurementDraft => ({
  metric: 'waist',
  customLabel: '',
  value: '',
  unit: 'cm',
});

export const getBodyMeasurementLabel = (
  metric: BodyMeasurementMetric,
  customLabel: string,
): string => {
  if (metric === 'custom') return customLabel.trim();
  return BODY_MEASUREMENT_METRICS.find((option) => option.metric === metric)?.label ?? metric;
};

export const formatBodyMeasurementValue = (
  numericValue: number,
  unit: BodyMeasurementUnit,
): string => `${numericValue.toFixed(Number.isInteger(numericValue) ? 0 : 1)} ${UNIT_LABELS[unit]}`;

export const buildBodyMeasurement = (input: {
  draft: BodyMeasurementDraft;
  id: string;
  now: string;
}): { ok: true; measurement: BodyMeasurement } | { ok: false; message: string } => {
  const label = getBodyMeasurementLabel(input.draft.metric, input.draft.customLabel);
  if (!label) return { ok: false, message: 'Enter a custom measurement label.' };

  const normalized = input.draft.value.trim().replace(',', '.');
  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return { ok: false, message: 'Enter a measurement greater than zero.' };
  }
  if (input.draft.unit === 'percent' && numericValue > 100) {
    return { ok: false, message: 'Body-fat percentage cannot exceed 100%.' };
  }
  if (input.draft.unit !== 'percent' && numericValue > 500) {
    return { ok: false, message: 'Measurement is outside the supported range.' };
  }
  const timestamp = new Date(input.now);
  if (!Number.isFinite(timestamp.getTime())) {
    return { ok: false, message: 'Measurement timestamp is invalid.' };
  }

  return {
    ok: true,
    measurement: {
      id: input.id,
      label,
      value: formatBodyMeasurementValue(numericValue, input.draft.unit),
      metric: input.draft.metric,
      numericValue,
      unit: input.draft.unit,
      createdAt: timestamp.toISOString(),
    },
  };
};

export const resolveBodyMeasurementNumericValue = (
  measurement: BodyMeasurement,
): { numeric: number; unit: string } | null => {
  if (
    typeof measurement.numericValue === 'number' &&
    Number.isFinite(measurement.numericValue) &&
    measurement.unit
  ) {
    return {
      numeric: measurement.numericValue,
      unit: UNIT_LABELS[measurement.unit],
    };
  }

  const match = measurement.value.trim().replace(',', '.').match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return null;
  return { numeric, unit: match[2]?.trim() ?? '' };
};
