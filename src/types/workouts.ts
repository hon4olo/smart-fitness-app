import type { Exercise as DomainExercise } from '@/domain/models';

export type Workout = {
  id: string;
  title: string;
  description?: string;
  duration: string;
  exercises: Exercise[];
  createdAt?: string;
  isCustom?: boolean;
};

export type Exercise = DomainExercise;

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  completed?: boolean;
};

export type WorkoutSession = {
  id: string;
  workoutId: string;
  workoutTitle: string;
  startedAt: string;
  finishedAt: string;
  sets: WorkoutSet[];
  notes?: string;
  photoUri?: string;
};
