import type { WorkoutSet } from '@/context/AppContext';

export type SessionDraftInputs = Record<string, { reps: string; weight: string }>;
export type SessionDraftSet = WorkoutSet;
export type SessionExercise = {
  id: string;
  name: string;
  notes?: string;
  restSeconds?: number;
  targetReps?: number;
  targetSets?: number;
};
