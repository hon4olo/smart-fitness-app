import type { Exercise, Workout, WorkoutSession } from '@/types';

export const createWorkoutExerciseId = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizeStringList = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value)).map((value) => normalizeText(value)).filter(Boolean))).sort();

const dedupeById = <T extends { id: string }>(items: T[]) => {
  const seen = new Set<string>();

  return [...items]
    .reverse()
    .filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    })
    .reverse();
};

const workoutExerciseSignature = (exercise: Workout['exercises'][number]) =>
  JSON.stringify({
    aliases: normalizeStringList(exercise.aliases ?? []),
    category: normalizeText(exercise.category ?? ''),
    difficulty: normalizeText(exercise.difficulty ?? ''),
    equipment: normalizeStringList(exercise.equipment ?? []),
    exerciseType: normalizeText(exercise.exerciseType ?? ''),
    movementPattern: normalizeStringList(exercise.movementPattern ?? []),
    muscleGroup: normalizeText(exercise.muscleGroup ?? ''),
    name: normalizeText(exercise.name),
    notes: normalizeText(exercise.notes ?? ''),
    primaryMuscles: normalizeStringList(exercise.primaryMuscles ?? []),
    secondaryMuscles: normalizeStringList(exercise.secondaryMuscles ?? []),
  });

const normalizeWorkoutExercises = (exercises: Workout['exercises']) => {
  const normalized = exercises.map((exercise, index) => {
    if (typeof exercise === 'string') {
      return {
        id: `${createWorkoutExerciseId(exercise)}-${index}`,
        name: exercise,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      ...exercise,
      isCustom: exercise.isCustom ?? true,
      createdAt: exercise.createdAt ?? new Date().toISOString(),
    };
  });

  const dedupedBySignature = [] as typeof normalized;
  const seenSignatures = new Set<string>();

  for (const exercise of dedupeById(normalized)) {
    const signature = workoutExerciseSignature(exercise);
    if (seenSignatures.has(signature)) {
      continue;
    }

    seenSignatures.add(signature);
    dedupedBySignature.push(exercise);
  }

  return dedupedBySignature;
};

export const normalizeWorkouts = (workouts: Workout[], defaultWorkoutTemplateIds: Set<string>) => {
  const normalized = workouts.map((workout) => ({
    ...workout,
    createdAt: workout.createdAt ?? new Date().toISOString(),
    isCustom: workout.isCustom ?? !defaultWorkoutTemplateIds.has(workout.id),
    exercises: normalizeWorkoutExercises(workout.exercises),
  }));

  return dedupeById(normalized);
};

export const normalizeWorkoutSessions = (sessions: WorkoutSession[]) => {
  const deduped = dedupeById(sessions.map((session) => ({ ...session, sets: session.sets.map((set) => ({ ...set })) })));

  return [...deduped].sort((left, right) => {
    const leftTime = new Date(left.finishedAt ?? left.startedAt).getTime();
    const rightTime = new Date(right.finishedAt ?? right.startedAt).getTime();
    return leftTime - rightTime;
  });
};

export const normalizeWorkoutExercisesForRepair = (exercises: Exercise[]) => {
  return exercises.map((exercise) => ({
    ...exercise,
    isCustom: exercise.isCustom ?? false,
    createdAt: exercise.createdAt ?? new Date().toISOString(),
  }));
};
