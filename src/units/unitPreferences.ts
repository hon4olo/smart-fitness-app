export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';
export type EnergyUnit = 'kcal' | 'kJ';

export type UnitPreferences = {
  weight: WeightUnit;
  length: LengthUnit;
  energy: EnergyUnit;
};

export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  weight: 'kg',
  length: 'cm',
  energy: 'kcal',
};

const KG_TO_LB = 2.2046226218;
const CM_TO_IN = 0.3937007874;
const KCAL_TO_KJ = 4.184;

const round = (value: number, precision = 1): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const weightFromKg = (valueKg: number, unit: WeightUnit): number =>
  unit === 'lb' ? valueKg * KG_TO_LB : valueKg;

export const weightToKg = (value: number, unit: WeightUnit): number =>
  unit === 'lb' ? value / KG_TO_LB : value;

export const lengthFromCm = (valueCm: number, unit: LengthUnit): number =>
  unit === 'in' ? valueCm * CM_TO_IN : valueCm;

export const lengthToCm = (value: number, unit: LengthUnit): number =>
  unit === 'in' ? value / CM_TO_IN : value;

export const energyFromKcal = (valueKcal: number, unit: EnergyUnit): number =>
  unit === 'kJ' ? valueKcal * KCAL_TO_KJ : valueKcal;

export const energyToKcal = (value: number, unit: EnergyUnit): number =>
  unit === 'kJ' ? value / KCAL_TO_KJ : value;

export const formatWeightValue = (valueKg: number, unit: WeightUnit): string =>
  `${round(weightFromKg(valueKg, unit))}`;

export const formatLengthValue = (valueCm: number, unit: LengthUnit): string =>
  `${round(lengthFromCm(valueCm, unit))}`;

export const formatEnergyValue = (valueKcal: number, unit: EnergyUnit): string =>
  `${Math.round(energyFromKcal(valueKcal, unit))}`;

export const formatEnergyInputValue = (valueKcal: number, unit: EnergyUnit): string =>
  `${round(energyFromKcal(valueKcal, unit), 1)}`;

export const parseDisplayNumber = (value: string): number =>
  Number(value.trim().replace(',', '.'));

export const displayWeightInputToKg = (value: string, unit: WeightUnit): string => {
  if (!value.trim()) return '';
  const parsed = parseDisplayNumber(value);
  if (!Number.isFinite(parsed)) return value;
  return `${round(weightToKg(parsed, unit), 3)}`;
};

export const displayLengthInputToCm = (value: string, unit: LengthUnit): string => {
  if (!value.trim()) return '';
  const parsed = parseDisplayNumber(value);
  if (!Number.isFinite(parsed)) return value;
  return `${round(lengthToCm(parsed, unit), 3)}`;
};

export const displayEnergyInputToKcal = (value: string, unit: EnergyUnit): string => {
  if (!value.trim()) return '';
  const parsed = parseDisplayNumber(value);
  if (!Number.isFinite(parsed)) return value;
  return `${round(energyToKcal(parsed, unit), 3)}`;
};
