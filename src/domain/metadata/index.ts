export const DOMAIN_ENTITY_NAMES = [
  'appState',
  'bodyMeasurements',
  'exercises',
  'fitnessProfiles',
  'foodEntries',
  'mealTemplates',
  'nutritionTargets',
  'profile',
  'trainingPrograms',
  'weightHistory',
  'workouts',
  'workoutSessions',
] as const;

export type DomainEntityName = (typeof DOMAIN_ENTITY_NAMES)[number];
