import type { BodyMeasurement, Exercise, FoodEntry, MealTemplate, NutritionState, NutritionTargets, ProfileState, WeightEntry, Workout, WorkoutSession } from '@/types';

export const DEFAULT_WORKOUT_TEMPLATE_IDS = new Set(['push-a', 'legs-a', 'conditioning-a']);
export const DEFAULT_APP_DATA_CREATED_AT = '2000-01-01T00:00:00.000Z';

export type AppDefaultState = {
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

export const defaultState: AppDefaultState = {
  workouts: [
    {
      id: 'push-a',
      title: 'Upper Body Strength',
      createdAt: DEFAULT_APP_DATA_CREATED_AT,
      isCustom: false,
      duration: '45 min',
      exercises: [
        { id: 'bench-press', name: 'Bench press', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
        { id: 'one-arm-row', name: 'One-arm row', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
        { id: 'shoulder-press', name: 'Shoulder press', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
        { id: 'lat-pulldown', name: 'Lat pulldown', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
      ],
    },
    {
      id: 'legs-a',
      title: 'Lower Body',
      createdAt: DEFAULT_APP_DATA_CREATED_AT,
      isCustom: false,
      duration: '50 min',
      exercises: [
        { id: 'back-squat', name: 'Back squat', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
        { id: 'romanian-deadlift', name: 'Romanian deadlift', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
        { id: 'walking-lunge', name: 'Walking lunge', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
        { id: 'calf-raise', name: 'Calf raise', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
      ],
    },
    {
      id: 'conditioning-a',
      title: 'Conditioning',
      createdAt: DEFAULT_APP_DATA_CREATED_AT,
      isCustom: false,
      duration: '30 min',
      exercises: [
        { id: 'bike-intervals', name: 'Bike intervals', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
        { id: 'kettlebell-swing', name: 'Kettlebell swing', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
        { id: 'plank', name: 'Plank', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
        { id: 'farmer-carry', name: 'Farmer carry', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
      ],
    },
  ],
  mealTemplates: [],
  exercises: [
    { id: 'bench-press', name: 'Bench Press', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'pull-up', name: 'Pull-up', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'barbell-row', name: 'Barbell Row', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'squat', name: 'Squat', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'leg-press', name: 'Leg Press', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'shoulder-press', name: 'Shoulder Press', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'lateral-raise', name: 'Lateral Raise', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'biceps-curl', name: 'Biceps Curl', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
    { id: 'triceps-pushdown', name: 'Triceps Pushdown', isCustom: false, createdAt: DEFAULT_APP_DATA_CREATED_AT },
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
