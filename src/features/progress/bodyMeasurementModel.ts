import { ensureUuid } from '@/lib/ids';
import type {
  BodyMeasurement,
  BodyMeasurementKind,
  BodyMeasurementUnit,
} from '@/types';

export const BODY_MEASUREMENT_KINDS: readonly BodyMeasurementKind[] = [
  'waist',
  'chest',
  'hips',
  'neck',
  'upper_arm',
  'thigh',
  'calf',
  'body_fat',
  'custom',
];

export const BODY_MEASUREMENT_UNITS: readonly BodyMeasurementUnit[] = [
  'cm',
  'in',
  'percent',
];

const KIND_LABELS: Record<BodyMeasurementKind, string> = {
  waist: 'Waist',
  chest: 'Chest',
  hips: 'Hips',
  neck: 'Neck',
  upper_arm: 'Upper arm',
  thigh: 'Thigh',
  calf: 'Calf',
  body_fat: 'Body fat',
  custom: 'Custom',
};

const LEGACY_KIND_ALIASES: Record<string, BodyMeasurementKind> = {
  waist: 'waist',
  chest: 'chest',
  hips: 'hips',
  hip: 'hips',
  neck: 'neck',
  arm: 'upper_arm',
  arms: 'upper_arm',
  biceps: 'upper_arm',
  'upper arm': 'upper_arm',
  thigh: 'thigh',
  thighs: 'thigh',
  calf: 'calf',
  calves: 'calf',
  'body fat': 'body_fat',
  'body fat percentage': 'body_fat',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isKind = (value: unknown): value is BodyMeasurementKind =>
  typeof value === 'string' &&
  BODY_MEASUREMENT_KINDS.includes(value as BodyMeasurementKind);

const isUnit = (value: unknown): value is BodyMeasurementUnit =>
  typeof value === 'string' &&
  BODY_MEASUREMENT_UNITS.includes(value as BodyMeasurementUnit);

const normalizeLabel = (value: unknown): string =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

const parseLegacyValue = (
  value: unknown,
): { numeric: number; unit: BodyMeasurementUnit | null } | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { numeric: value, unit: null };
  }
  if (typeof value !== 'string') return null;

  const match = value.trim().replace(',', '.').match(/^(-?\d+(?:\.\d+)?)\s*(cm|in|%|percent)?$/i);
  if (!match) return null;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return null;
  const suffix = match[2]?.toLowerCase();
  const unit = suffix === '%' || suffix === 'percent' ? 'percent' : suffix === 'in' ? 'in' : suffix === 'cm' ? 'cm' : null;
  return { numeric, unit };
};

export const getBodyMeasurementLabel = (
  kind: BodyMeasurementKind,
  customLabel?: string,
): string =>
  kind === 'custom' && customLabel?.trim()
    ? customLabel.trim().replace(/\s+/g, ' ')
    : KIND_LABELS[kind];

export const getDefaultBodyMeasurementUnit = (
  kind: BodyMeasurementKind,
): BodyMeasurementUnit => (kind === 'body_fat' ? 'percent' : 'cm');

export const getBodyMeasurementKey = (measurement: BodyMeasurement): string =>
  measurement.kind === 'custom'
    ? `custom:${measurement.label.trim().toLowerCase()}`
    : measurement.kind;

export const formatBodyMeasurementValue = (
  measurement: Pick<BodyMeasurement, 'unit' | 'value'>,
): string => {
  const value = Number.isInteger(measurement.value)
    ? String(measurement.value)
    : measurement.value.toFixed(1).replace(/\.0$/, '');
  return measurement.unit === 'percent' ? `${value}%` : `${value} ${measurement.unit}`;
};

export const createBodyMeasurement = ({
  id,
  kind,
  customLabel,
  value,
  unit,
  createdAt,
}: {
  id?: string;
  kind: BodyMeasurementKind;
  customLabel?: string;
  value: number;
  unit: BodyMeasurementUnit;
  createdAt?: string;
}): BodyMeasurement | null => {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (kind === 'body_fat' && unit !== 'percent') return null;
  if (kind !== 'body_fat' && unit === 'percent' && kind !== 'custom') return null;
  const label = getBodyMeasurementLabel(kind, customLabel);
  if (kind === 'custom' && label === KIND_LABELS.custom) return null;

  const timestamp = createdAt && Number.isFinite(Date.parse(createdAt))
    ? new Date(createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: ensureUuid(id ?? `${timestamp}:${kind}:${value}:${unit}`),
    kind,
    label,
    value,
    unit,
    createdAt: timestamp,
  };
};

export const normalizeBodyMeasurement = (value: unknown): BodyMeasurement | null => {
  if (!isRecord(value)) return null;
  const label = normalizeLabel(value.label);
  const parsedValue = parseLegacyValue(value.value);
  if (!parsedValue) return null;

  const inferredKind = LEGACY_KIND_ALIASES[label.toLowerCase()] ?? 'custom';
  const kind = isKind(value.kind) ? value.kind : inferredKind;
  const unit = isUnit(value.unit)
    ? value.unit
    : parsedValue.unit ?? getDefaultBodyMeasurementUnit(kind);

  return createBodyMeasurement({
    id: typeof value.id === 'string' ? value.id : undefined,
    kind,
    customLabel: kind === 'custom' ? label : undefined,
    value: parsedValue.numeric,
    unit,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : undefined,
  });
};

export const normalizeBodyMeasurementList = (values: unknown): BodyMeasurement[] =>
  (Array.isArray(values) ? values : [])
    .map(normalizeBodyMeasurement)
    .filter((entry): entry is BodyMeasurement => Boolean(entry))
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
