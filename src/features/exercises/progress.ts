import type { ExerciseHistoryGroup } from './history';

export type ExerciseProgressTrendPoint = {
  key: string;
  finishedAt: string;
  value: number;
};

export type ExerciseProgressMetrics = {
  bestWeight: number;
  bestReps: number;
  totalVolume: number;
  estimatedOneRepMax: number;
  volumeTrend: ExerciseProgressTrendPoint[];
};

export const calculateEstimatedOneRepMax = (weight: number, reps: number) => {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }

  return weight * (1 + reps / 30);
};

export const calculateExerciseProgressMetrics = (
  historyGroups: ExerciseHistoryGroup[],
): ExerciseProgressMetrics => {
  const sets = historyGroups.flatMap((group) => group.sets);
  const totalVolume = sets.reduce((total, set) => total + set.weight * set.reps, 0);
  const estimatedOneRepMax = sets.reduce(
    (best, set) => Math.max(best, calculateEstimatedOneRepMax(set.weight, set.reps)),
    0,
  );
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
      .map((group) => ({
        key: group.sessionId,
        finishedAt: group.finishedAt,
        value: group.sets.reduce((total, set) => total + set.weight * set.reps, 0),
      })),
  };
};
