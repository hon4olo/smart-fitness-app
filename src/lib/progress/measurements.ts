import type { BodyMeasurement, BodyMeasurementUnit } from '@/types';
import {
  formatBodyMeasurementValue,
  getBodyMeasurementKey,
} from '@/features/progress/bodyMeasurementModel';

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
  unit: BodyMeasurementUnit;
  delta: number | null;
  deltaLabel?: string;
  direction: TrendDirection;
  improved: boolean;
  createdAt: string;
};

const isReductionUsuallyPositive = (measurement: BodyMeasurement): boolean =>
  measurement.kind === 'waist' || measurement.kind === 'body_fat';

export const getMeasurementInsights = (
  bodyMeasurements: BodyMeasurement[],
): MeasurementInsight[] => {
  const grouped = sortByCreatedAtAsc(bodyMeasurements).reduce<
    Record<string, BodyMeasurement[]>
  >((groups, measurement) => {
    const key = getBodyMeasurementKey(measurement);
    const nextGroup = groups[key] ?? [];

    return {
      ...groups,
      [key]: [...nextGroup, measurement],
    };
  }, {});

  return Object.values(grouped)
    .map((measurements) => {
      const sorted = sortByCreatedAtAsc(measurements);
      const latest = sorted.at(-1)!;
      const previous = sorted.at(-2);
      const comparable = previous?.unit === latest.unit;
      const delta = comparable && previous ? latest.value - previous.value : null;
      const direction = getTrendDirection(delta);
      const improved =
        delta !== null
          ? isReductionUsuallyPositive(latest)
            ? delta < 0
            : delta > 0
          : false;

      return {
        id: latest.id,
        label: latest.label,
        latestValue: formatBodyMeasurementValue(latest),
        previousValue: previous ? formatBodyMeasurementValue(previous) : undefined,
        unit: latest.unit,
        delta,
        deltaLabel:
          delta === null
            ? undefined
            : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}${
                latest.unit === 'percent' ? ' pp' : ` ${latest.unit}`
              }`,
        direction,
        improved,
        createdAt: latest.createdAt,
      } satisfies MeasurementInsight;
    })
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 6);
};
