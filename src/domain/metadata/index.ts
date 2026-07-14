export const DOMAIN_ENTITY_NAMES = [
  'appState',
  'bodyMeasurements',
  'exercises',
  'foodEntries',
  'mealTemplates',
  'nutritionTargets',
  'profile',
  'weightHistory',
  'workouts',
  'workoutSessions',
] as const;

export type DomainEntityName = (typeof DOMAIN_ENTITY_NAMES)[number];
