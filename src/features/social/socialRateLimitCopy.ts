import {
  getSocialApiErrorCode,
  getSocialRateLimitRetryAfterSeconds,
} from '@/api/social';
import type { SupportedLocale } from '@/localization';

import {
  getSocialContentModerationMessage,
  getSocialContentModerationUiState,
} from './socialContentModerationUi';

const formatWait = (
  locale: SupportedLocale,
  retryAfterSeconds: number | null,
): string => {
  if (retryAfterSeconds === null) {
    return locale === 'ru'
      ? 'Слишком много действий. Повторите попытку позже.'
      : 'Too many actions. Try again later.';
  }

  if (retryAfterSeconds < 60) {
    return locale === 'ru'
      ? `Слишком много действий. Повторите попытку через ${retryAfterSeconds} сек.`
      : `Too many actions. Try again in ${retryAfterSeconds} sec.`;
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);
  return locale === 'ru'
    ? `Слишком много действий. Повторите попытку примерно через ${minutes} мин.`
    : `Too many actions. Try again in about ${minutes} min.`;
};

export const getSocialRateLimitMessage = (
  error: unknown,
  locale: SupportedLocale,
): string | null => {
  const moderationState = getSocialContentModerationUiState(error);
  if (moderationState) {
    return getSocialContentModerationMessage(moderationState, locale);
  }

  return getSocialApiErrorCode(error) === 'SOCIAL_RATE_LIMITED'
    ? formatWait(locale, getSocialRateLimitRetryAfterSeconds(error))
    : null;
};
