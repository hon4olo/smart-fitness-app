import type { Exercise as DomainExercise } from '@/domain/models';

export type WorkoutRpe = 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10;

export type WorkoutPrescriptionSet = {
  sourceSetId?: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  targetRpe: WorkoutRpe;
  adjustment?: 'decrease' | 'maintain' | 'increase';
  rationaleCode?: string;
};

export type WorkoutCoachMetadata = {
  schemaVersion: 1;
  runId: string;
  sourceSessionId: string;
  strategy: 'deload' | 'maintain' | 'progress';
  confirmedAt: string;
};

export type Workout = {
  id: string;
  title: string;
  description?: string;
  duration: string;
  exercises: Exercise[];
  prescription?: WorkoutPrescriptionSet[];
  coachMetadata?: WorkoutCoachMetadata;
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
  targetRpe?: WorkoutRpe;
  actualRpe?: WorkoutRpe;
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
