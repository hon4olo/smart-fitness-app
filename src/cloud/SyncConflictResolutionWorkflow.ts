import type {
  SyncConflictResolutionIntent,
  SyncConflictResolutionIntentStore,
  SyncConflictStore,
  SyncCursorStore,
} from '@/storage';

import type {
  SyncConflictResolutionChoice,
  SyncConflictResolutionResult,
} from './SyncConflictResolutionApi';
import type { SyncConflictResolutionCandidate } from './SyncConflictResolutionCandidate';
import type {
  SyncConflictResolutionSubmission,
  SyncConflictResolutionSubmissionOutcome,
  SyncConflictResolutionSubmissionStatus,
} from './SyncConflictResolutionSubmission';

export type SyncConflictResolutionWorkflowStatus =
  | SyncConflictResolutionSubmissionStatus
  | 'reconciled'
  | 'sync_failed'
  | 'waiting_for_authoritative_state';

export type SyncConflictResolutionWorkflowOutcome = {
  status: SyncConflictResolutionWorkflowStatus;
  intent: SyncConflictResolutionIntent | null;
  submission: SyncConflictResolutionSubmissionOutcome;
  result?: SyncConflictResolutionResult;
};

export type SyncConflictResolutionWorkflow = {
  resolve(
    userId: string,
    candidate: SyncConflictResolutionCandidate,
    choice: SyncConflictResolutionChoice,
  ): Promise<SyncConflictResolutionWorkflowOutcome>;
};

export type CreateSyncConflictResolutionWorkflowOptions = {
  conflictStore: SyncConflictStore;
  cursorStore: SyncCursorStore;
  intentStore: SyncConflictResolutionIntentStore;
  submission: SyncConflictResolutionSubmission;
  synchronize(): Promise<void>;
};

const canReconcile = (
  outcome: SyncConflictResolutionSubmissionOutcome,
): boolean =>
  outcome.status === 'accepted' ||
  outcome.status === 'already_resolved' ||
  outcome.status === 'stale' ||
  (outcome.status === 'not_submittable' &&
    (outcome.intent?.state === 'accepted' ||
      outcome.intent?.state === 'stale' ||
      outcome.intent?.state === 'completed'));

const completeIntent = async (
  store: SyncConflictResolutionIntentStore,
  userId: string,
  intent: SyncConflictResolutionIntent,
): Promise<SyncConflictResolutionIntent | null> => {
  let completed = intent;
  if (intent.state !== 'completed') {
    if (intent.state !== 'accepted' && intent.state !== 'stale') {
      return intent;
    }
    const transitioned = await store.transition(
      userId,
      intent.conflictId,
      intent.idempotencyKey,
      'completed',
    );
    if (!transitioned) return null;
    completed = transitioned;
  }

  await store.removeTerminal(
    userId,
    completed.conflictId,
    completed.idempotencyKey,
  );
  return null;
};

export const createSyncConflictResolutionWorkflow = (
  options: CreateSyncConflictResolutionWorkflowOptions,
): SyncConflictResolutionWorkflow => ({
  async resolve(userId, candidate, choice) {
    await options.intentStore.create(userId, candidate, choice);
    const submission = await options.submission.submit(
      userId,
      candidate.conflictId,
    );
    if (!canReconcile(submission)) {
      return {
        status: submission.status,
        intent: submission.intent,
        submission,
        ...(submission.result ? { result: submission.result } : {}),
      };
    }

    try {
      await options.synchronize();
    } catch {
      return {
        status: 'sync_failed',
        intent: await options.intentStore.get(userId, candidate.conflictId),
        submission,
        ...(submission.result ? { result: submission.result } : {}),
      };
    }

    const remainingConflicts = await options.conflictStore.list(userId);
    const conflictStillPresent = remainingConflicts.some(
      (conflict) => conflict.conflictId === candidate.conflictId,
    );
    const targetRevision = submission.result?.revision;
    const cursor = await options.cursorStore.get(userId);
    const cursorReachedTarget =
      targetRevision === undefined ||
      (cursor !== null && cursor.serverRevision >= targetRevision);

    if (conflictStillPresent || !cursorReachedTarget) {
      return {
        status: 'waiting_for_authoritative_state',
        intent: await options.intentStore.get(userId, candidate.conflictId),
        submission,
        ...(submission.result ? { result: submission.result } : {}),
      };
    }

    const currentIntent = await options.intentStore.get(
      userId,
      candidate.conflictId,
    );
    const intent = currentIntent
      ? await completeIntent(options.intentStore, userId, currentIntent)
      : null;
    return {
      status: 'reconciled',
      intent,
      submission,
      ...(submission.result ? { result: submission.result } : {}),
    };
  },
});
