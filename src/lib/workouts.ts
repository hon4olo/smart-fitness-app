import type { Exercise, TrainingProgram, TrainingProgramDay, WeekdayKey, Workout, WorkoutSession } from '@/types';

import { WEEKDAY_KEYS } from '@/domain/models';
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
  return exercises.filter((exercise) => matchesExerciseQuery(exercise, query));
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
