import { describe, expect, it } from 'vitest';

import { parseStoredPreferences } from '@/units/UnitPreferencesProvider';
import {
  DEFAULT_UNIT_PREFERENCES,
  displayEnergyInputToKcal,
  displayLengthInputToCm,
  displayWeightInputToKg,
  energyFromKcal,
  energyToKcal,
  formatEnergyInputValue,
  formatEnergyValue,
  formatLengthValue,
  formatWeightValue,
  lengthToCm,
  weightToKg,
} from '@/units/unitPreferences';

describe('unit preferences', () => {
  it('fails closed to metric defaults for missing or corrupt storage', () => {
    expect(parseStoredPreferences(null)).toEqual(DEFAULT_UNIT_PREFERENCES);
    expect(parseStoredPreferences('{bad json')).toEqual(DEFAULT_UNIT_PREFERENCES);
  });

  it('accepts only supported stored values', () => {
    expect(parseStoredPreferences('{"weight":"lb","length":"in","energy":"kJ"}')).toEqual({
      weight: 'lb',
      length: 'in',
      energy: 'kJ',
    });
    expect(parseStoredPreferences('{"weight":"stone","length":"m","energy":"cal"}')).toEqual(
      DEFAULT_UNIT_PREFERENCES,
    );
  });

  it('converts display values while preserving canonical metric storage', () => {
    expect(formatWeightValue(100, 'lb')).toBe('220.5');
    expect(weightToKg(220.46226218, 'lb')).toBeCloseTo(100, 6);
    expect(formatLengthValue(175, 'in')).toBe('68.9');
    expect(lengthToCm(68.8976378, 'in')).toBeCloseTo(175, 5);
    expect(energyFromKcal(100, 'kJ')).toBeCloseTo(418.4, 6);
    expect(energyToKcal(418.4, 'kJ')).toBeCloseTo(100, 6);
    expect(formatEnergyValue(100, 'kJ')).toBe('418');
    expect(formatEnergyInputValue(100, 'kJ')).toBe('418.4');
  });

  it('accepts decimal commas at weight, length, and energy input boundaries', () => {
    expect(Number(displayWeightInputToKg('220,5', 'lb'))).toBeCloseTo(100.017, 3);
    expect(Number(displayLengthInputToCm('68,9', 'in'))).toBeCloseTo(175.006, 3);
    expect(Number(displayEnergyInputToKcal('418,4', 'kJ'))).toBeCloseTo(100, 3);
    expect(displayWeightInputToKg('', 'lb')).toBe('');
    expect(displayLengthInputToCm('', 'in')).toBe('');
    expect(displayEnergyInputToKcal('', 'kJ')).toBe('');
    expect(displayEnergyInputToKcal('bad', 'kJ')).toBe('bad');
  });
});
