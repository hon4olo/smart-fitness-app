import type { TrainingProgram, TrainingProgramDay, Workout } from '@/types';

import { WEEKDAY_KEYS } from '@/domain/models';

export const DEFAULT_WORKOUT_PROGRAM_ID = 'default-program';

export const buildDefaultTrainingProgramDays = (workouts: Workout[]): TrainingProgramDay[] => {
  return WEEKDAY_KEYS.map((weekday, index) => {
    const workout = workouts[index % Math.max(workouts.length, 1)];
    const isRestDay = index >= workouts.length || workouts.length === 0;

    return {
      id: `${weekday}-${index}`,
      weekday,
      workoutTemplateId: isRestDay ? undefined : workout.id,
      workoutTemplateName: isRestDay ? undefined : workout.title,
      notes: isRestDay ? 'Recovery focus' : undefined,
      restDay: isRestDay,
    } as TrainingProgramDay;
  });
};

export const createDefaultTrainingProgram = (workouts: Workout[]): TrainingProgram => {
  const seededDays = buildDefaultTrainingProgramDays(workouts);

  return {
    id: DEFAULT_WORKOUT_PROGRAM_ID,
    name: 'Strength Program',
    description: 'Structured weekly program built from saved workout templates.',
    goal: 'Strength',
    difficulty: 'intermediate',
    durationWeeks: 8,
    days: seededDays,
    progression: {
      strategy: 'linear progression',
      targetReps: 8,
      targetWeight: undefined,
      rir: 2,
    },
    createdAt: new Date().toISOString(),
    isCustom: false,
  };
};
