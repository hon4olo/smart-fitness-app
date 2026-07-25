import type { BodyMeasurement, BodyMeasurementUnit } from '@/types';

import { resolveBodyMeasurementStructuredValue } from '@/features/progress/bodyMeasurementModel';
import {
  getTrendDirection,
  sortByCreatedAtAsc,
  type TrendDirection,
} from '@/lib/progress/formatting';

export type MeasurementInsight = {
  id: string;
  label: string;
  latestValue: string;
  previousValue?: string;
  latestNumericValue: number | null;
  latestUnit: BodyMeasurementUnit | null;
  previousNumericValue: number | null;
  previousUnit: BodyMeasurementUnit | null;
  canonicalNumericValue: number | null;
  canonicalUnit: 'cm' | 'percent' | null;
  delta: number | null;
  deltaLabel?: string;
  direction: TrendDirection;
  improved: boolean;
  createdAt: string;
};

const measurementGroupKey = (measurement: BodyMeasurement): string =>
  measurement.metric
    ? `${measurement.metric}:${measurement.metric === 'custom' ? measurement.label.trim().toLowerCase() : ''}`
    : measurement.label.trim().toLowerCase();

const convertCanonicalToUnit = (
  canonicalValue: number,
  unit: BodyMeasurementUnit,
): number | null => {
  if (unit === 'cm') return canonicalValue;
  if (unit === 'in') return canonicalValue / 2.54;
  if (unit === 'percent') return canonicalValue;
  return null;
};

export const getMeasurementInsights = (
  bodyMeasurements: BodyMeasurement[],
): MeasurementInsight[] => {
  const grouped = sortByCreatedAtAsc(bodyMeasurements).reduce<
    Record<string, BodyMeasurement[]>
  >((groups, measurement) => {
    const key = measurementGroupKey(measurement);
    const nextGroup = groups[key] ?? [];
    return { ...groups, [key]: [...nextGroup, measurement] };
  }, {});

  return Object.values(grouped)
    .map((measurements) => {
      const sorted = sortByCreatedAtAsc(measurements);
      const latest = sorted.at(-1)!;
      const previous = sorted.at(-2);
      const latestResolved = resolveBodyMeasurementStructuredValue(latest);
      const previousResolved = previous
        ? resolveBodyMeasurementStructuredValue(previous)
        : null;
      const comparable = Boolean(
        latestResolved?.unit &&
          latestResolved.canonicalNumericValue !== null &&
          latestResolved.canonicalUnit &&
          previousResolved &&
          previousResolved.canonicalNumericValue !== null &&
          previousResolved.canonicalUnit === latestResolved.canonicalUnit,
      );
      const previousInLatestUnit = comparable
        ? convertCanonicalToUnit(
            previousResolved!.canonicalNumericValue!,
            latestResolved!.unit!,
          )
        : null;
      const delta =
        previousInLatestUnit !== null && latestResolved
          ? latestResolved.numericValue - previousInLatestUnit
          : null;
      const direction = getTrendDirection(delta);

      return {
        id: latest.id,
        label: latest.label,
        latestValue: latest.value,
        previousValue: previous?.value,
        latestNumericValue: latestResolved?.numericValue ?? null,
        latestUnit: latestResolved?.unit ?? null,
        previousNumericValue: previousResolved?.numericValue ?? null,
        previousUnit: previousResolved?.unit ?? null,
        canonicalNumericValue: latestResolved?.canonicalNumericValue ?? null,
        canonicalUnit: latestResolved?.canonicalUnit ?? null,
        delta,
        deltaLabel:
          delta === null
            ? undefined
            : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}${latestResolved?.unitLabel ? ` ${latestResolved.unitLabel}` : ''}`,
        direction,
        improved: delta !== null ? delta < 0 : false,
        createdAt: latest.createdAt,
      } satisfies MeasurementInsight;
    })
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .slice(0, 6);
};
