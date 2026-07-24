import { createExercise } from '@/domain/models';
import type { FoodEntry, Workout, WorkoutSession } from '@/types';

export const NOW = new Date('2026-01-10T12:00:00.000Z');
const NOW_MS = NOW.getTime();
const NOW_ISO = NOW.toISOString();

export const bench = createExercise({
  aliases: ['barbell bench press'],
  createdAt: NOW_ISO,
  id: 'bench',
  muscleGroup: 'chest',
  name: 'Bench Press',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps', 'shoulders'],
  tags: ['push'],
});

export const row = createExercise({
  aliases: ['barbell row'],
  createdAt: NOW_ISO,
  id: 'row',
  muscleGroup: 'back',
  name: 'Barbell Row',
  primaryMuscles: ['back'],
  secondaryMuscles: ['biceps'],
  tags: ['pull'],
});

export const squat = createExercise({
  createdAt: NOW_ISO,
  id: 'squat',
  muscleGroup: 'quads',
  name: 'Squat',
  primaryMuscles: ['quads'],
  secondaryMuscles: ['glutes', 'core'],
  tags: ['legs'],
});

export const rdl = createExercise({
  createdAt: NOW_ISO,
  id: 'rdl',
  muscleGroup: 'hamstrings',
  name: 'Romanian Deadlift',
  primaryMuscles: ['hamstrings'],
  secondaryMuscles: ['glutes', 'back'],
  tags: ['legs'],
});

export const rearDeltFly = createExercise({
  aliases: ['rear delt raise'],
  createdAt: NOW_ISO,
  id: 'rear-delt-fly',
  muscleGroup: 'shoulders',
  name: 'Rear Delt Fly',
  primaryMuscles: ['shoulders'],
  secondaryMuscles: ['rear delts'],
  tags: ['pull'],
});

export const chestWorkout: Workout = {
  createdAt: NOW_ISO,
  description: 'Chest emphasis session',
  duration: '45 min',
  exercises: [bench],
  id: 'push',
  title: 'Push Day',
};

export const backWorkout: Workout = {
  createdAt: NOW_ISO,
  description: 'Back emphasis session',
  duration: '45 min',
  exercises: [row],
  id: 'pull',
  title: 'Pull Day',
};

export const legWorkout: Workout = {
  createdAt: NOW_ISO,
  description: 'Lower body session',
  duration: '50 min',
  exercises: [squat, rdl],
  id: 'legs',
  title: 'Leg Day',
};

const makeSet = (
  exerciseName: string,
  exerciseId: string,
  weight: number,
  reps: number,
  index: number,
) => ({
  exerciseId,
  exerciseName,
  id: `${exerciseId}-${index}`,
  reps,
  weight,
});

export const makeSession = ({
  hoursAgo,
  id,
  sets,
  workout,
}: {
  hoursAgo: number;
  id: string;
  sets: number;
  workout: Workout;
}): WorkoutSession => {
  const finishedAt = new Date(NOW_MS - hoursAgo * 60 * 60 * 1000).toISOString();
  const startedAt = new Date(NOW_MS - (hoursAgo + 1) * 60 * 60 * 1000).toISOString();

  return {
    finishedAt,
    id,
    sets: Array.from({ length: sets }, (_, index) =>
      makeSet(
        workout.exercises[0].name,
        workout.exercises[0].id,
        100,
        8,
        index + 1,
      ),
    ),
    startedAt,
    workoutId: workout.id,
    workoutTitle: workout.title,
  };
};

export const makeFoodEntry = (
  mealType: FoodEntry['mealType'],
  calories: number,
  protein: number,
  carbs: number,
  fats: number,
  id: string,
): FoodEntry => ({
  calories,
  carbs,
  createdAt: NOW_ISO,
  date: '2026-01-10',
  fats,
  id,
  mealType,
  name: `${mealType}-${id}`,
  source: 'manual',
  protein,
});