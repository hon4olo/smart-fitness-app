import { defaultState } from '@/data/defaults';
import type { AppState, FoodEntry, WeightEntry, WorkoutSession } from '@/types';

const START = Date.parse('2026-01-01T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const createFoodEntries = (count: number): FoodEntry[] =>
  Array.from({ length: count }, (_, index) => {
    const createdAt = new Date(START + index * DAY_MS).toISOString();
    return {
      id: `food-${index}`,
      name: `Food ${index}`,
      date: createdAt.slice(0, 10),
      mealType: ['breakfast', 'lunch', 'dinner', 'snack'][index % 4] as FoodEntry['mealType'],
      calories: 200 + (index % 300),
      protein: 20,
      carbs: 30,
      fats: 8,
      source: 'manual',
      servingSize: 100,
      servingUnit: 'g',
      quantity: 1,
      createdAt,
    };
  });

const createWeightEntries = (count: number): WeightEntry[] =>
  Array.from({ length: count }, (_, index) => {
    const createdAt = new Date(START + index * DAY_MS).toISOString();
    return {
      id: `weight-${index}`,
      date: createdAt.slice(0, 10),
      weight: 70 + index * 0.01,
      createdAt,
    };
  });

const createWorkoutSessions = (count: number): WorkoutSession[] =>
  Array.from({ length: count }, (_, index) => {
    const startedAt = new Date(START + index * DAY_MS).toISOString();
    return {
      id: `session-${index}`,
      workoutId: defaultState.workouts[index % defaultState.workouts.length].id,
      workoutTitle: `Workout ${index}`,
      startedAt,
      finishedAt: new Date(Date.parse(startedAt) + 45 * 60 * 1000).toISOString(),
      sets: Array.from({ length: 12 }, (_, setIndex) => ({
        id: `session-${index}-set-${setIndex}`,
        exerciseId: `exercise-${setIndex % 6}`,
        exerciseName: `Exercise ${setIndex % 6}`,
        weight: 40 + setIndex * 2.5,
        reps: 8 + (setIndex % 5),
        completed: true,
      })),
    };
  });

const createState = (counts: {
  foodEntries: number;
  weightEntries: number;
  workoutSessions: number;
}): AppState => ({
  ...defaultState,
  foodEntries: createFoodEntries(counts.foodEntries),
  weightHistory: createWeightEntries(counts.weightEntries),
  workoutSessions: createWorkoutSessions(counts.workoutSessions),
});

export const createRepresentativeAppState = (): AppState =>
  createState({ foodEntries: 180, weightEntries: 180, workoutSessions: 120 });

export const createStressAppState = (): AppState =>
  createState({ foodEntries: 1000, weightEntries: 730, workoutSessions: 500 });
