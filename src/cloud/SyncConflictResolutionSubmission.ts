import { isApiError } from '@/api/client';
import type {
  SyncConflictResolutionIntent,
  SyncConflictResolutionIntentStore,
} from '@/storage';

import type { SyncConflictResolutionResult } from './SyncConflictResolutionApi';
import type { SyncConflictResolutionClient } from './createSyncConflictResolutionClient';

export type SyncConflictResolutionSubmissionStatus =
  | 'accepted'
  | 'already_resolved'
  | 'authentication_required'
  | 'in_progress'
  | 'missing'
  | 'not_submittable'
  | 'rejected'
  | 'retryable'
  | 'stale';

export type SyncConflictResolutionSubmissionOutcome = {
  status: SyncConflictResolutionSubmissionStatus;
  intent: SyncConflictResolutionIntent | null;
  result?: SyncConflictResolutionResult;
  serverCode?: string;
  retryCategory?: 'offline' | 'server' | 'unknown';
};

export type SyncConflictResolutionSubmission = {
  submit(
    userId: string,
    conflictId: string,
  ): Promise<SyncConflictResolutionSubmissionOutcome>;
};

export type CreateSyncConflictResolutionSubmissionOptions = {
  client: SyncConflictResolutionClient;
  intentStore: SyncConflictResolutionIntentStore;
};

const STALE_CODES = new Set([
  'SYNC_CONFLICT_NOT_FOUND',
  'SYNC_CONFLICT_NOT_USER_RESOLVABLE',
  'SYNC_CONFLICT_STALE',
]);
const REJECTED_CODES = new Set([
  'SYNC_CONFLICT_IDEMPOTENCY_KEY_REUSE',
  'SYNC_OWNERSHIP_VIOLATION',
  'SYNC_DEVICE_NOT_FOUND',
  'VALIDATION_ERROR',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readServerCode = (body: unknown): string | undefined => {
  if (!isRecord(body)) return undefined;
  if (typeof body.code === 'string' && body.code.trim()) {
    return body.code.trim();
  }
  if (
    isRecord(body.error) &&
    typeof body.error.code === 'string' &&
    body.error.code.trim()
  ) {
    return body.error.code.trim();
  }
  return undefined;
};

const isAuthenticationError = (error: unknown): boolean =>
  (isApiError(error) && error.status === 401) ||
  (error instanceof Error && error.message === 'authentication required');

const retryCategory = (
  error: unknown,
): SyncConflictResolutionSubmissionOutcome['retryCategory'] => {
  if (!isApiError(error)) return 'unknown';
  if (error.code === 'network_error' || error.code === 'timeout') {
    return 'offline';
  }
  if (
    error.code === 'rate_limited' ||
    error.code === 'unavailable' ||
    (typeof error.status === 'number' && error.status >= 500)
  ) {
    return 'server';
  }
  return 'unknown';
};

const transition = async (
  store: SyncConflictResolutionIntentStore,
  userId: string,
  intent: SyncConflictResolutionIntent,
  state: 'retryable' | 'stale' | 'submitting',
): Promise<SyncConflictResolutionIntent> => {
  const next = await store.transition(
    userId,
    intent.conflictId,
    intent.idempotencyKey,
    state,
  );
  if (!next) {
    throw new Error('Sync conflict resolution intent disappeared');
  }
  return next;
};

const markAccepted = async (
  store: SyncConflictResolutionIntentStore,
  userId: string,
  intent: SyncConflictResolutionIntent,
  revision: number,
): Promise<SyncConflictResolutionIntent> => {
  const next = await store.markAccepted(
    userId,
    intent.conflictId,
    intent.idempotencyKey,
    revision,
  );
  if (!next) {
    throw new Error('Sync conflict resolution intent disappeared');
  }
  return next;
};

export const createSyncConflictResolutionSubmission = (
  options: CreateSyncConflictResolutionSubmissionOptions,
): SyncConflictResolutionSubmission => ({
  async submit(userId, conflictId) {
    const intent = await options.intentStore.get(userId, conflictId);
    if (!intent) return { status: 'missing', intent: null };

    if (intent.state === 'submitting') {
      return { status: 'in_progress', intent };
    }
    if (
      intent.state === 'accepted' ||
      intent.state === 'stale' ||
      intent.state === 'completed'
    ) {
      return { status: 'not_submittable', intent };
    }

    const submitting = await transition(
      options.intentStore,
      userId,
      intent,
      'submitting',
    );

    try {
      const result = await options.client.resolve({
        conflictId: submitting.conflictId,
        expectedConflictRevision: submitting.expectedConflictRevision,
        expectedRemoteRevision: submitting.expectedRemoteRevision,
        choice: submitting.choice,
        idempotencyKey: submitting.idempotencyKey,
      });
      const accepted = await markAccepted(
        options.intentStore,
        userId,
        submitting,
        result.revision,
      );
      return { status: 'accepted', intent: accepted, result };
    } catch (error) {
      if (isAuthenticationError(error)) {
        const retryable = await transition(
          options.intentStore,
          userId,
          submitting,
          'retryable',
        );
        return { status: 'authentication_required', intent: retryable };
      }

      const serverCode = isApiError(error)
        ? readServerCode(error.body)
        : undefined;
      if (serverCode === 'SYNC_CONFLICT_ALREADY_RESOLVED') {
        const stale = await transition(
          options.intentStore,
          userId,
          submitting,
          'stale',
        );
        return { status: 'already_resolved', intent: stale, serverCode };
      }
      if (serverCode && STALE_CODES.has(serverCode)) {
        const stale = await transition(
          options.intentStore,
          userId,
          submitting,
          'stale',
        );
        return { status: 'stale', intent: stale, serverCode };
      }
      if (
        (serverCode && REJECTED_CODES.has(serverCode)) ||
        (isApiError(error) &&
          typeof error.status === 'number' &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 408 &&
          error.status !== 425 &&
          error.status !== 429)
      ) {
        const stale = await transition(
          options.intentStore,
          userId,
          submitting,
          'stale',
        );
        return { status: 'rejected', intent: stale, serverCode };
      }

      const retryable = await transition(
        options.intentStore,
        userId,
        submitting,
        'retryable',
      );
      return {
        status: 'retryable',
        intent: retryable,
        serverCode,
        retryCategory: retryCategory(error),
      };
    }
  },
});
