import { isApiError } from '@/api/client';

import {
  SOCIAL_API_ERROR_CODES,
  type SocialApiErrorCode,
} from './contracts';

const SOCIAL_ERROR_CODES = new Set<string>(SOCIAL_API_ERROR_CODES);
const MAX_RETRY_AFTER_SECONDS = 86_400;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getErrorEnvelope = (
  body: unknown,
): Record<string, unknown> | null => {
  if (!isRecord(body)) return null;
  return isRecord(body.error) ? body.error : body;
};

export const getSocialApiErrorCode = (
  error: unknown,
): SocialApiErrorCode | null => {
  if (!isApiError(error)) return null;
  const envelope = getErrorEnvelope(error.body);
  const candidate = envelope?.code;
  return typeof candidate === 'string' && SOCIAL_ERROR_CODES.has(candidate)
    ? (candidate as SocialApiErrorCode)
    : null;
};

export const getSocialRateLimitRetryAfterSeconds = (
  error: unknown,
): number | null => {
  if (getSocialApiErrorCode(error) !== 'SOCIAL_RATE_LIMITED') return null;
  if (!isApiError(error)) return null;

  const envelope = getErrorEnvelope(error.body);
  const details = envelope?.details;
  if (!isRecord(details)) return null;

  const retryAfterSeconds = details.retryAfterSeconds;
  return typeof retryAfterSeconds === 'number' &&
    Number.isSafeInteger(retryAfterSeconds) &&
    retryAfterSeconds >= 1 &&
    retryAfterSeconds <= MAX_RETRY_AFTER_SECONDS
    ? retryAfterSeconds
    : null;
};
