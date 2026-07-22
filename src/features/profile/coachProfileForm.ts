import type {
  ProfileCalculationSex,
  ProfileTrainingExperience,
} from '@/types';

export type CoachActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'high'
  | 'very_high';

export type CoachProfileFormInput = {
  dateOfBirth: string;
  heightCm: string;
  calculationSex: ProfileCalculationSex | null;
  activityLevel: CoachActivityLevel | null;
  trainingExperience: ProfileTrainingExperience | null;
};

export type CoachProfileFormErrors = Partial<
  Record<keyof CoachProfileFormInput, string>
>;

export type CoachProfileFormResult =
  | {
      valid: true;
      value: {
        dateOfBirth: string;
        height: string;
        calculationSex: ProfileCalculationSex;
        activityLevel: CoachActivityLevel;
        trainingExperience: ProfileTrainingExperience;
      };
      ageYears: number;
      errors: {};
    }
  | {
      valid: false;
      errors: CoachProfileFormErrors;
    };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnly = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!DATE_PATTERN.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed) {
    return null;
  }
  return date;
};

const calculateAge = (birth: Date, asOf: Date): number => {
  let age = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    asOf.getUTCMonth() < birth.getUTCMonth() ||
    (asOf.getUTCMonth() === birth.getUTCMonth() &&
      asOf.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
};

export const validateCoachProfileForm = (
  input: CoachProfileFormInput,
  now = new Date(),
): CoachProfileFormResult => {
  const errors: CoachProfileFormErrors = {};
  const birth = parseDateOnly(input.dateOfBirth);
  let ageYears: number | null = null;

  if (!birth) {
    errors.dateOfBirth = 'Use YYYY-MM-DD.';
  } else {
    const asOf = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    ageYears = calculateAge(birth, asOf);
    if (birth > asOf) {
      errors.dateOfBirth = 'Date of birth cannot be in the future.';
    } else if (ageYears < 18 || ageYears > 100) {
      errors.dateOfBirth = 'Nutrition Coach currently supports ages 18–100.';
    }
  }

  const normalizedHeight = Number(input.heightCm.replace(',', '.').trim());
  if (!Number.isFinite(normalizedHeight) || normalizedHeight < 50 || normalizedHeight > 300) {
    errors.heightCm = 'Enter a height from 50 to 300 cm.';
  }

  if (!input.calculationSex) {
    errors.calculationSex = 'Select the formula input.';
  }
  if (!input.activityLevel) {
    errors.activityLevel = 'Select an activity level.';
  }
  if (!input.trainingExperience) {
    errors.trainingExperience = 'Select training experience.';
  }

  if (
    Object.keys(errors).length > 0 ||
    ageYears === null ||
    !input.calculationSex ||
    !input.activityLevel ||
    !input.trainingExperience
  ) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      dateOfBirth: input.dateOfBirth.trim(),
      height: String(Math.round(normalizedHeight * 100) / 100),
      calculationSex: input.calculationSex,
      activityLevel: input.activityLevel,
      trainingExperience: input.trainingExperience,
    },
    ageYears,
    errors: {},
  };
};
