import type { WorkoutSession, WorkoutSet } from '@/types';

export type ExerciseHistorySet = WorkoutSet & {
  workoutId: string;
  workoutTitle: string;
  finishedAt: string;
};

export type ExerciseHistoryGroup = {
  sessionId: string;
  workoutId: string;
  workoutTitle: string;
  finishedAt: string;
  sets: ExerciseHistorySet[];
};

export const selectCompletedSetsByExerciseId = (sessions: WorkoutSession[], exerciseId: string): ExerciseHistoryGroup[] => {
  return [...sessions]
    .sort((left, right) => new Date(right.finishedAt).getTime() - new Date(left.finishedAt).getTime())
    .map((session) => {
      const sets = session.sets
        .filter((set) => set.exerciseId === exerciseId && set.completed !== false)
        .map((set) => ({
          ...set,
          workoutId: session.workoutId,
          workoutTitle: session.workoutTitle,
          finishedAt: session.finishedAt,
        }));

      return {
        sessionId: session.id,
        workoutId: session.workoutId,
        workoutTitle: session.workoutTitle,
        finishedAt: session.finishedAt,
        sets,
      };
    })
    .filter((group) => group.sets.length > 0);
};
