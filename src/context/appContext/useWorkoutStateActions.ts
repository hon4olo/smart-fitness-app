import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import { upsertWorkoutSessionById } from '@/lib/workouts';
import type { AppState, TrainingProgram, WorkoutSession } from '@/types';

import type { ScheduleAppStateMutation } from './useAppMutationQueue';
import {
  addWorkoutTemplateToState,
  deleteCustomExerciseFromState,
  deleteCustomWorkoutTemplateFromState,
  deleteTrainingProgramFromState,
  deleteWorkoutSessionFromState,
  saveTrainingProgramToState,
  toggleTrainingProgramFavoriteInState,
  updateCustomWorkoutTemplateInState,
  updateWorkoutSessionPreservingImmutableFields,
} from './workoutActions';

type WorkoutStateActionsOptions = {
  scheduleStateMutation: ScheduleAppStateMutation;
  setState: Dispatch<SetStateAction<AppState>>;
};

export function useWorkoutStateActions({
  scheduleStateMutation,
  setState,
}: WorkoutStateActionsOptions) {
  const addExercise = useCallback(
    (exercise: {
      id: string;
      name: string;
      muscleGroup?: string;
      isCustom: boolean;
      createdAt: string;
    }) => {
      setState((currentState) => {
        const nextState = {
          ...currentState,
          exercises: [
            ...currentState.exercises,
            {
              ...exercise,
              isCustom: true,
              createdAt: exercise.createdAt ?? new Date().toISOString(),
            },
          ],
        };
        scheduleStateMutation({ label: 'Save custom exercise', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const addWorkoutTemplate = useCallback(
    (template: {
      id: string;
      title: string;
      description?: string;
      exercises: string[];
      createdAt: string;
    }) => {
      setState((currentState) => {
        const nextState = addWorkoutTemplateToState(currentState, template);
        scheduleStateMutation({ label: 'Save workout template', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const updateWorkoutTemplate = useCallback(
    (
      templateId: string,
      updatedTemplate: { title: string; description?: string; exercises: string[] },
    ) => {
      setState((currentState) => {
        const nextState = updateCustomWorkoutTemplateInState(
          currentState,
          templateId,
          updatedTemplate,
          new Date().toISOString(),
        );
        scheduleStateMutation({ label: 'Update workout template', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const saveTrainingProgram = useCallback(
    (program: TrainingProgram) => {
      setState((currentState) => {
        const nextState = saveTrainingProgramToState(
          currentState,
          program,
          new Date().toISOString(),
        );
        scheduleStateMutation({ label: 'Save training program', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const deleteTrainingProgram = useCallback(
    (programId: string) => {
      setState((currentState) => {
        const nextState = deleteTrainingProgramFromState(currentState, programId);
        scheduleStateMutation({ label: 'Delete training program', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const toggleTrainingProgramFavorite = useCallback(
    (programId: string) => {
      setState((currentState) => {
        const nextState = toggleTrainingProgramFavoriteInState(
          currentState,
          programId,
          new Date().toISOString(),
        );
        scheduleStateMutation({ label: 'Update training program favorite', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const deleteWorkoutTemplate = useCallback(
    (templateId: string) => {
      setState((currentState) => {
        const nextState = deleteCustomWorkoutTemplateFromState(currentState, templateId);
        scheduleStateMutation({ label: 'Delete workout template', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const deleteExercise = useCallback(
    (exerciseId: string) => {
      setState((currentState) => {
        const nextState = deleteCustomExerciseFromState(currentState, exerciseId);
        scheduleStateMutation({ label: 'Delete custom exercise', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const saveWorkoutSession = useCallback(
    (session: WorkoutSession) => {
      setState((currentState) => {
        const nextState = {
          ...currentState,
          workoutSessions: upsertWorkoutSessionById(currentState.workoutSessions, session),
        };
        scheduleStateMutation({ label: 'Save workout session', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const deleteWorkoutSession = useCallback(
    (sessionId: string) => {
      setState((currentState) => {
        const nextState = deleteWorkoutSessionFromState(currentState, sessionId);
        scheduleStateMutation({ label: 'Delete workout session', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const updateWorkoutSession = useCallback(
    (sessionId: string, updatedSession: WorkoutSession) => {
      setState((currentState) => {
        const nextState = updateWorkoutSessionPreservingImmutableFields(
          currentState,
          sessionId,
          updatedSession,
        );
        scheduleStateMutation({ label: 'Update workout session', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  return {
    addExercise,
    addWorkoutTemplate,
    deleteExercise,
    deleteTrainingProgram,
    deleteWorkoutSession,
    deleteWorkoutTemplate,
    saveTrainingProgram,
    saveWorkoutSession,
    toggleTrainingProgramFavorite,
    updateWorkoutSession,
    updateWorkoutTemplate,
  };
}
