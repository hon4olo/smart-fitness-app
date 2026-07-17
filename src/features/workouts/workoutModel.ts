import type { Exercise, TrainingProgram, Workout, WorkoutSession } from '@/types';

import { exerciseCatalogLookup, exerciseSearchIndex, matchesExerciseQuery } from '@/data/exercises';
import { estimateWorkoutDurationFromPlan, getLatestWorkoutSessionForWorkout, getWorkoutTimestamp, parseWorkoutPlanDescription } from './historyModel';
import type { WorkoutTemplateSummary } from './types';

const workoutTemplateFavorites = new Set<string>();

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

  if (normalizedName === normalizedQuery) score += 220;
  if (normalizedName.startsWith(normalizedQuery)) score += 120;
  if (normalizedAliases.some((alias) => alias === normalizedQuery)) score += 180;
  if (normalizedAliases.some((alias) => alias.startsWith(normalizedQuery))) score += 100;
  if (normalizedTags.some((tag) => tag.includes(normalizedQuery))) score += 70;
  if (normalizedEquipment.some((item) => item.includes(normalizedQuery))) score += 65;
  if (normalizedPrimaryMuscles.some((muscle) => muscle.includes(normalizedQuery))) score += 60;
  if (normalizedSecondaryMuscles.some((muscle) => muscle.includes(normalizedQuery))) score += 35;
  if (normalizeExerciseText(exercise.muscleGroup ?? '').includes(normalizedQuery)) score += 50;
  if (compactQuery.length > 0 && compactHaystack.includes(compactQuery)) score += 25;
  if (matchesExerciseQuery(exercise, query)) score += 15;

  return score;
};

export const resolveExerciseByName = (exerciseName: string, exercises: Exercise[] = []) => {
  const normalizedTarget = normalizeExerciseText(exerciseName);
  const byProvidedExercise = exercises.find((exercise) => {
    if (normalizeExerciseText(exercise.name) === normalizedTarget) return true;
    if (normalizeExerciseText(exercise.id) === normalizedTarget) return true;
    return (exercise.aliases ?? []).some((alias) => normalizeExerciseText(alias) === normalizedTarget);
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
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [...exercises];
  }

  return exercises
    .filter((exercise) => matchesExerciseQuery(exercise, normalizedQuery))
    .sort((left, right) => getExerciseSearchScore(right, normalizedQuery) - getExerciseSearchScore(left, normalizedQuery) || left.name.localeCompare(right.name));
};

export type SimilarExerciseMatch = {
  exercise: Exercise;
  score: number;
  sharedEquipment: string[];
  sharedMovementPatterns: string[];
  sharedMuscles: string[];
};

export const getRecentExercisesFromWorkoutSessions = (sessions: WorkoutSession[], exercises: Exercise[], limit = 10) => {
  const seen = new Set<string>();
  const recentExercises: Exercise[] = [];

  [...sessions]
    .sort((left, right) => getWorkoutTimestamp(right) - getWorkoutTimestamp(left))
    .forEach((session) => {
      session.sets.forEach((set) => {
        const exercise = resolveExerciseByName(set.exerciseName, exercises);

        if (!exercise || seen.has(exercise.id) || recentExercises.length >= limit) {
          return;
        }

        seen.add(exercise.id);
        recentExercises.push(exercise);
      });
    });

  return recentExercises;
};

export const getSimilarExercises = (exercise: Exercise, exercises: Exercise[], limit = 5): SimilarExerciseMatch[] => {
  const targetMuscles = uniqueStrings([exercise.muscleGroup, ...(exercise.primaryMuscles ?? []), ...(exercise.secondaryMuscles ?? [])]).map(normalizeExerciseText);
  const targetEquipment = uniqueStrings(exercise.equipment ?? []).map(normalizeExerciseText);
  const targetMovementPatterns = uniqueStrings(exercise.movementPattern ?? []).map(normalizeExerciseText);
  const targetType = normalizeExerciseText(exercise.exerciseType ?? '');
  const targetDifficulty = normalizeExerciseText(exercise.difficulty ?? '');
  const targetCategory = normalizeExerciseText(exercise.category ?? '');

  return exercises
    .filter((candidate) => candidate.id !== exercise.id)
    .map((candidate) => {
      const candidateMuscles = uniqueStrings([candidate.muscleGroup, ...(candidate.primaryMuscles ?? []), ...(candidate.secondaryMuscles ?? [])]);
      const candidateEquipment = uniqueStrings(candidate.equipment ?? []);
      const candidateMovementPatterns = uniqueStrings(candidate.movementPattern ?? []);

      const sharedMuscles = candidateMuscles.filter((value) => targetMuscles.includes(normalizeExerciseText(value))).map(toTitleCase);
      const sharedEquipment = candidateEquipment.filter((value) => targetEquipment.includes(normalizeExerciseText(value))).map(toTitleCase);
      const sharedMovementPatterns = candidateMovementPatterns.filter((value) => targetMovementPatterns.includes(normalizeExerciseText(value))).map(toTitleCase);
      const candidateType = normalizeExerciseText(candidate.exerciseType ?? '');
      const candidateDifficulty = normalizeExerciseText(candidate.difficulty ?? '');
      const candidateCategory = normalizeExerciseText(candidate.category ?? '');

      const score =
        sharedMuscles.length * 4 +
        sharedEquipment.length * 3 +
        sharedMovementPatterns.length * 4 +
        (candidateType && candidateType === targetType ? 2 : 0) +
        (candidateDifficulty && candidateDifficulty === targetDifficulty ? 1 : 0) +
        (candidateCategory && candidateCategory === targetCategory ? 1 : 0);

      if (score <= 0 || (sharedMuscles.length === 0 && sharedEquipment.length === 0 && sharedMovementPatterns.length === 0)) {
        return null;
      }

      return {
        exercise: candidate,
        score,
        sharedEquipment,
        sharedMovementPatterns,
        sharedMuscles,
      } satisfies SimilarExerciseMatch;
    })
    .filter((match): match is SimilarExerciseMatch => Boolean(match))
    .sort((left, right) => right.score - left.score || left.exercise.name.localeCompare(right.exercise.name))
    .slice(0, limit);
};

const getWorkoutSubtitle = (workout: Workout) => {
  const parsedPlan = parseWorkoutPlanDescription(workout.description);
  const labels = uniqueStrings([
    parsedPlan.baseDescription,
    ...(parsedPlan.exercises.flatMap((exercise) => [exercise.name, exercise.notes, exercise.targetReps ? `${exercise.targetReps} reps` : undefined]) as Array<string | undefined>),
    ...(workout.exercises.flatMap((exercise) => [exercise.muscleGroup, exercise.category, ...(exercise.primaryMuscles ?? [])]) as string[]),
  ])
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value.toLowerCase() !== WORKOUT_PLAN_HEADER.toLowerCase());

  return labels.slice(0, 2).join(' · ');
};

const getWorkoutUsage = (workoutId: string, sessions: WorkoutSession[]) => {
  const matchingSessions = sessions.filter((session) => session.workoutId === workoutId);
  const lastSession = getLatestWorkoutSessionForWorkout(workoutId, sessions);

  return {
    count: matchingSessions.length,
    lastSession,
  };
};

const getWorkoutEstimatedDuration = (workout: Workout) => {
  const parsedPlan = parseWorkoutPlanDescription(workout.description);
  if (parsedPlan.exercises.length > 0) {
    return estimateWorkoutDurationFromPlan(parsedPlan.exercises);
  }

  return workout.duration || '15 min';
};

export const getWorkoutTemplateSummary = (workout: Workout, sessions: WorkoutSession[]): WorkoutTemplateSummary => {
  const usage = getWorkoutUsage(workout.id, sessions);

  return {
    workout,
    exerciseCount: workout.exercises.length,
    estimatedDuration: getWorkoutEstimatedDuration(workout),
    lastUsedLabel: usage.lastSession ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(usage.lastSession.finishedAt)) : undefined,
    subtitle: getWorkoutSubtitle(workout),
  };
};

export const getSuggestedWorkoutTemplates = (workouts: Workout[], sessions: WorkoutSession[], activeProgram?: TrainingProgram | null) => {
  const defaultWorkoutId = workouts[0]?.id;
  const usageMap = new Map(workouts.map((workout) => [workout.id, getWorkoutUsage(workout.id, sessions)] as const));
  const activeProgramWorkoutId = activeProgram?.days.find((day) => !day.restDay && day.workoutTemplateId)?.workoutTemplateId;

  return [...workouts]
    .map((workout) => {
      const usage = usageMap.get(workout.id)!;
      const daysSinceLastSession = usage.lastSession ? Math.max(0, Math.floor((Date.now() - new Date(usage.lastSession.finishedAt).getTime()) / 86400000)) : 9999;
      const score =
        (activeProgramWorkoutId === workout.id ? 1000 : 0) +
        usage.count * 120 +
        Math.max(0, 400 - daysSinceLastSession * 20) +
        (workout.id === defaultWorkoutId && sessions.length === 0 ? 5 : 0);

      return {
        ...getWorkoutTemplateSummary(workout, sessions),
        score,
        starter: workout.id === defaultWorkoutId && sessions.length === 0,
      };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title))
    .slice(0, 6)
    .map(({ score: _score, starter: _starter, ...summary }) => summary);
};

export const getRecentlyUsedWorkoutTemplates = (workouts: Workout[], sessions: WorkoutSession[], limit = 4) => {
  const workoutById = new Map(workouts.map((workout) => [workout.id, workout] as const));
  const seen = new Set<string>();

  return [...sessions]
    .sort((left, right) => getWorkoutTimestamp(right) - getWorkoutTimestamp(left))
    .map((session) => workoutById.get(session.workoutId))
    .filter((workout): workout is Workout => Boolean(workout))
    .filter((workout) => {
      if (seen.has(workout.id)) {
        return false;
      }
      seen.add(workout.id);
      return true;
    })
    .slice(0, limit)
    .map((workout) => getWorkoutTemplateSummary(workout, sessions));
};

export const getWorkoutTemplateById = (workoutId: string, workouts: Workout[]) => workouts.find((workout) => workout.id === workoutId) ?? null;

export const isWorkoutTemplateFavorite = (workoutId: string) => workoutTemplateFavorites.has(workoutId);

export const toggleWorkoutTemplateFavorite = (workoutId: string) => {
  if (workoutTemplateFavorites.has(workoutId)) {
    workoutTemplateFavorites.delete(workoutId);
    return false;
  }

  workoutTemplateFavorites.add(workoutId);
  return true;
};

export const resetWorkoutModelState = () => {
  workoutTemplateFavorites.clear();
};
