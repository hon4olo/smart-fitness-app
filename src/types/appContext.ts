import type {
  BodyMeasurement,
  Exercise,
  FoodEntry,
  MealTemplate,
  NutritionState,
  NutritionTargets,
  ProfileGoalType,
  ProfileState,
  TrainingProgram,
  WeightEntry,
  Workout,
  WorkoutSession,
  WorkoutSet,
} from './index';

export type AppState = {
  workouts: Workout[];
  trainingPrograms: TrainingProgram[];
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

export type AppContextType = AppState & {
  addWeightEntry: (entry: WeightEntry) => void;
  updateWeightEntry: (entryId: string, entry: WeightEntry) => void;
  addBodyMeasurement: (entry: BodyMeasurement) => void;
  replaceState: (state: AppState) => void;
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
  saveTrainingProgram: (program: TrainingProgram) => void;
  deleteTrainingProgram: (programId: string) => void;
  toggleTrainingProgramFavorite: (programId: string) => void;
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
  isRestoringState: boolean;
  getLastWorkoutSession: () => WorkoutSession | null;
  completeOnboarding: (setup: {
    currentWeight: number;
    targetWeight: number;
    goalType: ProfileGoalType;
    trainingDaysPerWeek: number;
  }) => void;
  resetOnboarding: () => void;
};
