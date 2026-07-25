import { LANGUAGE_PREFERENCE_STORAGE_KEY } from '@/localization/LocalizationProvider';
import { APPEARANCE_STORAGE_KEY } from '@/theme/appearance';
import { UNIT_PREFERENCES_STORAGE_KEY } from '@/units/UnitPreferencesProvider';

export type PreferenceScope = 'device' | 'account';

export const DEVICE_SCOPED_PREFERENCE_KEYS = [
  LANGUAGE_PREFERENCE_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
  UNIT_PREFERENCES_STORAGE_KEY,
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