import type { SocialProfileDto } from './contracts';

export const SOCIAL_NOTIFICATION_DTO_SCHEMA_VERSION = 1 as const;
export const SOCIAL_NOTIFICATION_PAGE_DTO_SCHEMA_VERSION = 1 as const;

export const SOCIAL_NOTIFICATION_TYPES = [
  'follow_request',
  'follow_accepted',
  'workout_reaction',
  'workout_comment',
] as const;

export type SocialNotificationType =
  (typeof SOCIAL_NOTIFICATION_TYPES)[number];

export type SocialNotificationDto = {
  schemaVersion: typeof SOCIAL_NOTIFICATION_DTO_SCHEMA_VERSION;
  id: string;
  type: SocialNotificationType;
  actor: SocialProfileDto;
  postId: string | null;
  commentId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type SocialNotificationPageDto = {
  schemaVersion: typeof SOCIAL_NOTIFICATION_PAGE_DTO_SCHEMA_VERSION;
  items: SocialNotificationDto[];
  nextCursor: string | null;
};

export type ListSocialNotificationsInput = {
  limit?: number;
  cursor?: string;
};
