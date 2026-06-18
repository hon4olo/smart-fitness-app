import AsyncStorage from '@react-native-async-storage/async-storage';
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

export type {
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


type AppState = {
  workouts: Workout[];
  exercises: Exercise[];
  workoutSessions: WorkoutSession[];
  foodEntries: FoodEntry[];
  mealTemplates: MealTemplate[];
  nutrition: NutritionState;
  nutritionTargets: NutritionTargets;
  weightHistory: WeightEntry[];
  bodyMeasurements: BodyMeasurement[];
  profile: ProfileState;
  onboardingCompleted: boolean;
};

type AppContextType = AppState & {
  addWeightEntry: (entry: WeightEntry) => void;
  addBodyMeasurement: (entry: BodyMeasurement) => void;
  addFoodEntry: (entry: FoodEntry) => void;
  addFoodEntries: (entries: FoodEntry[]) => void;
  addMealTemplate: (template: MealTemplate) => void;
  addExercise: (exercise: {
    id: string;
    name: string;
    muscleGroup?: string;
    isCustom: boolean;
    createdAt: string;
  }) => void;
  addWorkoutTemplate: (template: {
    id: string;
    title: string;
    description?: string;
    exercises: string[];
    createdAt: string;
  }) => void;
  updateWorkoutTemplate: (
    templateId: string,
    updatedTemplate: {
      title: string;
      description?: string;
      exercises: string[];
    }
  ) => void;
  updateNutritionTargets: (targets: NutritionTargets) => void;
  updateProfileGoals: (goals: {
    targetWeight: number;
    goalType: ProfileGoalType;
    weeklyWeightChangeGoal: number;
    trainingDaysPerWeek: number;
  }) => void;
  updateFoodEntry: (entryId: string, updatedEntry: FoodEntry) => void;
  deleteFoodEntry: (entryId: string) => void;
  deleteMealTemplate: (templateId: string) => void;
  deleteExercise: (exerciseId: string) => void;
  deleteWorkoutTemplate: (templateId: string) => void;
  deleteWeightEntry: (entryId: string) => void;
  deleteBodyMeasurement: (entryId: string) => void;
  deleteWorkoutSession: (sessionId: string) => void;
  updateWorkoutSession: (sessionId: string, updatedSession: WorkoutSession) => void;
  saveWorkoutSession: (session: WorkoutSession) => void;
  getLastWorkoutSession: () => WorkoutSession | null;
  completeOnboarding: (setup: {
    currentWeight: number;
    targetWeight: number;
    goalType: ProfileGoalType;
    trainingDaysPerWeek: number;
  }) => void;
  resetOnboarding: () => void;
};

const APP_STATE_KEY = '@smart_fitness_mvp_state';
const DEFAULT_WORKOUT_TEMPLATE_IDS = new Set(['push-a', 'legs-a', 'conditioning-a']);
const DEFAULT_APP_DATA_CREATED_AT = '2000-01-01T00:00:00.000Z';

const defaultState: AppState = {
  workouts: [
    {
      id: 'push-a',
      title: 'Upper Body Strength',
      createdAt: DEFAULT_APP_DATA_CREATED_AT,
      isCustom: false,
      duration: '45 min',
      exercises: [
        {
          id: 'bench-press',
          name: 'Bench press',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
        {
          id: 'one-arm-row',
          name: 'One-arm row',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
        {
          id: 'shoulder-press',
          name: 'Shoulder press',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
        {
          id: 'lat-pulldown',
          name: 'Lat pulldown',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
      ],
    },
    {
      id: 'legs-a',
      title: 'Lower Body',
      createdAt: DEFAULT_APP_DATA_CREATED_AT,
      isCustom: false,
      duration: '50 min',
      exercises: [
        {
          id: 'back-squat',
          name: 'Back squat',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
        {
          id: 'romanian-deadlift',
          name: 'Romanian deadlift',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
        {
          id: 'walking-lunge',
          name: 'Walking lunge',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
        {
          id: 'calf-raise',
          name: 'Calf raise',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
      ],
    },
    {
      id: 'conditioning-a',
      title: 'Conditioning',
      createdAt: DEFAULT_APP_DATA_CREATED_AT,
      isCustom: false,
      duration: '30 min',
      exercises: [
        {
          id: 'bike-intervals',
          name: 'Bike intervals',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
        {
          id: 'kettlebell-swing',
          name: 'Kettlebell swing',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
        {
          id: 'plank',
          name: 'Plank',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
        {
          id: 'farmer-carry',
          name: 'Farmer carry',
          isCustom: false,
          createdAt: DEFAULT_APP_DATA_CREATED_AT,
        },
      ],
    },
  ],
  mealTemplates: [],
  exercises: [
    { id: 'bench-press', name: 'Bench Press', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    {
      id: 'incline-dumbbell-press',
      name: 'Incline Dumbbell Press',
      isCustom: false,
      createdAt: DEFAULT_APP_DATA_CREATED_AT,
    },
    { id: 'pull-up', name: 'Pull-up', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'barbell-row', name: 'Barbell Row', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'squat', name: 'Squat', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    {
      id: 'romanian-deadlift',
      name: 'Romanian Deadlift',
      isCustom: false,
      createdAt: DEFAULT_APP_DATA_CREATED_AT,
    },
    { id: 'leg-press', name: 'Leg Press', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'shoulder-press', name: 'Shoulder Press', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'lateral-raise', name: 'Lateral Raise', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'biceps-curl', name: 'Biceps Curl', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    {
      id: 'triceps-pushdown',
      name: 'Triceps Pushdown',
      isCustom: false,
      createdAt: DEFAULT_APP_DATA_CREATED_AT,
    },
  ],
  workoutSessions: [],
  foodEntries: [],
  nutrition: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  },
  nutritionTargets: {
    calories: 2800,
    protein: 160,
    carbs: 350,
    fats: 80,
  },
  weightHistory: [],
  bodyMeasurements: [],
  onboardingCompleted: false,
  profile: {
    height: '',
    weight: '',
    goal: '',
    activityLevel: '',
    targetWeight: 75,
    goalType: 'gain_muscle',
    weeklyWeightChangeGoal: 0.25,
    trainingDaysPerWeek: 3,
  },
};

const AppContext = createContext<AppContextType | null>(null);

const persistState = async (state: AppState) => {
  try {
    await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to persist MVP app state', error);
  }
};

const createExerciseId = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const normalizeWorkouts = (workouts: Workout[]) => {
  return workouts.map((workout) => ({
    ...workout,
    createdAt: workout.createdAt ?? new Date().toISOString(),
    isCustom: workout.isCustom ?? !DEFAULT_WORKOUT_TEMPLATE_IDS.has(workout.id),
    exercises: workout.exercises.map((exercise, index) => {
      if (typeof exercise === 'string') {
        return {
          id: `${createExerciseId(exercise)}-${index}`,
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
    }),
  }));
};

const normalizeExercises = (exercises: Exercise[]) => {
  return exercises.map((exercise) => ({
    ...exercise,
    isCustom: exercise.isCustom ?? false,
    createdAt: exercise.createdAt ?? new Date().toISOString(),
  }));
};

const normalizeFoodEntries = (foodEntries: FoodEntry[]) => {
  return foodEntries.map((entry) => ({
    ...entry,
    date: entry.date ?? (entry.createdAt ? entry.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    mealType: entry.mealType ?? 'breakfast',
    carbs: entry.carbs ?? 0,
    fats: entry.fats ?? 0,
    source: entry.source ?? 'manual',
    createdAt: entry.createdAt ?? new Date().toISOString(),
  }));
};

const normalizeMealTemplates = (mealTemplates: MealTemplate[]) => {
  return mealTemplates.map((template) => ({
    ...template,
    createdAt: template.createdAt ?? new Date().toISOString(),
    items: normalizeFoodEntries(template.items ?? []).map((item, index) => ({
      ...item,
      id: `${template.id}-item-${index}`,
    })),
  }));
};

const normalizeWeightHistory = (weightHistory: WeightEntry[]) => {
  return weightHistory
    .map((entry) => {
      const parsedDate = new Date(`${entry.date} 2026`);

      return {
        ...entry,
        createdAt:
          entry.createdAt ??
          (Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const normalizeBodyMeasurements = (bodyMeasurements: BodyMeasurement[]) => {
  return bodyMeasurements
    .map((entry) => ({
      ...entry,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const storedState = await AsyncStorage.getItem(APP_STATE_KEY);

        if (storedState) {
          const parsedState = JSON.parse(storedState) as Partial<AppState>;

          setState({
            ...defaultState,
            ...parsedState,
            workouts: normalizeWorkouts(parsedState.workouts ?? defaultState.workouts),
            exercises: normalizeExercises(parsedState.exercises ?? defaultState.exercises),
            workoutSessions: parsedState.workoutSessions ?? defaultState.workoutSessions,
            foodEntries: normalizeFoodEntries(parsedState.foodEntries ?? defaultState.foodEntries),
            mealTemplates: normalizeMealTemplates(parsedState.mealTemplates ?? defaultState.mealTemplates),
            nutritionTargets: parsedState.nutritionTargets ?? defaultState.nutritionTargets,
            profile: {
              ...defaultState.profile,
              ...(parsedState.profile ?? {}),
            },
            onboardingCompleted: parsedState.onboardingCompleted ?? defaultState.onboardingCompleted,
            weightHistory: normalizeWeightHistory(
              parsedState.weightHistory ?? defaultState.weightHistory
            ),
            bodyMeasurements: normalizeBodyMeasurements(
              parsedState.bodyMeasurements ?? defaultState.bodyMeasurements
            ),
          });
        }
      } catch (error) {
        console.warn('Failed to restore MVP app state', error);
      }
    };

    void restoreState();
  }, []);

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
      void persistState(nextState);
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
      void persistState(nextState);
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
      void persistState(nextState);
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
        void persistState(nextState);
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
        void persistState(nextState);
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
        void persistState(nextState);
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
      void persistState(nextState);
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
      void persistState(nextState);
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
      void persistState(nextState);
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
      void persistState(nextState);
      return nextState;
    });
  }, []);

  const deleteMealTemplate = useCallback((templateId: string) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        mealTemplates: currentState.mealTemplates.filter((template) => template.id !== templateId),
      };
      void persistState(nextState);
      return nextState;
    });
  }, []);

  const updateNutritionTargets = useCallback((targets: NutritionTargets) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        nutritionTargets: targets,
      };
      void persistState(nextState);
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
        void persistState(nextState);
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
      void persistState(nextState);
      return nextState;
    });
  }, []);

  const addBodyMeasurement = useCallback((entry: BodyMeasurement) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        bodyMeasurements: [entry, ...currentState.bodyMeasurements],
      };
      void persistState(nextState);
      return nextState;
    });
  }, []);

  const deleteWeightEntry = useCallback((entryId: string) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        weightHistory: currentState.weightHistory.filter((entry) => entry.id !== entryId),
      };
      void persistState(nextState);
      return nextState;
    });
  }, []);

  const deleteBodyMeasurement = useCallback((entryId: string) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        bodyMeasurements: currentState.bodyMeasurements.filter((entry) => entry.id !== entryId),
      };
      void persistState(nextState);
      return nextState;
    });
  }, []);

  const saveWorkoutSession = useCallback((session: WorkoutSession) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        workoutSessions: [...currentState.workoutSessions, session],
      };
      void persistState(nextState);
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
        void persistState(nextState);
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
      void persistState(nextState);
      return nextState;
    });
  }, []);

  const deleteWorkoutSession = useCallback((sessionId: string) => {
    setState((currentState) => {
      const nextState = {
        ...currentState,
        workoutSessions: currentState.workoutSessions.filter((session) => session.id !== sessionId),
      };
      void persistState(nextState);
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
      void persistState(nextState);
      return nextState;
    });
  }, []);

  const getLastWorkoutSession = useCallback(() => {
    return state.workoutSessions.at(-1) ?? null;
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return context;
}
