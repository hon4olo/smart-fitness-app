import type { NutritionTargets, ProfileGoalType } from '@/types';

export type ProfileActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'high'
  | 'very_high';

const CALORIES_PER_KG: Record<ProfileActivityLevel, number> = {
  sedentary: 29,
  light: 31,
  moderate: 33,
  high: 35,
  very_high: 37,
};

export const normalizeProfileActivityLevel = (
  value: string,
): ProfileActivityLevel | null => {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, ProfileActivityLevel> = {
    sedentary: 'sedentary',
    light: 'light',
    lightly_active: 'light',
    moderate: 'moderate',
    moderately_active: 'moderate',
    high: 'high',
    very_active: 'high',
    very_high: 'very_high',
    athlete: 'very_high',
  };

  return aliases[normalized] ?? null;
};

export const calculateNutritionTargets = ({
  activityLevel,
  goalType,
  weightKg,
}: {
  activityLevel: ProfileActivityLevel;
  goalType: ProfileGoalType;
  weightKg: number;
}): NutritionTargets => {
  const maintenanceCalories = weightKg * CALORIES_PER_KG[activityLevel];
  const suggestedCalories =
    goalType === 'lose_fat'
      ? maintenanceCalories - 300
      : goalType === 'gain_muscle'
        ? maintenanceCalories + 250
        : maintenanceCalories;
  const calories = Math.max(1200, Math.round(suggestedCalories / 10) * 10);
  const protein = Math.round(weightKg * 2);
  const fats = Math.round(weightKg * 0.8);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));

  return { calories, protein, carbs, fats };
};

export const getProfileWeightKg = ({
  fallbackWeight,
  profileWeight,
}: {
  fallbackWeight: number;
  profileWeight: string;
}): number => {
  const parsed = Number.parseFloat(profileWeight.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackWeight;
};

export const ageToApproximateDateOfBirth = (
  age: number,
  referenceDate = new Date(),
): string => `${referenceDate.getUTCFullYear() - age}-01-01`;
