import type { SupportedLocale } from './messages';

type ProfileGoalsValidationCopy = {
  targetWeight: string;
  weeklyWeightChange: string;
  trainingDays: string;
};

const en: ProfileGoalsValidationCopy = {
  targetWeight: 'Enter a target weight greater than zero.',
  weeklyWeightChange: 'Enter a weekly weight change of zero or more.',
  trainingDays: 'Enter a whole number from 1 to 7.',
};

const ru: ProfileGoalsValidationCopy = {
  targetWeight: 'Введите целевой вес больше нуля.',
  weeklyWeightChange: 'Введите изменение веса за неделю не меньше нуля.',
  trainingDays: 'Введите целое число тренировочных дней от 1 до 7.',
};

export const getProfileGoalsValidationCopy = (
  locale: SupportedLocale,
): ProfileGoalsValidationCopy => (locale === 'ru' ? ru : en);
