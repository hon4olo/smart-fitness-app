import type { Exercise, Workout, WorkoutSession } from '@/types';

import { exerciseCatalogLookup, exerciseSearchIndex, matchesExerciseQuery } from '@/data/exercises';
import type { WorkoutPlanExercise } from './types';

const WORKOUT_PLAN_HEADER = 'Workout plan:';

const normalizeExerciseText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const toTitleCase = (value: string) =>
  normalizeExerciseText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value)).map((value) => value.trim()).filter(Boolean)));

const getPrimaryExerciseLabels = (exercise: Exercise) =>
  uniqueStrings([exercise.muscleGroup, exercise.category, ...(exercise.primaryMuscles ?? []), ...(exercise.secondaryMuscles ?? [])])
    .map(toTitleCase)
    .filter(Boolean);

const getExerciseSearchScore = (exercise: Exercise, query: string) => {
  const normalizedQuery = normalizeExerciseText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const normalizedName = normalizeExerciseText(exercise.name);
  const normalizedAliases = (exercise.aliases ?? []).map(normalizeExerciseText);
  const normalizedTags = (exercise.tags ?? []).map(normalizeExerciseText);
  const normalizedEquipment = (exercise.equipment ?? []).map(normalizeExerciseText);
  const normalizedPrimaryMuscles = (exercise.primaryMuscles ?? []).map(normalizeExerciseText);
  const normalizedSecondaryMuscles = (exercise.secondaryMuscles ?? []).map(normalizeExerciseText);
  const index = exerciseSearchIndex(exercise);
  const compactHaystack = index.compact.replace(/\s+/g, '');

  let score = 0;

  if (normalizedName === normalizedQuery) {
    score += 220;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    score += 120;
  }

  if (normalizedAliases.some((alias) => alias === normalizedQuery)) {
    score += 180;
  }

  if (normalizedAliases.some((alias) => alias.startsWith(normalizedQuery))) {
    score += 100;
  }

  if (normalizedTags.some((tag) => tag.includes(normalizedQuery))) {
    score += 70;
  }

  if (normalizedEquipment.some((item) => item.includes(normalizedQuery))) {
    score += 65;
  }

  if (normalizedPrimaryMuscles.some((muscle) => muscle.includes(normalizedQuery))) {
    score += 60;
  }

  if (normalizedSecondaryMuscles.some((muscle) => muscle.includes(normalizedQuery))) {
    score += 35;
  }

  if (normalizeExerciseText(exercise.muscleGroup ?? '').includes(normalizedQuery)) {
    score += 50;
  }

  if (compactQuery.length > 0 && compactHaystack.includes(compactQuery)) {
    score += 25;
  }

  if (matchesExerciseQuery(exercise, query)) {
    score += 15;
  }

  return score;
};

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

export const estimateWorkoutDurationMinutesFromPlan = (exercises: WorkoutPlanExercise[]) => {
  if (exercises.length === 0) {
    return 0;
  }

  const totalMinutes = exercises.reduce((total, exercise) => {
    const sets = exercise.targetSets ?? 3;
    const reps = exercise.targetReps ?? 8;
    const restSeconds = exercise.restSeconds ?? 90;
    const workMinutes = Math.max(2, Math.round((sets * reps) / 8));
    const restMinutes = Math.round((sets * restSeconds) / 60);

    return total + workMinutes + restMinutes + 2;
  }, 0);

  return Math.max(15, totalMinutes);
};

export const estimateWorkoutDurationFromPlan = (exercises: WorkoutPlanExercise[]) => {
  if (exercises.length === 0) {
    return '15 min';
  }

  return `${estimateWorkoutDurationMinutesFromPlan(exercises)} min`;
};

export const getLatestWorkoutSessionForWorkout = (workoutId: string, sessions: WorkoutSession[]) => {
  return [...sessions]
    .filter((session) => session.workoutId === workoutId)
    .sort((a, b) => getWorkoutTimestamp(a) - getWorkoutTimestamp(b))
    .at(-1);
};
