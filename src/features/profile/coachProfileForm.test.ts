import { describe, expect, it } from 'vitest';

import { validateCoachProfileForm } from './coachProfileForm';

const validInput = {
  dateOfBirth: '2000-05-12',
  heightCm: '175,5',
  calculationSex: 'male' as const,
  activityLevel: 'moderate' as const,
  trainingExperience: 'intermediate' as const,
};

describe('coach profile form', () => {
  it('normalizes a complete supported adult profile', () => {
    expect(
      validateCoachProfileForm(validInput, new Date('2026-07-23T12:00:00.000Z')),
    ).toEqual({
      valid: true,
      value: {
        dateOfBirth: '2000-05-12',
        height: '175.5',
        calculationSex: 'male',
        activityLevel: 'moderate',
        trainingExperience: 'intermediate',
      },
      ageYears: 26,
      errors: {},
    });
  });

  it('rejects impossible dates and unsupported ages', () => {
    expect(
      validateCoachProfileForm(
        { ...validInput, dateOfBirth: '2000-02-30' },
        new Date('2026-07-23T12:00:00.000Z'),
      ),
    ).toMatchObject({
      valid: false,
      errors: { dateOfBirth: 'Use YYYY-MM-DD.' },
    });

    expect(
      validateCoachProfileForm(
        { ...validInput, dateOfBirth: '2010-01-01' },
        new Date('2026-07-23T12:00:00.000Z'),
      ),
    ).toMatchObject({
      valid: false,
      errors: { dateOfBirth: 'Nutrition Coach currently supports ages 18–100.' },
    });
  });

  it('returns field-specific errors for missing enum inputs and invalid height', () => {
    expect(
      validateCoachProfileForm(
        {
          ...validInput,
          heightCm: '400',
          calculationSex: null,
          activityLevel: null,
          trainingExperience: null,
        },
        new Date('2026-07-23T12:00:00.000Z'),
      ),
    ).toMatchObject({
      valid: false,
      errors: {
        heightCm: 'Enter a height from 50 to 300 cm.',
        calculationSex: 'Select the formula input.',
        activityLevel: 'Select an activity level.',
        trainingExperience: 'Select training experience.',
      },
    });
  });
});
