import { isApiError } from '@/api/client';
import {
  getSocialApiErrorCode,
  type SocialNotificationDto,
} from '@/api/social';

export type SocialNotificationLoadError =
  | 'invalid_cursor'
  | 'offline'
  | 'session_expired'
  | 'generic';

export type SocialNotificationTarget =
  | { kind: 'profile'; username: string }
  | { kind: 'workout_post'; postId: string };

export const mergeSocialNotifications = (
  existing: SocialNotificationDto[],
  incoming: SocialNotificationDto[],
): SocialNotificationDto[] => {
  const ids = new Set(existing.map((notification) => notification.id));
  const merged = [...existing];
  for (const notification of incoming) {
    if (ids.has(notification.id)) continue;
    ids.add(notification.id);
    merged.push(notification);
  }
  return merged;
};

export const replaceSocialNotification = (
  notifications: SocialNotificationDto[],
  updated: SocialNotificationDto,
): SocialNotificationDto[] =>
  notifications.map((notification) =>
    notification.id === updated.id ? updated : notification,
  );

export const removeSocialNotification = (
  notifications: SocialNotificationDto[],
  notificationId: string,
): SocialNotificationDto[] =>
  notifications.filter((notification) => notification.id !== notificationId);

export const markSocialNotificationReadOptimistically = (
  notification: SocialNotificationDto,
  now: string,
): SocialNotificationDto =>
  notification.readAt === null ? { ...notification, readAt: now } : notification;

export const getSocialNotificationTarget = (
  notification: SocialNotificationDto,
): SocialNotificationTarget => {
  if (
    notification.type === 'workout_reaction' ||
    notification.type === 'workout_comment'
  ) {
    return { kind: 'workout_post', postId: notification.postId! };
  }
  return { kind: 'profile', username: notification.actor.username };
};

export const getSocialNotificationLoadError = (
  error: unknown,
): SocialNotificationLoadError => {
  const code = getSocialApiErrorCode(error);
  if (code === 'SOCIAL_NOTIFICATION_INVALID_CURSOR') return 'invalid_cursor';
  if (isApiError(error)) {
    if (error.status === 401 || error.code === 'unauthorized') {
      return 'session_expired';
    }
    if (error.code === 'network_error' || error.code === 'timeout') {
      return 'offline';
    }
  }
  return 'generic';
};

export const isMissingSocialNotificationError = (error: unknown): boolean =>
  getSocialApiErrorCode(error) === 'SOCIAL_NOTIFICATION_NOT_FOUND';
