import type { Exercise, WorkoutSession } from '@/types';

import { exerciseCatalogLookup, matchesExerciseQuery } from '@/data/exercises';

export type WorkoutPlanExercise = {
  name: string;
  notes?: string;
  restSeconds?: number;
  targetReps?: number;
  targetSets?: number;
};

const WORKOUT_PLAN_HEADER = 'Workout plan:';

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

export const formatWorkoutPlanExercise = (exercise: WorkoutPlanExercise, index: number) => {
  const targetSets = exercise.targetSets ?? 3;
  const targetReps = exercise.targetReps ?? 8;
  const restSeconds = exercise.restSeconds ?? 90;
  const notes = exercise.notes?.trim();

  return [
    `${index + 1}. ${exercise.name} — ${targetSets} sets x ${targetReps} reps · ${restSeconds} sec rest`,
    notes ? `   Notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');
};

export const formatWorkoutPlanDescription = (baseDescription: string, exercises: WorkoutPlanExercise[]) => {
  const trimmedDescription = baseDescription.trim();

  if (exercises.length === 0) {
    return trimmedDescription;
  }

  const planBlock = [WORKOUT_PLAN_HEADER, ...exercises.map((exercise, index) => formatWorkoutPlanExercise(exercise, index))].join('\n');

  if (!trimmedDescription) {
    return planBlock;
  }

  return `${trimmedDescription}\n\n${planBlock}`;
};

export const parseWorkoutPlanDescription = (description?: string) => {
  const trimmedDescription = description?.trim() ?? '';

  if (!trimmedDescription) {
    return {
      baseDescription: '',
      exercises: [] as WorkoutPlanExercise[],
    };
  }

  const lines = trimmedDescription.split('\n');
  const headerIndex = lines.findIndex((line) => line.trim().toLowerCase() === WORKOUT_PLAN_HEADER.toLowerCase());

  if (headerIndex === -1) {
    return {
      baseDescription: trimmedDescription,
      exercises: [] as WorkoutPlanExercise[],
    };
  }

  const baseDescription = lines.slice(0, headerIndex).join('\n').trim();
  const exercises: WorkoutPlanExercise[] = [];
  const exerciseLinePattern = /^(\d+)\.\s*(.+?)\s+—\s*(\d+)\s+sets?\s*x\s*(\d+)\s+reps?\s+·\s*(\d+)\s+sec\s+rest$/i;

  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      continue;
    }

    const match = line.match(exerciseLinePattern);

    if (match) {
      exercises.push({
        name: match[2].trim(),
        targetSets: Number(match[3]),
        targetReps: Number(match[4]),
        restSeconds: Number(match[5]),
      });
      continue;
    }

    if (line.toLowerCase().startsWith('notes:') && exercises.length > 0) {
      exercises[exercises.length - 1].notes = line.slice(6).trim();
    }
  }

  return {
    baseDescription,
    exercises,
  };
};

export const estimateWorkoutDurationFromPlan = (exercises: WorkoutPlanExercise[]) => {
  if (exercises.length === 0) {
    return '15 min';
  }

  const totalMinutes = exercises.reduce((total, exercise) => {
    const sets = exercise.targetSets ?? 3;
    const reps = exercise.targetReps ?? 8;
    const restSeconds = exercise.restSeconds ?? 90;
    const workMinutes = Math.max(2, Math.round((sets * reps) / 8));
    const restMinutes = Math.round((sets * restSeconds) / 60);

    return total + workMinutes + restMinutes + 2;
  }, 0);

  return `${Math.max(15, totalMinutes)} min`;
};

export const getLatestWorkoutSessionForWorkout = (workoutId: string, sessions: WorkoutSession[]) => {
  return [...sessions]
    .filter((session) => session.workoutId === workoutId)
    .sort((a, b) => getWorkoutTimestamp(a) - getWorkoutTimestamp(b))
    .at(-1);
};

const normalizeWorkoutExerciseName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const resolveExerciseByName = (exerciseName: string, exercises: Exercise[] = []) => {
  const normalizedTarget = normalizeWorkoutExerciseName(exerciseName);
  const byProvidedExercise = exercises.find((exercise) => {
    if (normalizeWorkoutExerciseName(exercise.name) === normalizedTarget) {
      return true;
    }

    if (normalizeWorkoutExerciseName(exercise.id) === normalizedTarget) {
      return true;
    }

    return (exercise.aliases ?? []).some((alias) => normalizeWorkoutExerciseName(alias) === normalizedTarget);
  });

  if (byProvidedExercise) {
    return byProvidedExercise;
  }

  return (
    exerciseCatalogLookup.byName.get(normalizedTarget) ??
    exerciseCatalogLookup.byAlias.get(normalizedTarget) ??
    exerciseCatalogLookup.byId.get(normalizedTarget) ??
    null
  );
};

export const searchExercises = (exercises: Exercise[], query: string) => {
  return exercises.filter((exercise) => matchesExerciseQuery(exercise, query));
};
