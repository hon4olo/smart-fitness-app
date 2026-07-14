import type { WorkoutSession, WorkoutSet } from '@/context/AppContext';
import type { Exercise, Workout } from '@/types';

import { estimateWorkoutDurationFromPlan, parseWorkoutPlanDescription, getSessionExercises, getSessionVolume } from '@/lib/workouts';

export type PlannedExercise = Exercise & {
  notes?: string;
  restSeconds?: number;
  targetReps?: number;
  targetSets?: number;
};

export type WorkoutSessionPreviousSet = {
  id: string;
  finishedAt: string;
  workoutDate: string;
  reps: number;
  weight: number;
};

export type WorkoutSessionPr = {
  date: string;
  id: string;
  label: string;
  value: string;
};

export const formatWorkoutSessionDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export const resolveWorkoutSessionExercises = (workout?: Workout) => {
  if (!workout) {
    return [] as PlannedExercise[];
  }

  const parsedPlan = parseWorkoutPlanDescription(workout.description);

  return workout.exercises.map((exercise, index) => {
    const plannedExercise = parsedPlan.exercises[index];

    return {
      ...exercise,
      ...plannedExercise,
      name: plannedExercise?.name ?? exercise.name,
    } satisfies PlannedExercise;
  });
};

export const getWorkoutSessionEstimatedDuration = (workout?: Workout) => {
  if (!workout) {
    return '—';
  }

  const parsedPlan = parseWorkoutPlanDescription(workout.description);
  return parsedPlan.exercises.length > 0 ? estimateWorkoutDurationFromPlan(parsedPlan.exercises) : workout.duration ?? '—';
};

export const getWorkoutSessionProgress = (workoutExercises: PlannedExercise[], selectedExerciseId: string) => {
  const selectedExercise = workoutExercises.find((exercise) => exercise.id === selectedExerciseId) ?? workoutExercises[0];
  const selectedExerciseIndex = Math.max(0, workoutExercises.findIndex((exercise) => exercise.id === selectedExercise?.id));
  const progressLabel = workoutExercises.length > 0 ? `${selectedExerciseIndex + 1} / ${workoutExercises.length}` : '0 / 0';
  const nextExercise = workoutExercises[selectedExerciseIndex + 1];
  const progressPercent = workoutExercises.length > 0 ? ((selectedExerciseIndex + 1) / workoutExercises.length) * 100 : 0;

  return {
    nextExercise,
    progressLabel,
    progressPercent,
    selectedExercise,
    selectedExerciseIndex,
  };
};

export const getWorkoutSessionPreviousSets = (
  selectedExercise: PlannedExercise | undefined,
  workoutSessions: WorkoutSession[],
): WorkoutSessionPreviousSet[] => {
  if (!selectedExercise) {
    return [];
  }

  return workoutSessions
    .flatMap((session) => {
      return session.sets
        .filter((set) => set.exerciseId === selectedExercise.id)
        .map((set) => ({
          id: `${session.id}-${set.id}`,
          finishedAt: session.finishedAt,
          workoutDate: formatWorkoutSessionDate(session.finishedAt),
          reps: set.reps,
          weight: set.weight,
        }));
    })
    .sort((left, right) => new Date(right.finishedAt).getTime() - new Date(left.finishedAt).getTime())
    .slice(0, 5);
};

export const getWorkoutSessionExercisePrs = (
  selectedExercise: PlannedExercise | undefined,
  workoutSessions: WorkoutSession[],
): WorkoutSessionPr[] => {
  if (!selectedExercise) {
    return [];
  }

  const matchingSets = workoutSessions.flatMap((session) =>
    session.sets
      .filter((set) => set.exerciseId === selectedExercise.id)
      .map((set) => ({
        finishedAt: session.finishedAt,
        workoutDate: formatWorkoutSessionDate(session.finishedAt),
        reps: set.reps,
        weight: set.weight,
        volume: set.weight * set.reps,
        estimated1rm: set.weight * (1 + set.reps / 30),
      })),
  );

  if (matchingSets.length === 0) {
    return [];
  }

  const maxWeightSet = matchingSets.reduce((best, current) => (current.weight > best.weight ? current : best));
  const bestVolumeSet = matchingSets.reduce((best, current) => (current.volume > best.volume ? current : best));
  const estimated1rmSet = matchingSets.reduce((best, current) => (current.estimated1rm > best.estimated1rm ? current : best));

  return [
    {
      id: 'max-weight',
      label: 'Max weight set',
      value: `${maxWeightSet.weight} kg x ${maxWeightSet.reps}`,
      date: maxWeightSet.workoutDate,
    },
    {
      id: 'best-volume',
      label: 'Best volume set',
      value: `${bestVolumeSet.volume.toLocaleString()} kg volume`,
      date: bestVolumeSet.workoutDate,
    },
    {
      id: 'estimated-1rm',
      label: 'Estimated 1RM',
      value: `${estimated1rmSet.estimated1rm.toFixed(1)} kg`,
      date: estimated1rmSet.workoutDate,
    },
  ];
};

export const getWorkoutSessionVisibleSets = (session: WorkoutSession, visibleSets: WorkoutSet[]) => {
  return getSessionExercises({ ...session, sets: visibleSets });
};

export const getWorkoutSessionVolume = (session: WorkoutSession, visibleSets: WorkoutSet[]) => {
  return getSessionVolume({ ...session, sets: visibleSets });
};
