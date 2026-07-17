import type { Exercise, Workout, WorkoutSession } from '@/types';

export const createWorkoutExerciseId = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

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
    aliases: exercise.aliases ?? [],
    category: exercise.category ?? null,
    difficulty: exercise.difficulty ?? null,
    equipment: exercise.equipment ?? [],
    exerciseType: exercise.exerciseType ?? null,
    isCustom: exercise.isCustom ?? true,
    movementPattern: exercise.movementPattern ?? [],
    muscleGroup: exercise.muscleGroup ?? null,
    name: exercise.name,
    notes: exercise.notes ?? null,
    primaryMuscles: exercise.primaryMuscles ?? [],
    secondaryMuscles: exercise.secondaryMuscles ?? [],
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

  const dedupedById = dedupeById(normalized);
  const halfLength = dedupedById.length / 2;

  if (dedupedById.length > 0 && Number.isInteger(halfLength)) {
    const firstHalf = dedupedById.slice(0, halfLength);
    const secondHalf = dedupedById.slice(halfLength);

    if (firstHalf.every((exercise, index) => workoutExerciseSignature(exercise) === workoutExerciseSignature(secondHalf[index]!))) {
      return firstHalf;
    }
  }

  return dedupedById;
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
