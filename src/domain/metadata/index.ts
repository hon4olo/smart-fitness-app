export const DOMAIN_ENTITY_NAMES = [
  'appState',
  'bodyMeasurements',
  'customExercises',
  'exercises',
  'fitnessProfiles',
  'foodEntries',
  'mealTemplates',
  'nutritionTargets',
  'profile',
  'recoveryCheckIns',
  'trainingPrograms',
  'userLimitations',
  'weightHistory',
  'workouts',
  'workoutSessions',
] as const;

export type DomainEntityName = (typeof DOMAIN_ENTITY_NAMES)[number];
