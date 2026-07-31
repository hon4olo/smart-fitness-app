import {
  getSocialApiErrorCode,
  type SocialContentModerationErrorCode,
} from '@/api/social';
import type { SupportedLocale } from '@/localization';

export type SocialContentModerationUiState =
  | 'rejected'
  | 'review_required'
  | 'unavailable'
  | 'timeout'
  | 'retryable_failure'
  | 'invalid_result';

const STATE_BY_CODE: Record<
  SocialContentModerationErrorCode,
  SocialContentModerationUiState
> = {
  SOCIAL_CONTENT_MODERATION_REJECTED: 'rejected',
  SOCIAL_CONTENT_MODERATION_REVIEW_REQUIRED: 'review_required',
  SOCIAL_CONTENT_MODERATION_UNAVAILABLE: 'unavailable',
  SOCIAL_CONTENT_MODERATION_TIMEOUT: 'timeout',
  SOCIAL_CONTENT_MODERATION_RETRYABLE_FAILURE: 'retryable_failure',
  SOCIAL_CONTENT_MODERATION_INVALID_RESULT: 'invalid_result',
};

const COPY: Record<
  SupportedLocale,
  Record<SocialContentModerationUiState, string>
> = {
  en: {
    rejected: "This text can't be published. Edit it and try again.",
    review_required:
      "This text needs an additional check and wasn't published. Edit it before trying again.",
    unavailable:
      'Text checking is temporarily unavailable. Try publishing again.',
    timeout: 'Text checking took too long. Try publishing again.',
    retryable_failure:
      'Text checking could not be completed. Try publishing again.',
    invalid_result:
      'This text could not be verified safely. Edit it before trying again.',
  },
  ru: {
    rejected:
      'Этот текст нельзя опубликовать. Измените его и попробуйте снова.',
    review_required:
      'Текст требует дополнительной проверки и не был опубликован. Измените его перед повторной попыткой.',
    unavailable:
      'Проверка текста временно недоступна. Попробуйте опубликовать снова.',
    timeout:
      'Проверка текста заняла слишком много времени. Попробуйте опубликовать снова.',
    retryable_failure:
      'Не удалось завершить проверку текста. Попробуйте опубликовать снова.',
    invalid_result:
      'Не удалось безопасно проверить текст. Измените его перед повторной попыткой.',
  },
};

export const getSocialContentModerationUiState = (
  error: unknown,
): SocialContentModerationUiState | null => {
  const code = getSocialApiErrorCode(error);
  if (!code || !(code in STATE_BY_CODE)) return null;
  return STATE_BY_CODE[code as SocialContentModerationErrorCode];
};

export const getSocialContentModerationMessage = (
  state: SocialContentModerationUiState,
  locale: SupportedLocale,
): string => COPY[locale][state];

export const canRetrySocialContentModeration = (
  state: SocialContentModerationUiState,
): boolean =>
  state === 'unavailable' ||
  state === 'timeout' ||
  state === 'retryable_failure';

export const requiresSocialContentEdit = (
  state: SocialContentModerationUiState,
): boolean => !canRetrySocialContentModeration(state);
