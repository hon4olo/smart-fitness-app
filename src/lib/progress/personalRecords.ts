import type { WorkoutSession } from '@/types';

import { calculateAverage, sortByCreatedAtAsc, sortByCreatedAtDesc, TREND_STABLE_THRESHOLD, DAY_MS } from '@/lib/progress/formatting';
import { calculateEstimated1RM } from '@/lib/workouts';

export type PersonalRecordEntry = {
  id: string;
  createdAt: string;
  exerciseName: string;
  label: string;
  value: string;
  deltaLabel?: string;
  kind: 'latest' | 'estimated';
};

type ExerciseSessionPoint = {
  createdAt: string;
  estimated1RM: number;
  totalVolume: number;
  topSetWeight: number;
  topSetReps: number;
};

const summarizeExerciseSessions = (workoutSessions: WorkoutSession[]) => {
  const sessions = sortByCreatedAtAsc(workoutSessions.map((session) => ({ ...session, createdAt: session.finishedAt || session.startedAt })));
  const exerciseMap = new Map<string, ExerciseSessionPoint[]>();

  sessions.forEach((session) => {
    const perExercise = new Map<string, { topSetWeight: number; topSetReps: number; estimated1RM: number; totalVolume: number }>();

    session.sets.forEach((set) => {
      if (set.weight <= 0 || set.reps <= 0) {
        return;
      }

      const estimated1RM = calculateEstimated1RM(set.weight, set.reps);
      const previous = perExercise.get(set.exerciseName);

      if (!previous || estimated1RM > previous.estimated1RM) {
        perExercise.set(set.exerciseName, {
          topSetWeight: set.weight,
          topSetReps: set.reps,
          estimated1RM,
          totalVolume: (previous?.totalVolume ?? 0) + set.weight * set.reps,
        });
      } else {
        perExercise.set(set.exerciseName, {
          ...previous,
          totalVolume: previous.totalVolume + set.weight * set.reps,
        });
      }
    });

    perExercise.forEach((point, exerciseName) => {
      const current = exerciseMap.get(exerciseName) ?? [];
      current.push({
        createdAt: session.finishedAt || session.startedAt,
        estimated1RM: point.estimated1RM,
        totalVolume: point.totalVolume,
        topSetWeight: point.topSetWeight,
        topSetReps: point.topSetReps,
      });
      exerciseMap.set(exerciseName, current);
    });
  });

  return { exerciseMap, sessions };
};

export const getPersonalRecords = (workoutSessions: WorkoutSession[], exerciseNames: string[] = []) => {
  const { exerciseMap } = summarizeExerciseSessions(workoutSessions);
  const names = new Set<string>([...exerciseNames, ...exerciseMap.keys()]);
  const latestPrs: PersonalRecordEntry[] = [];
  const estimatedNewPrs: PersonalRecordEntry[] = [];

  names.forEach((exerciseName) => {
    const points = sortByCreatedAtAsc(exerciseMap.get(exerciseName) ?? []);

    if (points.length === 0) {
      return;
    }

    let bestWeight = 0;
    let bestVolume = 0;
    let best1RM = 0;

    points.forEach((point) => {
      const pointVolume = point.totalVolume;
      const point1RM = point.estimated1RM;

      if (point.topSetWeight > bestWeight) {
        bestWeight = point.topSetWeight;
        latestPrs.push({
          id: `${exerciseName}-weight-${point.createdAt}`,
          createdAt: point.createdAt,
          exerciseName,
          label: 'New weight PR',
          value: `${point.topSetWeight.toFixed(1)} kg`,
          kind: 'latest',
        });
      }

      if (pointVolume > bestVolume) {
        bestVolume = pointVolume;
        latestPrs.push({
          id: `${exerciseName}-volume-${point.createdAt}`,
          createdAt: point.createdAt,
          exerciseName,
          label: 'New volume PR',
          value: `${pointVolume.toLocaleString()} kg`,
          kind: 'latest',
        });
      }

      if (point1RM > best1RM) {
        best1RM = point1RM;
        latestPrs.push({
          id: `${exerciseName}-1rm-${point.createdAt}`,
          createdAt: point.createdAt,
          exerciseName,
          label: 'New estimated 1RM PR',
          value: `${point1RM.toFixed(1)} kg`,
          kind: 'estimated',
        });
      }
    });

    const recentDeltas = points.slice(-3).map((point, index, array) => {
      if (index === 0) {
        return 0;
      }

      return point.estimated1RM - array[index - 1].estimated1RM;
    });
    const averageDelta = calculateAverage(recentDeltas.slice(1));

    if (averageDelta !== null && averageDelta > TREND_STABLE_THRESHOLD) {
      const projected = points.at(-1)!.estimated1RM + averageDelta;

      estimatedNewPrs.push({
        id: `${exerciseName}-projection`,
        createdAt: points.at(-1)!.createdAt,
        exerciseName,
        label: 'Projected next 1RM PR',
        value: `${projected.toFixed(1)} kg`,
        deltaLabel: `+${averageDelta.toFixed(1)} kg trend`,
        kind: 'estimated',
      });
    }
  });

  const latestRecords = sortByCreatedAtDesc(latestPrs).slice(0, 6);
  const projectedRecords = sortByCreatedAtDesc(estimatedNewPrs).slice(0, 4);

  return {
    latestPrs: latestRecords,
    estimatedNewPrs: projectedRecords,
  };
};
