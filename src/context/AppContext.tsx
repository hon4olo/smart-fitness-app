import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  AppContextType,
  AppState,
  BodyMeasurement,
  Exercise,
  FoodEntry,
  MealTemplate,
  MealType,
  NutritionState,
  NutritionTargets,
  ProfileGoalType,
  ProfileState,
  WeightEntry,
  Workout,
  WorkoutSession,
  WorkoutSet,
} from '@/types';
import { defaultState as defaultAppState } from '@/data/defaults';
import { createExerciseId, getLastWorkoutSession as getLastWorkoutSessionFromState } from '@/lib/appState';
import { createRepositoryFactory } from '@/repositories';
import { createAsyncStorageAdapter } from '@/storage';
import { AuthProvider } from '@/auth';

export type {
  AppContextType,
  AppState,
  BodyMeasurement,
  Exercise,
  FoodEntry,
  MealTemplate,
  MealType,
  NutritionState,
  NutritionTargets,
  ProfileGoalType,
  ProfileState,
  WeightEntry,
  Workout,
  WorkoutSession,
  WorkoutSet,
} from '@/types';

const defaultState: AppState = defaultAppState;

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(defaultState);
  const repositoryProvider = useMemo(() => createRepositoryFactory(createAsyncStorageAdapter()), []);
  const repository = useMemo(() => repositoryProvider.getRepository(), [repositoryProvider]);
  const authService = useMemo(() => repositoryProvider.getAuthService(), [repositoryProvider]);

  useEffect(() => {
    let cancelled = false;

    const restoreState = async () => {
      const storedState = await repository.loadState();

      if (storedState && !cancelled) {
        setState(storedState);
      }
    };

    void restoreState();

    return () => {
      cancelled = true;
    };
  }, [repository]);

  const addFoodEntry = useCallback((entry: FoodEntry) => {
    setState((currentState) => {
      const foodEntry = {
        ...entry,
        mealType: entry.mealType ?? 'breakfast',
        source: entry.source ?? 'manual',
        createdAt: entry.createdAt ?? new Date().toISOString(),
      };
      const nextState = {
        ...currentState,
        foodEntries: [foodEntry, ...currentState.foodEntries],
        nutrition: {
          calories: currentState.nutrition.calories + foodEntry.calories,
          protein: currentState.nutrition.protein + foodEntry.protein,
          carbs: currentState.nutrition.carbs + foodEntry.carbs,
          fats: currentState.nutrition.fats + foodEntry.fats,
        },
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const addFoodEntries = useCallback((entries: FoodEntry[]) => {
    setState((currentState) => {
      const normalizedEntries = entries.map((entry) => ({
        ...entry,
        mealType: entry.mealType ?? 'breakfast',
        source: entry.source ?? 'manual',
        createdAt: entry.createdAt ?? new Date().toISOString(),
      }));
      const addedNutrition = normalizedEntries.reduce(
        (totals, entry) => ({
          calories: totals.calories + entry.calories,
          protein: totals.protein + entry.protein,
          carbs: totals.carbs + entry.carbs,
          fats: totals.fats + entry.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );
      const nextState = {
        ...currentState,
        foodEntries: [...normalizedEntries, ...currentState.foodEntries],
        nutrition: {
          calories: currentState.nutrition.calories + addedNutrition.calories,
          protein: currentState.nutrition.protein + addedNutrition.protein,
          carbs: currentState.nutrition.carbs + addedNutrition.carbs,
          fats: currentState.nutrition.fats + addedNutrition.fats,
        },
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const addMealTemplate = useCallback((template: MealTemplate) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        mealTemplates: [
          {
            ...template,
            createdAt: template.createdAt ?? new Date().toISOString(),
            items: template.items.map((item) => ({ ...item })),
          },
          ...currentState.mealTemplates,
        ],
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

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
        void repository.saveState(nextState);
        return nextState;
      });
    },
    []
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
        const nextState = {
          ...currentState,
          workouts: [
            ...currentState.workouts,
            {
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
            },
          ],
        };
        void repository.saveState(nextState);
        return nextState;
      });
    },
    []
  );

  const updateWorkoutTemplate = useCallback(
    (
      templateId: string,
      updatedTemplate: {
        title: string;
        description?: string;
        exercises: string[];
      }
    ) => {
      setState((currentState) => {
        const workout = currentState.workouts.find((item) => item.id === templateId);

        if (!workout || !workout.isCustom) {
          return currentState;
        }

        const nextState = {
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
                    createdAt: item.createdAt ?? new Date().toISOString(),
                  })),
                }
              : item
          ),
        };
        void repository.saveState(nextState);
        return nextState;
      });
    },
    []
  );

  const updateFoodEntry = useCallback((entryId: string, updatedEntry: FoodEntry) => {
    setState((currentState) => {
      const oldEntry = currentState.foodEntries.find((foodEntry) => foodEntry.id === entryId);

      if (!oldEntry) {
        return currentState;
      }

      const foodEntry = {
        ...updatedEntry,
        id: entryId,
        mealType: updatedEntry.mealType ?? oldEntry.mealType,
        source: updatedEntry.source ?? oldEntry.source,
        createdAt: updatedEntry.createdAt ?? oldEntry.createdAt,
      };
      const nextState = {
        ...currentState,
        foodEntries: currentState.foodEntries.map((entry) =>
          entry.id === entryId ? foodEntry : entry
        ),
        nutrition: {
          calories: Math.max(0, currentState.nutrition.calories - oldEntry.calories + foodEntry.calories),
          protein: Math.max(0, currentState.nutrition.protein - oldEntry.protein + foodEntry.protein),
          carbs: Math.max(0, currentState.nutrition.carbs - oldEntry.carbs + foodEntry.carbs),
          fats: Math.max(0, currentState.nutrition.fats - oldEntry.fats + foodEntry.fats),
        },
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const deleteWorkoutTemplate = useCallback((templateId: string) => {
    setState((currentState) => {
      const workout = currentState.workouts.find((item) => item.id === templateId);

      if (!workout || !workout.isCustom) {
        return currentState;
      }

      const nextState = {
        ...currentState,
        workouts: currentState.workouts.filter((item) => item.id !== templateId),
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const deleteExercise = useCallback((exerciseId: string) => {
    setState((currentState) => {
      const exercise = currentState.exercises.find((item) => item.id === exerciseId);

      if (!exercise || !exercise.isCustom) {
        return currentState;
      }

      const nextState = {
        ...currentState,
        exercises: currentState.exercises.filter((item) => item.id !== exerciseId),
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const deleteFoodEntry = useCallback((entryId: string) => {
    setState((currentState) => {
      const entry = currentState.foodEntries.find((foodEntry) => foodEntry.id === entryId);

      if (!entry) {
        return currentState;
      }

      const nextState = {
        ...currentState,
        foodEntries: currentState.foodEntries.filter((foodEntry) => foodEntry.id !== entryId),
        nutrition: {
          calories: Math.max(0, currentState.nutrition.calories - entry.calories),
          protein: Math.max(0, currentState.nutrition.protein - entry.protein),
          carbs: Math.max(0, currentState.nutrition.carbs - entry.carbs),
          fats: Math.max(0, currentState.nutrition.fats - entry.fats),
        },
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const deleteMealTemplate = useCallback((templateId: string) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        mealTemplates: currentState.mealTemplates.filter((template) => template.id !== templateId),
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const updateNutritionTargets = useCallback((targets: NutritionTargets) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        nutritionTargets: targets,
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const updateProfileGoals = useCallback(
    (goals: {
      targetWeight: number;
      goalType: ProfileGoalType;
      weeklyWeightChangeGoal: number;
      trainingDaysPerWeek: number;
    }) => {
      setState((currentState) => {
        const nextState = {
          ...currentState,
          profile: {
            ...currentState.profile,
            ...goals,
          },
        };
        void repository.saveState(nextState);
        return nextState;
      });
    },
    []
  );

  const addWeightEntry = useCallback((entry: WeightEntry) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        weightHistory: [entry, ...currentState.weightHistory],
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const addBodyMeasurement = useCallback((entry: BodyMeasurement) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        bodyMeasurements: [entry, ...currentState.bodyMeasurements],
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const deleteWeightEntry = useCallback((entryId: string) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        weightHistory: currentState.weightHistory.filter((entry) => entry.id !== entryId),
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const deleteBodyMeasurement = useCallback((entryId: string) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        bodyMeasurements: currentState.bodyMeasurements.filter((entry) => entry.id !== entryId),
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const saveWorkoutSession = useCallback((session: WorkoutSession) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        workoutSessions: [...currentState.workoutSessions, session],
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const completeOnboarding = useCallback(
    (setup: {
      currentWeight: number;
      targetWeight: number;
      goalType: ProfileGoalType;
      trainingDaysPerWeek: number;
    }) => {
      const today = new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
      }).format(new Date());
      const now = new Date().toISOString();

      setState((currentState) => {
        const nextState = {
          ...currentState,
          onboardingCompleted: true,
          profile: {
            ...currentState.profile,
            targetWeight: setup.targetWeight,
            goalType: setup.goalType,
            weeklyWeightChangeGoal: currentState.profile.weeklyWeightChangeGoal,
            trainingDaysPerWeek: setup.trainingDaysPerWeek,
            weight: `${setup.currentWeight.toFixed(1)} kg`,
          },
          weightHistory: [
            {
              id: `${Date.now()}`,
              date: today,
              weight: setup.currentWeight,
              createdAt: now,
            },
            ...currentState.weightHistory,
          ],
        };
        void repository.saveState(nextState);
        return nextState;
      });
    },
    []
  );

  const resetOnboarding = useCallback(() => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        onboardingCompleted: false,
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const deleteWorkoutSession = useCallback((sessionId: string) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        workoutSessions: currentState.workoutSessions.filter((session) => session.id !== sessionId),
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const updateWorkoutSession = useCallback((sessionId: string, updatedSession: WorkoutSession) => {
    setState((currentState) => {
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

      const nextState = {
        ...currentState,
        workoutSessions: currentState.workoutSessions.map((session) =>
          session.id === sessionId ? nextSession : session
        ),
      };
      void repository.saveState(nextState);
      return nextState;
    });
  }, []);

  const getLastWorkoutSession = useCallback(() => {
    return getLastWorkoutSessionFromState(state.workoutSessions);
  }, [state.workoutSessions]);

  const value = useMemo<AppContextType>(
    () => ({
      ...state,
      addBodyMeasurement,
      addFoodEntry,
      addFoodEntries,
      addMealTemplate,
      addExercise,
      addWorkoutTemplate,
      addWeightEntry,
      deleteBodyMeasurement,
      deleteFoodEntry,
      deleteMealTemplate,
      deleteExercise,
      deleteWorkoutTemplate,
      deleteWeightEntry,
      deleteWorkoutSession,
      getLastWorkoutSession,
      completeOnboarding,
      resetOnboarding,
      saveWorkoutSession,
      updateWorkoutSession,
      updateWorkoutTemplate,
      updateFoodEntry,
      updateNutritionTargets,
      updateProfileGoals,
    }),
    [
      addBodyMeasurement,
      addFoodEntry,
      addFoodEntries,
      addMealTemplate,
      addExercise,
      addWorkoutTemplate,
      addWeightEntry,
      deleteBodyMeasurement,
      deleteFoodEntry,
      deleteMealTemplate,
      deleteExercise,
      deleteWorkoutTemplate,
      deleteWeightEntry,
      deleteWorkoutSession,
      completeOnboarding,
      resetOnboarding,
      getLastWorkoutSession,
      saveWorkoutSession,
      updateWorkoutSession,
      updateWorkoutTemplate,
      updateFoodEntry,
      updateNutritionTargets,
      updateProfileGoals,
      state,
    ]
  );

  return (
    <AuthProvider service={authService}>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </AuthProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return context;
}
