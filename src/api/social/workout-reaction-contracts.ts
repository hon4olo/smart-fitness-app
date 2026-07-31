export const SOCIAL_WORKOUT_REACTION_DTO_SCHEMA_VERSION = 1 as const;

export type SocialWorkoutReactionDto = {
  schemaVersion: typeof SOCIAL_WORKOUT_REACTION_DTO_SCHEMA_VERSION;
  reacted: boolean;
  reactionCount: number;
};
