import type { Exercise, TrainingProgram, TrainingProgramDay, Workout, WorkoutSession } from '@/types';

import { createDefaultTrainingProgram } from './defaults';
import { estimateWorkoutDurationMinutesFromPlan, parseWorkoutPlanDescription, getWorkoutTimestamp } from './historyModel';
import { resolveExerciseByName } from './workoutModel';
import type { ProgramMuscleGroupKey, TrainingProgramOverview, TrainingProgramValidationWarning, TrainingProgramWorkoutPlan, WorkoutProgramSummary } from './types';

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

const programStore = {
  favorites: new Set<string>(),
  programs: [] as TrainingProgram[],
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

const getWorkoutPlanExercises = (workout: Workout) => {
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

export const getWorkoutProgramSummary = (program: TrainingProgram, workouts: Workout[], sessions: WorkoutSession[]): WorkoutProgramSummary => {
  const workoutCount = program.days.filter((day) => !day.restDay && Boolean(day.workoutTemplateId)).length;
  const daysPerWeek = program.days.filter((day) => !day.restDay).length;
  const firstWorkoutId = program.days.find((day) => !day.restDay && day.workoutTemplateId)?.workoutTemplateId;
  const workout = workouts.find((item) => item.id === firstWorkoutId) ?? workouts[0];
  const subtitle = program.description?.trim() || workout?.description?.trim() || `${workoutCount} workout${workoutCount === 1 ? '' : 's'} per week`;

  return {
    isFavorite: Boolean(program.metadata?.favorite) || programStore.favorites.has(program.id),
    program,
    workoutCount,
    daysPerWeek,
    subtitle,
    goalLabel: program.goal,
    difficultyLabel: program.difficulty,
  };
};

export const getWorkoutPrograms = (workouts: Workout[], storedPrograms: TrainingProgram[] = programStore.programs) => {
  const defaultProgram = createDefaultTrainingProgram(workouts);
  const mergedPrograms = [defaultProgram, ...storedPrograms.map((program) => ({
    ...program,
    days: program.days.map((day) => ({ ...day })),
    progression: program.progression ? { ...program.progression } : undefined,
    metadata: program.metadata ? { ...program.metadata } : undefined,
  }))];
  const seen = new Set<string>();

  return mergedPrograms
    .reverse()
    .filter((program) => {
      if (seen.has(program.id)) {
        return false;
      }

      seen.add(program.id);
      return true;
    })
    .reverse();
};

export const saveWorkoutProgram = (program: TrainingProgram) => {
  const nextProgram = {
    ...program,
    days: program.days.map((day) => ({ ...day })),
    progression: program.progression ? { ...program.progression } : undefined,
    metadata: program.metadata ? { ...program.metadata } : undefined,
  };
  const existingIndex = programStore.programs.findIndex((item) => item.id === nextProgram.id);

  if (existingIndex === -1) {
    programStore.programs = [nextProgram, ...programStore.programs];
    return nextProgram;
  }

  programStore.programs = programStore.programs.map((item) => (item.id === nextProgram.id ? nextProgram : item));
  return nextProgram;
};

export const toggleWorkoutProgramFavorite = (programId: string) => {
  if (programStore.favorites.has(programId)) {
    programStore.favorites.delete(programId);
    return false;
  }

  programStore.favorites.add(programId);
  return true;
};

export const deleteWorkoutProgram = (programId: string) => {
  programStore.programs = programStore.programs.filter((program) => program.id !== programId);
  programStore.favorites.delete(programId);
};

export const duplicateWorkoutProgram = (programId: string, workouts: Workout[]) => {
  const source = getWorkoutPrograms(workouts).find((program) => program.id === programId);
  if (!source) {
    return null;
  }

  const suffix = 'Copy';
  const nextProgram: TrainingProgram = {
    ...source,
    id: `${source.id}-${suffix.toLowerCase()}`,
    name: `${source.name} ${suffix}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: undefined,
  };

  return saveWorkoutProgram(nextProgram);
};

export const getWorkoutProgramById = (programId: string, workouts: Workout[], storedPrograms?: TrainingProgram[]) =>
  getWorkoutPrograms(workouts, storedPrograms).find((program) => program.id === programId) ?? null;

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

export const resetProgramModelState = () => {
  programStore.favorites.clear();
  programStore.programs = [];
};
