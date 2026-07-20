import type { AppState, Exercise, TrainingProgram, Workout, WorkoutSession } from '@/types';
import { createExerciseId } from '@/lib/appState';

export type WorkoutTemplateInput = {
  id: string;
  title: string;
  description?: string;
  exercises: string[];
  createdAt: string;
};

export type WorkoutTemplateUpdate = {
  title: string;
  description?: string;
  exercises: string[];
};

export function buildWorkoutTemplate(template: WorkoutTemplateInput): Workout {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    createdAt: template.createdAt,
    isCustom: true,
    duration: `${Math.max(15, template.exercises.length * 10)} min`,
    exercises: template.exercises.map((exercise, index) => ({
      id: `${createExerciseId(exercise)}-${index}`,
      name: exercise,
      isCustom: true,
      createdAt: template.createdAt,
    })),
  };
}

export function upsertWorkoutTemplate(workouts: Workout[], nextWorkout: Workout): Workout[] {
  const existingIndex = workouts.findIndex((item) => item.id === nextWorkout.id);

  return existingIndex === -1
    ? [...workouts, nextWorkout]
    : workouts.map((item) => (item.id === nextWorkout.id ? nextWorkout : item));
}

export function addWorkoutTemplateToState(currentState: AppState, template: WorkoutTemplateInput): AppState {
  return {
    ...currentState,
    workouts: upsertWorkoutTemplate(currentState.workouts, buildWorkoutTemplate(template)),
  };
}

export function updateCustomWorkoutTemplateInState(
  currentState: AppState,
  templateId: string,
  updatedTemplate: WorkoutTemplateUpdate,
  fallbackCreatedAt: string
): AppState {
  const workout = currentState.workouts.find((item) => item.id === templateId);

  if (!workout || !workout.isCustom) {
    return currentState;
  }

  return {
    ...currentState,
    workouts: currentState.workouts.map((item) =>
      item.id === templateId
        ? {
            ...item,
            title: updatedTemplate.title,
            description: updatedTemplate.description,
            duration: `${Math.max(15, updatedTemplate.exercises.length * 10)} min`,
            exercises: updatedTemplate.exercises.map((exercise, index) => ({
              id: `${createExerciseId(exercise)}-${index}`,
              name: exercise,
              isCustom: true,
              createdAt: item.createdAt ?? fallbackCreatedAt,
            })),
          }
        : item
    ),
  };
}

export function prepareTrainingProgram(program: TrainingProgram, updatedAt: string): TrainingProgram {
  return {
    ...program,
    name: program.name.trim(),
    days: program.days.map((day) => ({ ...day })),
    progression: program.progression ? { ...program.progression } : undefined,
    metadata: program.metadata ? { ...program.metadata } : undefined,
    updatedAt,
    isCustom: program.isCustom ?? true,
  };
}

export function saveTrainingProgramToState(
  currentState: AppState,
  program: TrainingProgram,
  updatedAt: string
): AppState {
  const nextProgram = prepareTrainingProgram(program, updatedAt);
  const existingIndex = currentState.trainingPrograms.findIndex((item) => item.id === nextProgram.id);
  const trainingPrograms =
    existingIndex === -1
      ? [nextProgram, ...currentState.trainingPrograms]
      : currentState.trainingPrograms.map((item) => (item.id === nextProgram.id ? nextProgram : item));

  return {
    ...currentState,
    trainingPrograms,
  };
}

export function deleteTrainingProgramFromState(currentState: AppState, programId: string): AppState {
  return {
    ...currentState,
    trainingPrograms: currentState.trainingPrograms.filter((program) => program.id !== programId),
  };
}

export function toggleTrainingProgramFavoriteInState(
  currentState: AppState,
  programId: string,
  updatedAt: string
): AppState {
  return {
    ...currentState,
    trainingPrograms: currentState.trainingPrograms.map((program) =>
      program.id === programId
        ? {
            ...program,
            metadata: {
              ...(program.metadata ?? {}),
              favorite: !Boolean(program.metadata?.favorite),
            },
            updatedAt,
          }
        : program
    ),
  };
}

export function canDeleteCustomWorkoutTemplate(workout: Workout | undefined): workout is Workout {
  return Boolean(workout && workout.isCustom);
}

export function canDeleteCustomExercise(exercise: Exercise | undefined): exercise is Exercise {
  return Boolean(exercise && exercise.isCustom);
}

export function deleteCustomWorkoutTemplateFromState(currentState: AppState, templateId: string): AppState {
  const workout = currentState.workouts.find((item) => item.id === templateId);

  if (!canDeleteCustomWorkoutTemplate(workout)) {
    return currentState;
  }

  return {
    ...currentState,
    workouts: currentState.workouts.filter((item) => item.id !== templateId),
  };
}

export function deleteCustomExerciseFromState(currentState: AppState, exerciseId: string): AppState {
  const exercise = currentState.exercises.find((item) => item.id === exerciseId);

  if (!canDeleteCustomExercise(exercise)) {
    return currentState;
  }

  return {
    ...currentState,
    exercises: currentState.exercises.filter((item) => item.id !== exerciseId),
  };
}

export function deleteWorkoutSessionFromState(currentState: AppState, sessionId: string): AppState {
  return {
    ...currentState,
    workoutSessions: currentState.workoutSessions.filter((session) => session.id !== sessionId),
  };
}

export function updateWorkoutSessionPreservingImmutableFields(
  currentState: AppState,
  sessionId: string,
  updatedSession: WorkoutSession
): AppState {
  const existingSession = currentState.workoutSessions.find((session) => session.id === sessionId);

  if (!existingSession) {
    return currentState;
  }

  const nextSession = {
    ...updatedSession,
    id: sessionId,
    workoutId: existingSession.workoutId,
    workoutTitle: existingSession.workoutTitle,
    startedAt: existingSession.startedAt,
    finishedAt: existingSession.finishedAt,
  };

  return {
    ...currentState,
    workoutSessions: currentState.workoutSessions.map((session) =>
      session.id === sessionId ? nextSession : session
    ),
  };
}
