import type { ProfileState, WeightEntry } from '@/types';

const ACTIVITY_LEVELS = new Set([
  'sedentary',
  'light',
  'moderate',
  'high',
  'very_high',
]);

const TRAINING_EXPERIENCE_LEVELS = new Set(['beginner', 'intermediate', 'advanced']);

const parseProfileNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
};

const isAdultDateOfBirth = (value: string | null): boolean => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const birthDate = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(birthDate.getTime())) return false;

  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayPassed =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() >= birthDate.getUTCDate());
  if (!birthdayPassed) age -= 1;

  return age >= 18 && age <= 100;
};

export const hasCompleteOnboardingData = ({
  profile,
  weightHistory,
}: {
  profile: ProfileState;
  weightHistory: WeightEntry[];
}): boolean => {
  const height = parseProfileNumber(profile.height);
  const targetWeight = Number(profile.targetWeight);
  const trainingDays = Number(profile.trainingDaysPerWeek);

  return (
    isAdultDateOfBirth(profile.dateOfBirth) &&
    ACTIVITY_LEVELS.has(profile.activityLevel) &&
    Boolean(
      profile.trainingExperience &&
        TRAINING_EXPERIENCE_LEVELS.has(profile.trainingExperience),
    ) &&
    Number.isFinite(height) &&
    height >= 50 &&
    height <= 300 &&
    Number.isFinite(targetWeight) &&
    targetWeight > 0 &&
    Number.isInteger(trainingDays) &&
    trainingDays >= 1 &&
    trainingDays <= 7 &&
    weightHistory.some((entry) => Number.isFinite(entry.weight) && entry.weight > 0)
  );
};
