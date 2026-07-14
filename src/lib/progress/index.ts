import type { BodyMeasurement, WorkoutSession, WeightEntry } from '@/types';

export * from './formatting';
export * from './measurements';
export * from './personalRecords';
export * from './weight';
export * from './workoutVolume';

import { getMeasurementInsights } from './measurements';
import { getPersonalRecords } from './personalRecords';
import { getWeightAnalytics } from './weight';
import { getInactiveExercises, getImprovingExercises, getWorkoutVolumeTrend } from './workoutVolume';
import type { PersonalRecordEntry } from './personalRecords';
import type { ExerciseProgression, WorkoutVolumePoint } from './workoutVolume';
import type { MeasurementInsight } from './measurements';
import type { WeightAnalytics } from './weight';

export type ProgressAnalytics = {
  weight: WeightAnalytics;
  measurements: MeasurementInsight[];
  workoutVolumeTrend: WorkoutVolumePoint[];
  improvingExercises: ExerciseProgression[];
  inactiveExercises: ExerciseProgression[];
  latestPrs: PersonalRecordEntry[];
  estimatedNewPrs: PersonalRecordEntry[];
};

export const getProgressAnalytics = (state: {
  bodyMeasurements: BodyMeasurement[];
  exercises: { name: string }[];
  weightHistory: WeightEntry[];
  workoutSessions: WorkoutSession[];
}): ProgressAnalytics => {
  const exerciseNames = state.exercises.map((exercise) => exercise.name);
  const prs = getPersonalRecords(state.workoutSessions, exerciseNames);

  return {
    weight: getWeightAnalytics(state.weightHistory),
    measurements: getMeasurementInsights(state.bodyMeasurements),
    workoutVolumeTrend: getWorkoutVolumeTrend(state.workoutSessions),
    improvingExercises: getImprovingExercises(state.workoutSessions, exerciseNames),
    inactiveExercises: getInactiveExercises(state.workoutSessions, exerciseNames),
    latestPrs: prs.latestPrs,
    estimatedNewPrs: prs.estimatedNewPrs,
  };
};
