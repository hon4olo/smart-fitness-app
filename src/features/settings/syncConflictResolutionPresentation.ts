import type {
  SyncConflictPayloadKind,
  SyncConflictResolutionChoice,
  SyncConflictResolutionWorkflowStatus,
} from '@/cloud';
import type { SyncConflictResolutionUiCopy } from '@/localization/syncConflictResolutionMessages';
import type { SyncConflictResolutionIntentState } from '@/storage';

export const getSyncConflictPayloadKindLabel = (
  copy: SyncConflictResolutionUiCopy,
  kind: SyncConflictPayloadKind,
): string => (kind === 'delete' ? copy.deletedData : copy.savedData);

export const getSyncConflictSelectedChoiceLabel = (
  copy: SyncConflictResolutionUiCopy,
  choice: SyncConflictResolutionChoice,
): string =>
  choice === 'keep_local' ? copy.selectedDevice : copy.selectedAccount;

export const getSyncConflictIntentStatusMessage = (
  copy: SyncConflictResolutionUiCopy,
  state: SyncConflictResolutionIntentState,
): string => {
  if (state === 'submitting') return copy.choiceSubmitting;
  if (state === 'pending' || state === 'retryable') return copy.choiceRetryable;
  if (state === 'stale') return copy.choiceStale;
  return copy.choiceAccepted;
};

export const isSyncConflictIntentSubmitting = (
  state: SyncConflictResolutionIntentState | null,
): boolean => state === 'submitting';

export const shouldFinishSyncConflictIntent = (
  state: SyncConflictResolutionIntentState | null,
): boolean => state === 'accepted' || state === 'stale' || state === 'completed';

export const getSyncConflictResolutionOutcomeMessage = (
  copy: SyncConflictResolutionUiCopy,
  status: SyncConflictResolutionWorkflowStatus,
): string => {
  if (status === 'reconciled') return copy.outcomeResolved;
  if (
    status === 'waiting_for_authoritative_state' ||
    status === 'accepted' ||
    status === 'already_resolved' ||
    status === 'stale' ||
    status === 'not_submittable'
  ) {
    return copy.outcomeWaiting;
  }
  if (status === 'retryable' || status === 'sync_failed') {
    return copy.outcomeRetryable;
  }
  if (status === 'authentication_required') {
    return copy.outcomeAuthenticationRequired;
  }
  if (status === 'in_progress') return copy.outcomeInProgress;
  return copy.outcomeRejected;
};
