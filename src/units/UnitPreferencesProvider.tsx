import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { useLocalization } from '@/localization';

import {
  DEFAULT_UNIT_PREFERENCES,
  energyFromKcal,
  lengthFromCm,
  type EnergyUnit,
  type LengthUnit,
  type UnitPreferences,
  type WeightUnit,
  weightFromKg,
} from './unitPreferences';

export const UNIT_PREFERENCES_STORAGE_KEY = '@smart_fitness_unit_preferences';

type UnitPreferencesContextValue = UnitPreferences & {
  formatEnergyValue(valueKcal: number): string;
  formatLengthValue(valueCm: number): string;
  formatWeightValue(valueKg: number): string;
  setWeightUnit(unit: WeightUnit): void;
  setLengthUnit(unit: LengthUnit): void;
  setEnergyUnit(unit: EnergyUnit): void;
};

const UnitPreferencesContext = createContext<UnitPreferencesContextValue | null>(null);

const parseStoredPreferences = (value: string | null): UnitPreferences => {
  if (!value) return DEFAULT_UNIT_PREFERENCES;
  try {
    const parsed = JSON.parse(value) as Partial<UnitPreferences>;
    return {
      weight: parsed.weight === 'lb' ? 'lb' : 'kg',
      length: parsed.length === 'in' ? 'in' : 'cm',
      energy: parsed.energy === 'kJ' ? 'kJ' : 'kcal',
    };
  } catch {
    return DEFAULT_UNIT_PREFERENCES;
  }
};

export function UnitPreferencesProvider({ children }: PropsWithChildren) {
  const { formatNumber } = useLocalization();
  const [preferences, setPreferences] = useState<UnitPreferences>(DEFAULT_UNIT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(UNIT_PREFERENCES_STORAGE_KEY)
      .then((stored) => {
        if (!cancelled) setPreferences(parseStoredPreferences(stored));
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(UNIT_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [hydrated, preferences]);

  const value = useMemo<UnitPreferencesContextValue>(
    () => ({
      ...preferences,
      formatWeightValue: (valueKg) =>
        formatNumber(weightFromKg(valueKg, preferences.weight), { maximumFractionDigits: 1 }),
      formatLengthValue: (valueCm) =>
        formatNumber(lengthFromCm(valueCm, preferences.length), { maximumFractionDigits: 1 }),
      formatEnergyValue: (valueKcal) =>
        formatNumber(energyFromKcal(valueKcal, preferences.energy), { maximumFractionDigits: 0 }),
      setWeightUnit: (weight) => setPreferences((current) => ({ ...current, weight })),
      setLengthUnit: (length) => setPreferences((current) => ({ ...current, length })),
      setEnergyUnit: (energy) => setPreferences((current) => ({ ...current, energy })),
    }),
    [formatNumber, preferences],
  );

  return <UnitPreferencesContext.Provider value={value}>{children}</UnitPreferencesContext.Provider>;
}

export function useUnitPreferences() {
  const context = useContext(UnitPreferencesContext);
  if (!context) throw new Error('useUnitPreferences must be used within UnitPreferencesProvider');
  return context;
}

export { parseStoredPreferences };
