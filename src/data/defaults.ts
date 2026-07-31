import type {
  BodyMeasurement,
  Exercise,
  FoodEntry,
  MealTemplate,
  NutritionState,
  NutritionTargets,
  ProfileState,
  RecoveryCheckIn,
  TrainingProgram,
  UserLimitation,
  WeightEntry,
  Workout,
  WorkoutSession,
} from '@/types';

import { BUNDLED_CONTENT_CREATED_AT } from './bundledContent';
import { exerciseDatabase } from './exercises';

export const DEFAULT_WORKOUT_TEMPLATE_IDS = new Set([
  'push-a',
  'legs-a',
  'conditioning-a',
]);

export type AppDefaultState = {
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
  userLimitations: UserLimitation[];
  recoveryCheckIns: RecoveryCheckIn[];
  profile: ProfileState;
  onboardingCompleted: boolean;
};

export const defaultState: AppDefaultState = {
  workouts: [
    {
      id: 'push-a',
      title: 'Upper Body Strength',
      createdAt: BUNDLED_CONTENT_CREATED_AT,
      isCustom: false,
      duration: '45 min',
      exercises: [
        {
          id: 'bench-press',
          name: 'Bench press',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
        {
          id: 'one-arm-row',
          name: 'One-arm row',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
        {
          id: 'shoulder-press',
          name: 'Shoulder press',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
        {
          id: 'lat-pulldown',
          name: 'Lat pulldown',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
      ],
    },
    {
      id: 'legs-a',
      title: 'Lower Body',
      createdAt: BUNDLED_CONTENT_CREATED_AT,
      isCustom: false,
      duration: '50 min',
      exercises: [
        {
          id: 'back-squat',
          name: 'Back squat',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
        {
          id: 'romanian-deadlift',
          name: 'Romanian deadlift',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
        {
          id: 'walking-lunge',
          name: 'Walking lunge',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
        {
          id: 'calf-raise',
          name: 'Calf raise',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
      ],
    },
    {
      id: 'conditioning-a',
      title: 'Conditioning',
      createdAt: BUNDLED_CONTENT_CREATED_AT,
      isCustom: false,
      duration: '30 min',
      exercises: [
        {
          id: 'bike-intervals',
          name: 'Bike intervals',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
        {
          id: 'kettlebell-swing',
          name: 'Kettlebell swing',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
        {
          id: 'plank',
          name: 'Plank',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
        {
          id: 'farmer-carry',
          name: 'Farmer carry',
          isCustom: false,
          createdAt: BUNDLED_CONTENT_CREATED_AT,
        },
      ],
    },
  ],
  trainingPrograms: [],
  mealTemplates: [],
  exercises: exerciseDatabase,
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
  userLimitations: [],
  recoveryCheckIns: [],
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
    dateOfBirth: null,
    calculationSex: null,
    trainingExperience: null,
  },
};
