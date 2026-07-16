import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Exercise, TrainingProgram, TrainingProgramDay, WeekdayKey, Workout, WorkoutSession } from '@/types';

import { WEEKDAY_KEYS, type ExerciseDifficulty, type ExerciseType } from '@/domain/models';
import { exerciseCatalogLookup, exerciseSearchIndex, matchesExerciseQuery } from '@/data/exercises';

export type WorkoutPlanExercise = {
  name: string;
  notes?: string;
  restSeconds?: number;
  targetReps?: number;
  targetSets?: number;
};

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

export type ProgramMuscleGroupKey = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core';

export const PROGRAM_MUSCLE_GROUPS: Record<ProgramMuscleGroupKey, { label: string; synonyms: string[] }> = {
  chest: { label: 'Chest', synonyms: ['chest', 'pec', 'pectoral', 'push'] },
  back: { label: 'Back', synonyms: ['back', 'lat', 'lats', 'traps', 'rhomboid'] },
  shoulders: { label: 'Shoulders', synonyms: ['shoulder', 'delt', 'deltoid', 'overhead'] },
  biceps: { label: 'Biceps', synonyms: ['bicep', 'biceps', 'brachialis', 'brachioradialis'] },
  triceps: { label: 'Triceps', synonyms: ['tricep', 'triceps'] },
  quads: { label: 'Quads', synonyms: ['quad', 'quads', 'quadriceps', 'vastus'] },
  hamstrings: { label: 'Hamstrings', synonyms: ['hamstring', 'hamstrings', 'posterior thigh'] },
  glutes: { label: 'Glutes', synonyms: ['glute', 'glutes', 'gluteal'] },
  calves: { label: 'Calves', synonyms: ['calf', 'calves', 'gastrocnemius', 'soleus'] },
  core: { label: 'Core', synonyms: ['core', 'ab', 'abs', 'oblique', 'obliques', 'lower abs', 'deep core', 'rectus'] },
};

export const PROGRAM_MUSCLE_GROUP_KEYS = Object.keys(PROGRAM_MUSCLE_GROUPS) as ProgramMuscleGroupKey[];

export type TrainingProgramWorkoutPlan = {
  workout: TrainingProgramDay & { workoutTitle: string | null; workout?: Workout | null };
  estimatedDurationMinutes: number;
  workingSets: number;
  muscleGroups: ProgramMuscleGroupKey[];
  equipment: string[];
};

export type TrainingProgramOverview = {
  assignedWorkouts: number;
  weeklySets: number;
  estimatedWorkoutDurationMinutes: number;
  musclesTrained: string[];
  missingMuscleGroups: string[];
  equipmentRequired: string[];
  muscleFrequency: Array<{ key: ProgramMuscleGroupKey; label: string; workingSets: number; trainingFrequency: number }>;
};

export type TrainingProgramValidationWarning = {
  id: string;
  severity: 'warning' | 'info';
  message: string;
};

const normalizeWorkoutName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const includesAny = (haystack: string, needles: string[]) => {
  const normalizedHaystack = normalizeWorkoutName(haystack);
  return needles.some((needle) => normalizedHaystack.includes(normalizeWorkoutName(needle)));
};


const getWorkoutPlanExercises = (workout: Workout): WorkoutPlanExercise[] => {
  const parsedPlan = parseWorkoutPlanDescription(workout.description);
  if (parsedPlan.exercises.length > 0) {
    return parsedPlan.exercises;
  }

  return workout.exercises.map((exercise) => ({
    name: exercise.name,
    targetSets: 3,
    targetReps: 8,
    restSeconds: 90,
  }));
};

const getExerciseMuscleGroups = (exercise: Exercise | null) => {
  if (!exercise) {
    return [] as ProgramMuscleGroupKey[];
  }

  const haystacks = [
    exercise.muscleGroup ?? '',
    exercise.category ?? '',
    exercise.exerciseType ?? '',
    exercise.notes ?? '',
    ...(exercise.aliases ?? []),
    ...(exercise.primaryMuscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
    ...(exercise.tags ?? []),
  ];

  return PROGRAM_MUSCLE_GROUP_KEYS.filter((key) => {
    const { synonyms, label } = PROGRAM_MUSCLE_GROUPS[key];
    return haystacks.some((value) => includesAny(value, [label, ...synonyms]));
  });
};

const getWorkoutMuscleGroups = (workout: Workout, exercises: Exercise[]) => {
  const planExercises = getWorkoutPlanExercises(workout);
  const groups = new Set<ProgramMuscleGroupKey>();
  const equipment = new Set<string>();
  let workingSets = 0;

  planExercises.forEach((planExercise) => {
    const resolvedExercise = resolveExerciseByName(planExercise.name, exercises);
    const exerciseGroups = getExerciseMuscleGroups(resolvedExercise);
    exerciseGroups.forEach((group) => groups.add(group));
    (resolvedExercise?.equipment ?? []).forEach((item) => equipment.add(item));
    workingSets += planExercise.targetSets ?? 3;
  });

  return {
    equipment: [...equipment],
    groups: [...groups],
    planExercises,
    workingSets,
  };
};

export const getTrainingProgramOverview = (program: TrainingProgram, workouts: Workout[], exercises: Exercise[]): TrainingProgramOverview => {
  const workoutById = new Map(workouts.map((workout) => [workout.id, workout] as const));
  const frequencyMap = new Map<ProgramMuscleGroupKey, { workingSets: number; trainingFrequency: number }>(
    PROGRAM_MUSCLE_GROUP_KEYS.map((key) => [key, { workingSets: 0, trainingFrequency: 0 }] as const),
  );
  const equipment = new Set<string>();
  const musclesTrained = new Set<string>();
  const planSummaries = program.days.map((day) => {
    const workout = day.restDay ? null : day.workoutTemplateId ? workoutById.get(day.workoutTemplateId) ?? null : null;

    if (!workout) {
      return {
        workout: { ...day, workoutTitle: null, workout: null },
        estimatedDurationMinutes: 0,
        workingSets: 0,
        equipment: [] as string[],
        muscleGroups: [] as ProgramMuscleGroupKey[],
      } satisfies TrainingProgramWorkoutPlan;
    }

    const summary = getWorkoutMuscleGroups(workout, exercises);
    const estimatedDurationMinutes = estimateWorkoutDurationMinutesFromPlan(summary.planExercises);

    summary.equipment.forEach((item) => equipment.add(item));
    summary.groups.forEach((group) => musclesTrained.add(PROGRAM_MUSCLE_GROUPS[group].label));
    summary.groups.forEach((group) => {
      const next = frequencyMap.get(group)!;
      next.workingSets += summary.workingSets;
      next.trainingFrequency += 1;
      frequencyMap.set(group, next);
    });

    return {
      workout: { ...day, workoutTitle: workout.title, workout },
      estimatedDurationMinutes,
      workingSets: summary.workingSets,
      equipment: summary.equipment,
      muscleGroups: summary.groups,
    } satisfies TrainingProgramWorkoutPlan;
  });

  const assignedWorkouts = planSummaries.filter((item) => item.workout.workoutTitle).length;
  const weeklySets = planSummaries.reduce((total, item) => total + item.workingSets, 0);
  const estimatedWorkoutDurationMinutes = planSummaries.reduce((total, item) => total + item.estimatedDurationMinutes, 0);
  const missingMuscleGroups = PROGRAM_MUSCLE_GROUP_KEYS.filter((key) => frequencyMap.get(key)!.trainingFrequency === 0).map((key) => PROGRAM_MUSCLE_GROUPS[key].label);

  return {
    assignedWorkouts,
    weeklySets,
    estimatedWorkoutDurationMinutes,
    musclesTrained: [...musclesTrained].sort(),
    missingMuscleGroups,
    equipmentRequired: [...equipment].sort((left, right) => left.localeCompare(right)),
    muscleFrequency: PROGRAM_MUSCLE_GROUP_KEYS.map((key) => ({
      key,
      label: PROGRAM_MUSCLE_GROUPS[key].label,
      workingSets: frequencyMap.get(key)!.workingSets,
      trainingFrequency: frequencyMap.get(key)!.trainingFrequency,
    })),
  };
};

export const getTrainingProgramValidation = (program: TrainingProgram, workouts: Workout[], exercises: Exercise[]): TrainingProgramValidationWarning[] => {
  const overview = getTrainingProgramOverview(program, workouts, exercises);
  const warnings: TrainingProgramValidationWarning[] = [];
  const unassignedDays = program.days.filter((day) => !day.restDay && !day.workoutTemplateId);
  const duplicateCounts = new Map<string, number>();
  program.days.forEach((day) => {
    if (!day.workoutTemplateId) {
      return;
    }

    duplicateCounts.set(day.workoutTemplateId, (duplicateCounts.get(day.workoutTemplateId) ?? 0) + 1);
  });
  const duplicateTemplateIds = [...duplicateCounts.entries()].filter(([, count]) => count > 1).map(([templateId]) => templateId);
  const highVolumeThreshold = 120;

  if (unassignedDays.length > 0) {
    warnings.push({
      id: 'empty-days',
      severity: 'warning',
      message: `${unassignedDays.length} workout day${unassignedDays.length === 1 ? '' : 's'} are empty.`,
    });
  }

  if (duplicateTemplateIds.length > 0) {
    warnings.push({
      id: 'duplicate-workouts',
      severity: 'info',
      message: `${new Set(duplicateTemplateIds).size} template${new Set(duplicateTemplateIds).size === 1 ? '' : 's'} are duplicated in the week.`,
    });
  }

  if (overview.weeklySets >= highVolumeThreshold) {
    warnings.push({
      id: 'high-volume',
      severity: 'warning',
      message: `Weekly volume is very high at ${overview.weeklySets} working sets.`,
    });
  }

  if (overview.missingMuscleGroups.length > 0) {
    warnings.push({
      id: 'missing-muscles',
      severity: 'warning',
      message: `${overview.missingMuscleGroups.join(', ')} are never trained this week.`,
    });
  }

  return warnings;
};

export const createDefaultTrainingProgram = (workouts: Workout[]): TrainingProgram => {
  const seededDays = WEEKDAY_KEYS.map((weekday, index) => {
    const workout = workouts[index % Math.max(workouts.length, 1)];
    const isRestDay = index >= workouts.length || workouts.length === 0;

    return {
      id: `${weekday}-${index}`,
      weekday,
      workoutTemplateId: isRestDay ? undefined : workout.id,
      workoutTemplateName: isRestDay ? undefined : workout.title,
      notes: isRestDay ? 'Recovery focus' : undefined,
      restDay: isRestDay,
    } as TrainingProgramDay;
  });

  return {
    id: 'default-program',
    name: 'Strength Program',
    description: 'Structured weekly program built from saved workout templates.',
    goal: 'Strength',
    difficulty: 'intermediate',
    durationWeeks: 8,
    days: seededDays,
    progression: {
      strategy: 'linear progression',
      targetReps: 8,
      targetWeight: undefined,
      rir: 2,
    },
    createdAt: new Date().toISOString(),
    isCustom: false,
  };
};

export type WorkoutSessionDraft = {
  id: string;
  workoutId: string;
  workoutTitle: string;
  startedAt: string;
  sets: WorkoutSession['sets'];
};

export type WorkoutTemplateSummary = {
  workout: Workout;
  exerciseCount: number;
  estimatedDuration: string;
  lastUsedLabel?: string;
  subtitle: string;
};

export type WorkoutProgramSummary = {
  isFavorite: boolean;
  program: TrainingProgram;
  workoutCount: number;
  daysPerWeek: number;
  subtitle: string;
  goalLabel: string;
  difficultyLabel: string;
};

export type WorkoutHubViewModel = {
  activeWorkout?: WorkoutTemplateSummary & { completedExercises: number; elapsedLabel: string; progressLabel: string };
  favoritePrograms: WorkoutProgramSummary[];
  mode: 'start-now' | 'programs';
  recentWorkouts: WorkoutTemplateSummary[];
  suggestedWorkouts: WorkoutTemplateSummary[];
  starterWorkout?: WorkoutTemplateSummary;
  stickyActionLabel: string;
  stickyActionType: 'continue' | 'start-empty';
  programs: WorkoutProgramSummary[];
  hasFreshStartNowState: boolean;
  hasFreshProgramsState: boolean;
};

const workoutProgramsStore = {
  favorites: new Set<string>(),
  programs: [] as TrainingProgram[],
};

const ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY = 'active-workout-session-draft';

let activeWorkoutSessionDraft: WorkoutSessionDraft | null = null;
let activeWorkoutSessionDraftWriteQueue = Promise.resolve();
const workoutTemplateFavorites = new Set<string>();

const cloneSet = (set: WorkoutSession['sets'][number]) => ({ ...set });
const cloneProgram = (program: TrainingProgram): TrainingProgram => ({
  ...program,
  days: program.days.map((day) => ({ ...day })),
  progression: program.progression ? { ...program.progression } : undefined,
  metadata: program.metadata ? { ...program.metadata } : undefined,
});

const cloneWorkoutSessionDraft = (draft: WorkoutSessionDraft): WorkoutSessionDraft => ({
  ...draft,
  sets: draft.sets.map(cloneSet),
});

const parseWorkoutSessionDraft = (value: string | null): WorkoutSessionDraft | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<WorkoutSessionDraft> | null;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.workoutId !== 'string' ||
      typeof parsed.workoutTitle !== 'string' ||
      typeof parsed.startedAt !== 'string' ||
      !Array.isArray(parsed.sets)
    ) {
      return null;
    }

    return {
      id: parsed.id,
      workoutId: parsed.workoutId,
      workoutTitle: parsed.workoutTitle,
      startedAt: parsed.startedAt,
      sets: parsed.sets.filter((set): set is WorkoutSession['sets'][number] => Boolean(set)).map(cloneSet),
    };
  } catch {
    return null;
  }
};

const persistActiveWorkoutSessionDraft = (draft: WorkoutSessionDraft | null) => {
  activeWorkoutSessionDraftWriteQueue = activeWorkoutSessionDraftWriteQueue
    .catch(() => undefined)
    .then(() => {
      if (draft) {
        return AsyncStorage.setItem(ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY, JSON.stringify(cloneWorkoutSessionDraft(draft)));
      }

      return AsyncStorage.removeItem(ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY);
    })
    .catch(() => undefined);

  return activeWorkoutSessionDraftWriteQueue;
};

const normalizeWorkoutText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const formatElapsedLabel = (startedAt: string, now = Date.now()) => {
  const elapsedMs = Math.max(0, now - new Date(startedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

const getWorkoutSubtitle = (workout: Workout) => {
  const labels = uniqueStrings([
    workout.description,
    ...(workout.exercises.flatMap((exercise) => [exercise.muscleGroup, exercise.category, ...(exercise.primaryMuscles ?? [])]) as string[]),
  ])
    .map((value) => value.trim())
    .filter(Boolean);

  return labels.slice(0, 2).join(' · ') || 'Starter workout';
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

export const resetWorkoutHubState = () => {
  workoutProgramsStore.favorites.clear();
  workoutProgramsStore.programs = [];
  workoutTemplateFavorites.clear();
  void clearActiveWorkoutSessionDraft();
};

export const getActiveWorkoutSessionDraft = () => (activeWorkoutSessionDraft ? { ...activeWorkoutSessionDraft, sets: activeWorkoutSessionDraft.sets.map(cloneSet) } : null);

export const hydrateActiveWorkoutSessionDraft = async () => {
  activeWorkoutSessionDraft = parseWorkoutSessionDraft(await AsyncStorage.getItem(ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY));
  return getActiveWorkoutSessionDraft();
};

export const setActiveWorkoutSessionDraft = (draft: WorkoutSessionDraft | null) => {
  activeWorkoutSessionDraft = draft ? cloneWorkoutSessionDraft(draft) : null;
  void persistActiveWorkoutSessionDraft(activeWorkoutSessionDraft);
};

export const startWorkoutSessionDraft = (workout: Workout, startedAt = new Date().toISOString()) => {
  const draft: WorkoutSessionDraft = {
    id: `${Date.now()}`,
    workoutId: workout.id,
    workoutTitle: workout.title,
    startedAt,
    sets: [],
  };

  setActiveWorkoutSessionDraft(draft);
  return draft;
};

export const startEmptyWorkoutSessionDraft = (startedAt = new Date().toISOString()) => {
  const draft: WorkoutSessionDraft = {
    id: `${Date.now()}`,
    workoutId: 'empty-workout',
    workoutTitle: 'Empty workout',
    startedAt,
    sets: [],
  };

  setActiveWorkoutSessionDraft(draft);
  return draft;
};

export const updateActiveWorkoutSessionDraft = (updater: (current: WorkoutSessionDraft) => WorkoutSessionDraft) => {
  if (!activeWorkoutSessionDraft) {
    return null;
  }

  const nextDraft = updater({ ...activeWorkoutSessionDraft, sets: activeWorkoutSessionDraft.sets.map(cloneSet) });
  setActiveWorkoutSessionDraft(nextDraft);
  return nextDraft;
};

export const clearActiveWorkoutSessionDraft = () => {
  activeWorkoutSessionDraft = null;
  void persistActiveWorkoutSessionDraft(null);
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

export const getWorkoutHubViewModel = (input: { activeProgram?: TrainingProgram | null; workouts: Workout[]; workoutSessions: WorkoutSession[] }) => {
  const activeWorkoutDraft = getActiveWorkoutSessionDraft();
  const activeWorkout = activeWorkoutDraft ? input.workouts.find((workout) => workout.id === activeWorkoutDraft.workoutId) ?? null : null;
  const activeWorkoutExerciseCount = activeWorkout ? activeWorkout.exercises.length : 0;
  const starterWorkout = input.workouts[0] ? getWorkoutTemplateSummary(input.workouts[0], input.workoutSessions) : undefined;
  const suggestedWorkouts = getSuggestedWorkoutTemplates(input.workouts, input.workoutSessions, input.activeProgram);
  const recentWorkouts = getRecentlyUsedWorkoutTemplates(input.workouts, input.workoutSessions, 4);
  const programs = getWorkoutPrograms(input.workouts);
  const programSummaries = programs.map((program) => getWorkoutProgramSummary(program, input.workouts, input.workoutSessions));
  const activeSummary = activeWorkout ? getWorkoutTemplateSummary(activeWorkout, input.workoutSessions) : undefined;

  return {
    activeWorkout: activeSummary && activeWorkoutDraft
      ? {
          ...activeSummary,
          completedExercises: new Set(activeWorkoutDraft.sets.filter((set) => set.completed !== false).map((set) => set.exerciseId)).size,
          elapsedLabel: formatElapsedLabel(activeWorkoutDraft.startedAt),
          progressLabel: `${new Set(activeWorkoutDraft.sets.filter((set) => set.completed !== false).map((set) => set.exerciseId)).size}/${activeWorkoutExerciseCount} exercises`,
        }
      : undefined,
    favoritePrograms: programSummaries.filter((program) => program.isFavorite),
    mode: 'start-now' as const,
    recentWorkouts,
    suggestedWorkouts,
    starterWorkout,
    stickyActionLabel: activeWorkoutDraft ? 'Continue Workout' : 'Start Empty Workout',
    stickyActionType: activeWorkoutDraft ? 'continue' as const : 'start-empty' as const,
    programs: programSummaries,
    hasFreshStartNowState: input.workoutSessions.length === 0,
    hasFreshProgramsState: workoutProgramsStore.programs.length === 0,
  } satisfies WorkoutHubViewModel;
};

export const getWorkoutProgramSummary = (program: TrainingProgram, workouts: Workout[], sessions: WorkoutSession[]): WorkoutProgramSummary => {
  const workoutCount = program.days.filter((day) => !day.restDay && Boolean(day.workoutTemplateId)).length;
  const daysPerWeek = program.days.filter((day) => !day.restDay).length;
  const firstWorkoutId = program.days.find((day) => !day.restDay && day.workoutTemplateId)?.workoutTemplateId;
  const workout = workouts.find((item) => item.id === firstWorkoutId) ?? workouts[0];
  const subtitle = program.description?.trim() || workout?.description?.trim() || `${workoutCount} workout${workoutCount === 1 ? '' : 's'} per week`;

  return {
    isFavorite: workoutProgramsStore.favorites.has(program.id),
    program,
    workoutCount,
    daysPerWeek,
    subtitle,
    goalLabel: program.goal,
    difficultyLabel: program.difficulty,
  };
};

export const getWorkoutPrograms = (workouts: Workout[]) => {
  const defaultProgram = createDefaultTrainingProgram(workouts);
  return [defaultProgram, ...workoutProgramsStore.programs.map(cloneProgram)];
};

export const saveWorkoutProgram = (program: TrainingProgram) => {
  const nextProgram = cloneProgram(program);
  const existingIndex = workoutProgramsStore.programs.findIndex((item) => item.id === nextProgram.id);

  if (existingIndex === -1) {
    workoutProgramsStore.programs = [nextProgram, ...workoutProgramsStore.programs];
    return nextProgram;
  }

  workoutProgramsStore.programs = workoutProgramsStore.programs.map((item) => (item.id === nextProgram.id ? nextProgram : item));
  return nextProgram;
};

export const toggleWorkoutProgramFavorite = (programId: string) => {
  if (workoutProgramsStore.favorites.has(programId)) {
    workoutProgramsStore.favorites.delete(programId);
    return false;
  }

  workoutProgramsStore.favorites.add(programId);
  return true;
};

export const deleteWorkoutProgram = (programId: string) => {
  workoutProgramsStore.programs = workoutProgramsStore.programs.filter((program) => program.id !== programId);
  workoutProgramsStore.favorites.delete(programId);
};

export const duplicateWorkoutProgram = (programId: string, workouts: Workout[]) => {
  const source = getWorkoutPrograms(workouts).find((program) => program.id === programId);
  if (!source) {
    return null;
  }

  const suffix = 'Copy';
  const nextProgram: TrainingProgram = {
    ...cloneProgram(source),
    id: `${source.id}-${suffix.toLowerCase()}`,
    name: `${source.name} ${suffix}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: undefined,
  };

  return saveWorkoutProgram(nextProgram);
};

export const getWorkoutProgramById = (programId: string, workouts: Workout[]) => getWorkoutPrograms(workouts).find((program) => program.id === programId) ?? null;

export const getWorkoutProgramSchedule = (program: TrainingProgram) => {
  const todayIndex = new Date().getDay();
  const weekdayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const currentWeekday = weekdayOrder[todayIndex];
  const currentIndex = program.days.findIndex((day) => day.weekday === currentWeekday);
  const nextWorkout = program.days.slice(currentIndex >= 0 ? currentIndex : 0).find((day) => !day.restDay && day.workoutTemplateId) ?? program.days.find((day) => !day.restDay && day.workoutTemplateId) ?? null;
  const currentDay = currentIndex >= 0 ? program.days[currentIndex] : null;

  return {
    currentDay,
    nextWorkout,
    isRestDayToday: Boolean(currentDay?.restDay),
  };
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
