export type PreferenceScope = 'device' | 'account';

export const DEVICE_SCOPED_PREFERENCE_KEYS = [
  '@smart_fitness_language_preference',
  'smart-fitness-app.appearance-mode',
  '@smart_fitness_unit_preferences',
] as const;

export const getPreferenceScope = (storageKey: string): PreferenceScope =>
  DEVICE_SCOPED_PREFERENCE_KEYS.includes(
    storageKey as (typeof DEVICE_SCOPED_PREFERENCE_KEYS)[number],
  )
    ? 'device'
    : 'account';

export const explainPreferenceScope = (): Readonly<{
  deviceScoped: readonly string[];
  accountScoped: readonly string[];
}> => ({
  deviceScoped: ['language', 'appearance', 'units'],
  accountScoped: ['nutrition library', 'sync metadata', 'account data'],
});