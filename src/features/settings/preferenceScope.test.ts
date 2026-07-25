import { describe, expect, it } from 'vitest';

import { getNutritionFoodLibraryStorageKey } from '@/features/nutrition/nutritionFoodLibrary';

import {
  DEVICE_SCOPED_PREFERENCE_KEYS,
  explainPreferenceScope,
  getPreferenceScope,
} from './preferenceScope';

describe('Settings preference scope policy', () => {
  it('keeps language, appearance, and units device-scoped across account switches', () => {
    expect(DEVICE_SCOPED_PREFERENCE_KEYS).toEqual([
      '@smart_fitness_language_preference',
      'smart-fitness-app.appearance-mode',
      '@smart_fitness_unit_preferences',
    ]);
    expect(DEVICE_SCOPED_PREFERENCE_KEYS.every((key) => getPreferenceScope(key) === 'device')).toBe(
      true,
    );
  });

  it('keeps account data keys outside the device preference namespace', () => {
    const anonymousKey = getNutritionFoodLibraryStorageKey(null);
    const firstAccountKey = getNutritionFoodLibraryStorageKey('user-a');
    const secondAccountKey = getNutritionFoodLibraryStorageKey('user-b');

    expect(new Set([anonymousKey, firstAccountKey, secondAccountKey]).size).toBe(3);
    expect(getPreferenceScope(firstAccountKey)).toBe('account');
    expect(getPreferenceScope(secondAccountKey)).toBe('account');
    expect(firstAccountKey).not.toBe(secondAccountKey);
  });

  it('documents the current policy without implying account sync for device preferences', () => {
    expect(explainPreferenceScope()).toEqual({
      deviceScoped: ['language', 'appearance', 'units'],
      accountScoped: ['nutrition library', 'sync metadata', 'account data'],
    });
  });
});