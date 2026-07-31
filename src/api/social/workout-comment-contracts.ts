import type { SocialProfileDto } from './contracts';

export const SOCIAL_WORKOUT_COMMENT_DTO_SCHEMA_VERSION = 1 as const;
export const SOCIAL_WORKOUT_COMMENT_PAGE_DTO_SCHEMA_VERSION = 1 as const;

export type SocialWorkoutCommentDto = {
  schemaVersion: typeof SOCIAL_WORKOUT_COMMENT_DTO_SCHEMA_VERSION;
  id: string;
  author: SocialProfileDto;
  body: string;
  createdAt: string;
};

export type SocialWorkoutCommentPageDto = {
  schemaVersion: typeof SOCIAL_WORKOUT_COMMENT_PAGE_DTO_SCHEMA_VERSION;
  items: SocialWorkoutCommentDto[];
  nextCursor: string | null;
};

export type ListSocialWorkoutCommentsInput = {
  limit?: number;
  cursor?: string;
};

export type CreateSocialWorkoutCommentInput = {
  body: string;
  idempotencyKey: string;
};
