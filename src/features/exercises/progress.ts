import type { ProgressTrendPoint } from '@/components/progress/ProgressTrendChart';

import type { ExerciseHistoryGroup } from './history';

export type ExerciseProgressMetrics = {
  bestWeight: number;
  bestReps: number;
  totalVolume: number;
  estimatedOneRepMax: number;
  volumeTrend: ProgressTrendPoint[];
};

export const calculateEstimatedOneRepMax = (weight: number, reps: number) => {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }

  return weight * (1 + reps / 30);
};

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));

export const calculateExerciseProgressMetrics = (historyGroups: ExerciseHistoryGroup[]): ExerciseProgressMetrics => {
  const sets = historyGroups.flatMap((group) => group.sets);
  const totalVolume = sets.reduce((total, set) => total + set.weight * set.reps, 0);
  const estimatedOneRepMax = sets.reduce((best, set) => Math.max(best, calculateEstimatedOneRepMax(set.weight, set.reps)), 0);
  const bestWeight = sets.reduce((best, set) => Math.max(best, set.weight), 0);
  const bestReps = sets.reduce((best, set) => Math.max(best, set.reps), 0);

  return {
    bestWeight,
    bestReps,
    totalVolume,
    estimatedOneRepMax,
    volumeTrend: [...historyGroups]
      .reverse()
      .slice(-6)
      .map((group) => {
        const value = group.sets.reduce((total, set) => total + set.weight * set.reps, 0);

        return {
          key: group.sessionId,
          label: formatDateLabel(group.finishedAt),
          value,
          displayValue: Math.round(value).toLocaleString(),
        };
      }),
  };
};
