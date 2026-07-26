import type { Translate } from '@/localization';
import type { TrainingProgram, Workout } from '@/types';

const DEFAULT_WORKOUT_TITLE_KEYS = {
  'push-a': 'workouts.defaultWorkout.upperBodyStrength',
  'legs-a': 'workouts.defaultWorkout.lowerBody',
  'conditioning-a': 'workouts.defaultWorkout.conditioning',
} as const;

export const getWorkoutsHubWorkoutTitle = (t: Translate, workout: Workout) => {
  const key = DEFAULT_WORKOUT_TITLE_KEYS[workout.id as keyof typeof DEFAULT_WORKOUT_TITLE_KEYS];
  return key ? t(key) : workout.title;
};

export const getWorkoutsHubProgramTitle = (t: Translate, program: TrainingProgram) =>
  program.id === 'default-program' ? t('workouts.defaultProgram.strength') : program.name;
