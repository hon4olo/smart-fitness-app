import type { BodyMeasurement } from '@/types';

import { resolveBodyMeasurementNumericValue } from '@/features/progress/bodyMeasurementModel';
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
      const latestParsed = resolveBodyMeasurementNumericValue(latest);
      const previousParsed = previous
        ? resolveBodyMeasurementNumericValue(previous)
        : null;
      const comparable =
        latestParsed &&
        previousParsed &&
        latestParsed.unit === previousParsed.unit;
      const delta = comparable
        ? latestParsed.numeric - previousParsed.numeric
        : null;
      const direction = getTrendDirection(delta);

      return {
        id: latest.id,
        label: latest.label,
        latestValue: latest.value,
        previousValue: previous?.value,
        delta,
        deltaLabel:
          delta === null
            ? undefined
            : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}${latestParsed?.unit ? ` ${latestParsed.unit}` : ''}`,
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
