import { isApiError } from '@/api/client';
import {
  getSocialApiErrorCode,
  type SocialProfileListItemDto,
} from '@/api/social';

export type SocialRelationshipListKind =
  | 'followers'
  | 'following'
  | 'incoming'
  | 'outgoing';

export type SocialRelationshipListError =
  | 'invalid_cursor'
  | 'offline'
  | 'session_expired'
  | 'generic';

export const SOCIAL_RELATIONSHIP_LIST_KINDS: readonly SocialRelationshipListKind[] = [
  'followers',
  'following',
  'incoming',
  'outgoing',
];

export const mergeSocialProfileListItems = (
  existing: SocialProfileListItemDto[],
  incoming: SocialProfileListItemDto[],
): SocialProfileListItemDto[] => {
  const usernames = new Set(existing.map((item) => item.profile.username));
  const merged = [...existing];
  for (const item of incoming) {
    if (usernames.has(item.profile.username)) continue;
    usernames.add(item.profile.username);
    merged.push(item);
  }
  return merged;
};

export const removeSocialProfileListItem = (
  items: SocialProfileListItemDto[],
  username: string,
): SocialProfileListItemDto[] =>
  items.filter((item) => item.profile.username !== username);

export const getSocialRelationshipListError = (
  error: unknown,
): SocialRelationshipListError => {
  if (getSocialApiErrorCode(error) === 'SOCIAL_RELATION_LIST_INVALID_CURSOR') {
    return 'invalid_cursor';
  }
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
