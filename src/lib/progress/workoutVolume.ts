import type { WorkoutSession } from '@/types';

import { calculateEstimated1RM } from '@/lib/workouts';
import {
  DAY_MS,
  TREND_STABLE_THRESHOLD,
  calculateAverage,
  sortByCreatedAtAsc,
  sortByCreatedAtDesc,
} from '@/lib/progress/formatting';

export type WorkoutVolumePoint = {
  id: string;
  label: string;
  volume: number;
  createdAt: string;
};

export type ExerciseProgression = {
  exerciseName: string;
  lastPerformedAt: string;
  latestWeight: number;
  latestReps: number;
  latestEstimated1RM: number;
  previousEstimated1RM: number | null;
  trendDelta: number | null;
  recentVolume: number;
  totalSets: number;
  daysInactive: number;
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
  const volumeTrend: WorkoutVolumePoint[] = [];

  sessions.forEach((session) => {
    let sessionVolume = 0;
    const perExercise = new Map<string, { topSetWeight: number; topSetReps: number; estimated1RM: number; totalVolume: number }>();

    session.sets.forEach((set) => {
      if (set.weight <= 0 || set.reps <= 0) {
        return;
      }

      sessionVolume += set.weight * set.reps;
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

    volumeTrend.push({
      id: session.id,
      label: session.finishedAt || session.startedAt,
      volume: sessionVolume,
      createdAt: session.finishedAt || session.startedAt,
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

  return { exerciseMap, sessions, volumeTrend };
};

export const getWorkoutVolumeTrend = (workoutSessions: WorkoutSession[]): WorkoutVolumePoint[] => {
  return summarizeExerciseSessions(workoutSessions).volumeTrend
    .filter((point) => point.volume > 0)
    .slice(-10);
};

export const getExerciseProgressions = (workoutSessions: WorkoutSession[], exerciseNames: string[] = []) => {
  const { exerciseMap } = summarizeExerciseSessions(workoutSessions);
  const names = new Set<string>([...exerciseNames, ...exerciseMap.keys()]);

  const progressions: ExerciseProgression[] = [];

  names.forEach((exerciseName) => {
    const points = sortByCreatedAtAsc(exerciseMap.get(exerciseName) ?? []);

    if (points.length === 0) {
      return;
    }

    const latest = points.at(-1)!;
    const previous = points.at(-2) ?? null;
    const trendDelta = previous ? latest.estimated1RM - previous.estimated1RM : null;
    const lastPerformedAt = latest.createdAt;
    const daysInactive = Math.max(0, Math.floor((Date.now() - new Date(lastPerformedAt).getTime()) / DAY_MS));
    const recentVolume = points.slice(-3).reduce((total, point) => total + point.totalVolume, 0);

    progressions.push({
      exerciseName,
      lastPerformedAt,
      latestWeight: latest.topSetWeight,
      latestReps: latest.topSetReps,
      latestEstimated1RM: latest.estimated1RM,
      previousEstimated1RM: previous?.estimated1RM ?? null,
      trendDelta,
      recentVolume,
      totalSets: points.length,
      daysInactive,
    });
  });

  return progressions.sort((left, right) => {
    const deltaLeft = left.trendDelta ?? Number.NEGATIVE_INFINITY;
    const deltaRight = right.trendDelta ?? Number.NEGATIVE_INFINITY;

    if (deltaRight !== deltaLeft) {
      return deltaRight - deltaLeft;
    }

    return new Date(right.lastPerformedAt).getTime() - new Date(left.lastPerformedAt).getTime();
  });
};

export const getImprovingExercises = (workoutSessions: WorkoutSession[], exerciseNames: string[] = []) => {
  return getExerciseProgressions(workoutSessions, exerciseNames)
    .filter((exercise) => exercise.trendDelta !== null && exercise.trendDelta > TREND_STABLE_THRESHOLD)
    .slice(0, 4);
};

export const getInactiveExercises = (workoutSessions: WorkoutSession[], exerciseNames: string[] = []) => {
  return getExerciseProgressions(workoutSessions, exerciseNames)
    .filter((exercise) => exercise.daysInactive >= 14)
    .sort((left, right) => right.daysInactive - left.daysInactive)
    .slice(0, 4);
};
