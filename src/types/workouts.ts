export type Workout = {
  id: string;
  title: string;
  description?: string;
  duration: string;
  exercises: Exercise[];
  createdAt?: string;
  isCustom?: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup?: string;
  notes?: string;
  restSeconds?: number;
  targetReps?: number;
  targetSets?: number;
  isCustom: boolean;
  createdAt: string;
};

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
};

export type WorkoutSession = {
  id: string;
  workoutId: string;
  workoutTitle: string;
  startedAt: string;
  finishedAt: string;
  sets: WorkoutSet[];
};
