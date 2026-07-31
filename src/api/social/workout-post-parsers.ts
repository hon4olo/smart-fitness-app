import { parseSocialProfileDto } from './parsers';
import {
  SOCIAL_WORKOUT_POST_DTO_SCHEMA_VERSION,
  SOCIAL_WORKOUT_SNAPSHOT_SCHEMA_VERSION,
  type SocialWorkoutPostDto,
  type SocialWorkoutPostExerciseDto,
  type SocialWorkoutPostPageDto,
  type SocialWorkoutPostSetDto,
  type SocialWorkoutSnapshotDto,
} from './workout-post-contracts';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean => {
  const actualKeys = Object.keys(value);
  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
};

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
): boolean => Object.keys(value).every((key) => allowedKeys.includes(key));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNonNegativeNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0;

const isNonNegativeSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));

const parseSet = (value: unknown): SocialWorkoutPostSetDto => {
  if (!isRecord(value) || !hasOnlyKeys(value, ['weight', 'reps', 'rpe'])) {
    throw new Error('Invalid social workout set response');
  }

  const result: SocialWorkoutPostSetDto = {};
  if (value.weight !== undefined) {
    if (!isNonNegativeNumber(value.weight)) {
      throw new Error('Invalid social workout set response');
    }
    result.weight = value.weight;
  }
  if (value.reps !== undefined) {
    if (!isNonNegativeSafeInteger(value.reps)) {
      throw new Error('Invalid social workout set response');
    }
    result.reps = value.reps;
  }
  if (value.rpe !== undefined) {
    if (!isFiniteNumber(value.rpe) || value.rpe < 0 || value.rpe > 10) {
      throw new Error('Invalid social workout set response');
    }
    result.rpe = value.rpe;
  }
  return result;
};

const parseExercise = (value: unknown): SocialWorkoutPostExerciseDto => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['name', 'sets']) ||
    typeof value.name !== 'string' ||
    value.name.length < 1 ||
    value.name.length > 200
  ) {
    throw new Error('Invalid social workout exercise response');
  }

  if (value.sets === undefined) return { name: value.name };
  if (!Array.isArray(value.sets) || value.sets.length > 1_000) {
    throw new Error('Invalid social workout exercise response');
  }
  return { name: value.name, sets: value.sets.map((set) => parseSet(set)) };
};

export const parseSocialWorkoutSnapshotDto = (
  value: unknown,
): SocialWorkoutSnapshotDto => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'schemaVersion',
      'title',
      'durationMinutes',
      'exercises',
      'totalVolume',
    ]) ||
    value.schemaVersion !== SOCIAL_WORKOUT_SNAPSHOT_SCHEMA_VERSION
  ) {
    throw new Error('Invalid social workout snapshot response');
  }

  const result: SocialWorkoutSnapshotDto = {
    schemaVersion: SOCIAL_WORKOUT_SNAPSHOT_SCHEMA_VERSION,
  };
  if (value.title !== undefined) {
    if (
      typeof value.title !== 'string' ||
      value.title.length < 1 ||
      value.title.length > 120
    ) {
      throw new Error('Invalid social workout snapshot response');
    }
    result.title = value.title;
  }
  if (value.durationMinutes !== undefined) {
    if (!isNonNegativeSafeInteger(value.durationMinutes)) {
      throw new Error('Invalid social workout snapshot response');
    }
    result.durationMinutes = value.durationMinutes;
  }
  if (value.exercises !== undefined) {
    if (!Array.isArray(value.exercises) || value.exercises.length > 100) {
      throw new Error('Invalid social workout snapshot response');
    }
    result.exercises = value.exercises.map((exercise) => parseExercise(exercise));
  }
  if (value.totalVolume !== undefined) {
    if (!isNonNegativeNumber(value.totalVolume)) {
      throw new Error('Invalid social workout snapshot response');
    }
    result.totalVolume = value.totalVolume;
  }

  const totalSetCount =
    result.exercises?.reduce(
      (count, exercise) => count + (exercise.sets?.length ?? 0),
      0,
    ) ?? 0;
  if (totalSetCount > 1_000) {
    throw new Error('Invalid social workout snapshot response');
  }
  return result;
};

export const parseSocialWorkoutPostDto = (
  value: unknown,
): SocialWorkoutPostDto => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'schemaVersion',
      'id',
      'author',
      'caption',
      'workout',
      'createdAt',
    ]) ||
    value.schemaVersion !== SOCIAL_WORKOUT_POST_DTO_SCHEMA_VERSION ||
    typeof value.id !== 'string' ||
    !UUID_PATTERN.test(value.id) ||
    (value.caption !== null &&
      (typeof value.caption !== 'string' || value.caption.length > 1_000)) ||
    !isIsoDate(value.createdAt)
  ) {
    throw new Error('Invalid social workout post response');
  }

  return {
    schemaVersion: SOCIAL_WORKOUT_POST_DTO_SCHEMA_VERSION,
    id: value.id,
    author: parseSocialProfileDto(value.author),
    caption: value.caption,
    workout: parseSocialWorkoutSnapshotDto(value.workout),
    createdAt: value.createdAt,
  };
};

export const parseSocialWorkoutPostResponse = (
  value: unknown,
): SocialWorkoutPostDto => {
  if (!isRecord(value) || !hasExactKeys(value, ['post'])) {
    throw new Error('Invalid social workout post response');
  }
  return parseSocialWorkoutPostDto(value.post);
};

export const parseSocialWorkoutPostPageResponse = (
  value: unknown,
): SocialWorkoutPostPageDto => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['items', 'nextCursor']) ||
    !Array.isArray(value.items) ||
    value.items.length > 50 ||
    (value.nextCursor !== null &&
      (typeof value.nextCursor !== 'string' ||
        value.nextCursor.length < 1 ||
        value.nextCursor.length > 512))
  ) {
    throw new Error('Invalid social workout post page response');
  }

  return {
    items: value.items.map((item) => parseSocialWorkoutPostDto(item)),
    nextCursor: value.nextCursor,
  };
};

export const parseDeleteSocialWorkoutPostResponse = (
  value: unknown,
): true => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['success']) ||
    value.success !== true
  ) {
    throw new Error('Invalid social workout post deletion response');
  }
  return true;
};
