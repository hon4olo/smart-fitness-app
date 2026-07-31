import {
  SOCIAL_WORKOUT_REACTION_DTO_SCHEMA_VERSION,
  type SocialWorkoutReactionDto,
} from './workout-reaction-contracts';

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

export const parseSocialWorkoutReactionDto = (
  value: unknown,
): SocialWorkoutReactionDto => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['schemaVersion', 'reacted', 'reactionCount']) ||
    value.schemaVersion !== SOCIAL_WORKOUT_REACTION_DTO_SCHEMA_VERSION ||
    typeof value.reacted !== 'boolean' ||
    typeof value.reactionCount !== 'number' ||
    !Number.isSafeInteger(value.reactionCount) ||
    value.reactionCount < 0
  ) {
    throw new Error('Invalid social workout reaction response');
  }

  return {
    schemaVersion: SOCIAL_WORKOUT_REACTION_DTO_SCHEMA_VERSION,
    reacted: value.reacted,
    reactionCount: value.reactionCount,
  };
};

export const parseSocialWorkoutReactionResponse = (
  value: unknown,
): SocialWorkoutReactionDto => {
  if (!isRecord(value) || !hasExactKeys(value, ['reaction'])) {
    throw new Error('Invalid social workout reaction response');
  }
  return parseSocialWorkoutReactionDto(value.reaction);
};
