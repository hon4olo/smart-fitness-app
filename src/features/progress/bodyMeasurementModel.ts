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

const LENGTH_MEASUREMENT_UNITS: readonly BodyMeasurementUnit[] = ['cm', 'in'];
const PERCENT_MEASUREMENT_UNITS: readonly BodyMeasurementUnit[] = ['percent'];

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

export type ResolvedBodyMeasurementValue = {
  numericValue: number;
  unit: BodyMeasurementUnit | null;
  unitLabel: string;
  canonicalNumericValue: number | null;
  canonicalUnit: 'cm' | 'percent' | null;
};

export const getBodyMeasurementUnits = (
  metric: BodyMeasurementMetric,
): readonly BodyMeasurementUnit[] => {
  if (metric === 'body_fat') return PERCENT_MEASUREMENT_UNITS;
  if (metric === 'custom') return BODY_MEASUREMENT_UNITS;
  return LENGTH_MEASUREMENT_UNITS;
};

export const getDefaultBodyMeasurementUnit = (
  metric: BodyMeasurementMetric,
  preferredLengthUnit: 'cm' | 'in' = 'cm',
): BodyMeasurementUnit => (metric === 'body_fat' ? 'percent' : preferredLengthUnit);

export const createBodyMeasurementDraft = (
  preferredLengthUnit: 'cm' | 'in' = 'cm',
): BodyMeasurementDraft => ({
  metric: 'waist',
  customLabel: '',
  value: '',
  unit: preferredLengthUnit,
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

  if (!getBodyMeasurementUnits(input.draft.metric).includes(input.draft.unit)) {
    return { ok: false, message: 'Choose a unit supported by this measurement.' };
  }

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

const inferBodyMeasurementUnit = (value: string): BodyMeasurementUnit | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'cm') return 'cm';
  if (normalized === 'in' || normalized === 'inch' || normalized === 'inches') return 'in';
  if (normalized === '%' || normalized === 'percent' || normalized === 'percentage') return 'percent';
  return null;
};

export const resolveBodyMeasurementStructuredValue = (
  measurement: BodyMeasurement,
): ResolvedBodyMeasurementValue | null => {
  let numericValue: number;
  let unit: BodyMeasurementUnit | null = measurement.unit ?? null;
  let unitLabel = unit ? UNIT_LABELS[unit] : '';

  if (
    typeof measurement.numericValue === 'number' &&
    Number.isFinite(measurement.numericValue)
  ) {
    numericValue = measurement.numericValue;
  } else {
    const match = measurement.value
      .trim()
      .replace(',', '.')
      .match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);
    if (!match) return null;
    numericValue = Number(match[1]);
    if (!Number.isFinite(numericValue)) return null;
    const parsedUnitLabel = match[2]?.trim() ?? '';
    unit = unit ?? inferBodyMeasurementUnit(parsedUnitLabel);
    unitLabel = unit ? UNIT_LABELS[unit] : parsedUnitLabel;
  }

  const canonicalNumericValue =
    unit === 'cm'
      ? numericValue
      : unit === 'in'
        ? numericValue * 2.54
        : unit === 'percent'
          ? numericValue
          : null;
  const canonicalUnit =
    unit === 'cm' || unit === 'in' ? 'cm' : unit === 'percent' ? 'percent' : null;

  return {
    numericValue,
    unit,
    unitLabel,
    canonicalNumericValue,
    canonicalUnit,
  };
};

export const resolveBodyMeasurementNumericValue = (
  measurement: BodyMeasurement,
): { numeric: number; unit: string } | null => {
  const resolved = resolveBodyMeasurementStructuredValue(measurement);
  if (!resolved) return null;
  return { numeric: resolved.numericValue, unit: resolved.unitLabel };
};
