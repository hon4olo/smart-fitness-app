import type { CoachActivityLevel, CoachProfileFormErrors } from '@/features/profile/coachProfileForm';
import type { MessageKey, Translate } from '@/localization';
import type {
  BodyMeasurementMetric,
  ProfileGoalType,
  ProfileTrainingExperience,
  UserLimitationMovementPattern,
  WorkoutSafetyReviewStatus,
} from '@/types';

import type { SafetyRecoveryProgressPeriod } from './safetyRecoveryProgressAnalytics';

const GOAL_KEYS = {
  lose_fat: 'profile.goal.loseFat',
  maintain: 'profile.goal.maintain',
  gain_muscle: 'profile.goal.gainMuscle',
} as const satisfies Record<ProfileGoalType, MessageKey>;

const ACTIVITY_KEYS = {
  sedentary: 'profile.activity.sedentary',
  light: 'profile.activity.light',
  moderate: 'profile.activity.moderate',
  high: 'profile.activity.high',
  very_high: 'profile.activity.veryHigh',
} as const satisfies Record<CoachActivityLevel, MessageKey>;

const EXPERIENCE_KEYS = {
  beginner: 'profile.experience.beginner',
  intermediate: 'profile.experience.intermediate',
  advanced: 'profile.experience.advanced',
} as const satisfies Record<ProfileTrainingExperience, MessageKey>;

const MEASUREMENT_KEYS = {
  waist: 'measurement.metric.waist',
  chest: 'measurement.metric.chest',
  hips: 'measurement.metric.hips',
  shoulders: 'measurement.metric.shoulders',
  neck: 'measurement.metric.neck',
  upper_arm: 'measurement.metric.upperArm',
  thigh: 'measurement.metric.thigh',
  calf: 'measurement.metric.calf',
  body_fat: 'measurement.metric.bodyFat',
  custom: 'measurement.metric.custom',
} as const satisfies Record<BodyMeasurementMetric, MessageKey>;

const BODY_MEASUREMENT_ERROR_KEYS: Record<string, MessageKey> = {
  'Enter a custom measurement label.': 'measurement.error.customLabel',
  'Choose a unit supported by this measurement.': 'measurement.error.unsupportedUnit',
  'Enter a measurement greater than zero.': 'measurement.error.positiveValue',
  'Body-fat percentage cannot exceed 100%.': 'measurement.error.percentRange',
  'Measurement is outside the supported range.': 'measurement.error.supportedRange',
  'Measurement timestamp is invalid.': 'measurement.error.invalidTimestamp',
};

const COACH_ERROR_KEYS: Record<string, MessageKey> = {
  'Use YYYY-MM-DD.': 'coach.error.dateFormat',
  'Date of birth cannot be in the future.': 'coach.error.dateFuture',
  'Nutrition Coach currently supports ages 18–100.': 'coach.error.ageRange',
  'Enter a height from 50 to 300 cm.': 'coach.error.heightRange',
  'Select the formula input.': 'coach.error.formulaRequired',
  'Select an activity level.': 'coach.error.activityRequired',
  'Select training experience.': 'coach.error.experienceRequired',
};

const STATUS_KEYS = {
  ready: 'safety.status.ready',
  modify: 'safety.status.modify',
  blocked: 'safety.status.blocked',
  needs_input: 'safety.status.needsInput',
} as const satisfies Record<WorkoutSafetyReviewStatus, MessageKey>;

const PERIOD_KEYS = {
  '30d': 'safety.period.30d',
  '90d': 'safety.period.90d',
  all: 'safety.period.all',
} as const satisfies Record<SafetyRecoveryProgressPeriod, MessageKey>;

const WINDOW_KEYS = {
  '30d': 'safety.window.30d',
  '90d': 'safety.window.90d',
  all: 'safety.window.all',
} as const satisfies Record<SafetyRecoveryProgressPeriod, MessageKey>;

const MOVEMENT_KEYS = {
  squat: 'safety.movement.squat',
  hinge: 'safety.movement.hinge',
  lunge: 'safety.movement.lunge',
  horizontal_push: 'safety.movement.horizontalPush',
  vertical_push: 'safety.movement.verticalPush',
  horizontal_pull: 'safety.movement.horizontalPull',
  vertical_pull: 'safety.movement.verticalPull',
  carry: 'safety.movement.carry',
  rotation: 'safety.movement.rotation',
  locomotion: 'safety.movement.locomotion',
  impact: 'safety.movement.impact',
  overhead: 'safety.movement.overhead',
  spinal_flexion: 'safety.movement.spinalFlexion',
  spinal_extension: 'safety.movement.spinalExtension',
  other: 'safety.movement.other',
} as const satisfies Record<UserLimitationMovementPattern, MessageKey>;

export const getGoalTypeLabel = (t: Translate, value: ProfileGoalType): string =>
  t(GOAL_KEYS[value]);

export const getActivityLevelLabel = (t: Translate, value: CoachActivityLevel): string =>
  t(ACTIVITY_KEYS[value]);

export const getStoredActivityLevelLabel = (t: Translate, value: string): string => {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, CoachActivityLevel> = {
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
  const activity = aliases[normalized];
  return activity ? getActivityLevelLabel(t, activity) : t('common.notSet');
};

export const getTrainingExperienceLabel = (
  t: Translate,
  value: ProfileTrainingExperience,
): string => t(EXPERIENCE_KEYS[value]);

export const getBodyMeasurementMetricLabel = (
  t: Translate,
  metric: BodyMeasurementMetric,
): string => t(MEASUREMENT_KEYS[metric]);

export const getBodyMeasurementDisplayLabel = (
  t: Translate,
  metric: BodyMeasurementMetric | undefined,
  storedLabel: string,
): string => (metric && metric !== 'custom' ? getBodyMeasurementMetricLabel(t, metric) : storedLabel);

export const getBodyMeasurementError = (t: Translate, message: string): string =>
  t(BODY_MEASUREMENT_ERROR_KEYS[message] ?? 'measurement.error.supportedRange');

export const getCoachProfileErrors = (
  t: Translate,
  errors: CoachProfileFormErrors,
): CoachProfileFormErrors =>
  Object.fromEntries(
    Object.entries(errors).map(([field, message]) => [
      field,
      message ? t(COACH_ERROR_KEYS[message] ?? 'auth.error.generic') : message,
    ]),
  ) as CoachProfileFormErrors;

export const getSafetyStatusLabel = (
  t: Translate,
  status: WorkoutSafetyReviewStatus,
): string => t(STATUS_KEYS[status]);

export const getSafetyPeriodLabel = (
  t: Translate,
  period: SafetyRecoveryProgressPeriod,
): string => t(PERIOD_KEYS[period]);

export const getSafetyWindowLabel = (
  t: Translate,
  period: SafetyRecoveryProgressPeriod,
  weekly = false,
): string => (weekly && period === 'all' ? t('safety.window.12w') : t(WINDOW_KEYS[period]));

export const getSafetyMovementLabel = (t: Translate, movementPattern: string): string => {
  const key = MOVEMENT_KEYS[movementPattern as UserLimitationMovementPattern];
  return t(key ?? 'safety.movement.other');
};

export const getSafetyLoadLatestLabel = (
  t: Translate,
  latestMultiplier: number | null,
): string => latestMultiplier === null ? t('safety.noLoadCeiling') : `${Math.round(latestMultiplier * 100)}%`;

export const getSafetyLoadDeltaLabel = (
  t: Translate,
  direction: 'up' | 'down' | 'flat' | 'unknown',
  deltaPercentagePoints: number | null,
  latestMultiplier: number | null,
  previousMultiplier: number | null,
): string => {
  if (latestMultiplier === null) return t('safety.noReviewedCeilings');
  if (previousMultiplier === null) return t('safety.firstRecordedCeiling');
  if (direction === 'up' && deltaPercentagePoints !== null) {
    return t('safety.loadUp', { value: Math.abs(deltaPercentagePoints) });
  }
  if (direction === 'down' && deltaPercentagePoints !== null) {
    return t('safety.loadDown', { value: Math.abs(deltaPercentagePoints) });
  }
  return t('safety.noChangePrevious');
};
