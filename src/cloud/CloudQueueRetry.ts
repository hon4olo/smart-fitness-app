import type { CloudError } from './CloudErrors';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';

const DEFAULT_RETRY_BASE_MS = 1_000;
const DEFAULT_RETRY_MAX_MS = 15 * 60 * 1_000;

export const createOfflineSyncQueueBackoff = (
  retryCount: number,
  now = new Date().toISOString(),
  baseDelayMs = DEFAULT_RETRY_BASE_MS,
  maxDelayMs = DEFAULT_RETRY_MAX_MS,
) => {
  const attempts = Math.max(0, Math.floor(retryCount));
  const delayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** attempts);

  return {
    retryCount: attempts,
    nextRetryAt: new Date(Date.parse(now) + delayMs).toISOString(),
  };
};

export const incrementOfflineSyncQueueRetry = (
  operation: OfflineSyncQueueOperation,
  error: CloudError,
  now = new Date().toISOString(),
  baseDelayMs = DEFAULT_RETRY_BASE_MS,
  maxDelayMs = DEFAULT_RETRY_MAX_MS,
): OfflineSyncQueueOperation => {
  const nextRetryCount = operation.retryCount + 1;
  const { nextRetryAt } = createOfflineSyncQueueBackoff(
    nextRetryCount,
    now,
    baseDelayMs,
    maxDelayMs,
  );

  return {
    ...operation,
    retryCount: nextRetryCount,
    status: 'failed',
    lastError: error,
    nextRetryAt,
    updatedAt: now,
  };
};
