import type { WorkoutSession } from '@/types';

export const getWorkoutTimestamp = (session: { finishedAt?: string; startedAt?: string }) => {
  const source = session.finishedAt ?? session.startedAt;

  if (!source) {
    return 0;
  }

  const parsed = new Date(source);

  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

export const getSessionVolume = (session: WorkoutSession) => {
  return session.sets.reduce((total, set) => total + set.weight * set.reps, 0);
};

export const getSessionExercises = (session: WorkoutSession) => {
  return Array.from(new Set(session.sets.map((set) => set.exerciseName)));
};

export const getLatestWorkoutSession = (sessions: WorkoutSession[]) => {
  return [...sessions].sort((a, b) => getWorkoutTimestamp(a) - getWorkoutTimestamp(b)).at(-1);
};

export const getWeeklyWorkoutCount = (sessions: WorkoutSession[], weekStart: number) => {
  return sessions.filter((session) => getWorkoutTimestamp(session) >= weekStart).length;
};

export const calculateEstimated1RM = (weight: number, reps: number) => {
  return weight * (1 + reps / 30);
};
