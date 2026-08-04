import type { AccountDeletionReceiptBlockerCode } from '@/auth/accountDeletionReceipt';

export const ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION = 1 as const;

export type AccountDeletionPresentationInput =
  | {
      schemaVersion: typeof ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION;
      kind: 'request_submitting';
    }
  | {
      schemaVersion: typeof ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION;
      kind: 'remote_status';
      status: 'blocked' | 'completed' | 'pending';
      blockerCode: AccountDeletionReceiptBlockerCode | null;
    }
  | {
      schemaVersion: typeof ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION;
      kind: 'transport_uncertain';
      reason: 'offline' | 'timeout' | 'unavailable' | 'unknown';
    }
  | {
      schemaVersion: typeof ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION;
      kind: 'receipt_unavailable';
      reason: 'expired' | 'not_found';
    }
  | {
      schemaVersion: typeof ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION;
      kind: 'session_reauthentication_required';
    }
  | {
      schemaVersion: typeof ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION;
      kind: 'local_cleanup';
      status: 'completed' | 'failed' | 'pending';
    };

export type AccountDeletionPresentationStatusId =
  | 'blocked'
  | 'cleanup_completed'
  | 'cleanup_failed'
  | 'cleanup_pending'
  | 'pending'
  | 'reauthentication_required'
  | 'receipt_unavailable'
  | 'request_submitting'
  | 'status_unavailable'
  | 'transport_uncertain';

export type AccountDeletionPresentationAction =
  | 'contact_support'
  | 'retry_local_cleanup'
  | 'retry_status_check'
  | 'sign_in_again'
  | 'start_new_request';

export type AccountDeletionStatusPresentation = {
  schemaVersion: typeof ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION;
  statusId: AccountDeletionPresentationStatusId;
  tone: 'critical' | 'info' | 'success' | 'warning';
  titleKey: string;
  messageKey: string;
  localDataPolicy: 'cleanup_complete' | 'cleanup_required' | 'preserve';
  sessionPolicy: 'allow_if_authenticated' | 'defer_until_reconciled' | 'signed_out';
  actions: readonly AccountDeletionPresentationAction[];
};

const BLOCKER_CODES: readonly AccountDeletionReceiptBlockerCode[] = [
  'database_deletion_incomplete',
  'delivery_cleanup_incomplete',
  'legal_hold_active',
  'private_media_cleanup_incomplete',
  'server_cleanup_incomplete',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
};

export const parseAccountDeletionPresentationInput = (
  value: unknown,
): AccountDeletionPresentationInput | null => {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION) {
    return null;
  }

  if (value.kind === 'request_submitting') {
    return hasExactKeys(value, ['kind', 'schemaVersion'])
      ? (value as AccountDeletionPresentationInput)
      : null;
  }

  if (value.kind === 'remote_status') {
    if (!hasExactKeys(value, ['blockerCode', 'kind', 'schemaVersion', 'status'])) {
      return null;
    }
    if (
      value.status !== 'blocked' &&
      value.status !== 'completed' &&
      value.status !== 'pending'
    ) {
      return null;
    }
    const blockerCode = value.blockerCode;
    const blockerValid =
      blockerCode === null ||
      (typeof blockerCode === 'string' &&
        BLOCKER_CODES.includes(blockerCode as AccountDeletionReceiptBlockerCode));
    if (!blockerValid) return null;
    if (value.status === 'blocked' ? blockerCode === null : blockerCode !== null) {
      return null;
    }
    return value as AccountDeletionPresentationInput;
  }

  if (value.kind === 'transport_uncertain') {
    if (!hasExactKeys(value, ['kind', 'reason', 'schemaVersion'])) return null;
    if (
      value.reason !== 'offline' &&
      value.reason !== 'timeout' &&
      value.reason !== 'unavailable' &&
      value.reason !== 'unknown'
    ) {
      return null;
    }
    return value as AccountDeletionPresentationInput;
  }

  if (value.kind === 'receipt_unavailable') {
    if (!hasExactKeys(value, ['kind', 'reason', 'schemaVersion'])) return null;
    if (value.reason !== 'expired' && value.reason !== 'not_found') return null;
    return value as AccountDeletionPresentationInput;
  }

  if (value.kind === 'session_reauthentication_required') {
    return hasExactKeys(value, ['kind', 'schemaVersion'])
      ? (value as AccountDeletionPresentationInput)
      : null;
  }

  if (value.kind === 'local_cleanup') {
    if (!hasExactKeys(value, ['kind', 'schemaVersion', 'status'])) return null;
    if (
      value.status !== 'completed' &&
      value.status !== 'failed' &&
      value.status !== 'pending'
    ) {
      return null;
    }
    return value as AccountDeletionPresentationInput;
  }

  return null;
};

const presentation = (
  statusId: AccountDeletionPresentationStatusId,
  tone: AccountDeletionStatusPresentation['tone'],
  localDataPolicy: AccountDeletionStatusPresentation['localDataPolicy'],
  sessionPolicy: AccountDeletionStatusPresentation['sessionPolicy'],
  actions: readonly AccountDeletionPresentationAction[],
): AccountDeletionStatusPresentation => ({
  schemaVersion: ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION,
  statusId,
  tone,
  titleKey: `privacy.accountDeletion.${statusId}.title`,
  messageKey: `privacy.accountDeletion.${statusId}.message`,
  localDataPolicy,
  sessionPolicy,
  actions,
});

const STATUS_UNAVAILABLE_PRESENTATION = presentation(
  'status_unavailable',
  'warning',
  'preserve',
  'defer_until_reconciled',
  ['retry_status_check'],
);

export const mapAccountDeletionStatusPresentation = (
  value: unknown,
): AccountDeletionStatusPresentation => {
  const input = parseAccountDeletionPresentationInput(value);
  if (!input) return STATUS_UNAVAILABLE_PRESENTATION;

  switch (input.kind) {
    case 'request_submitting':
      return presentation(
        'request_submitting',
        'info',
        'preserve',
        'defer_until_reconciled',
        [],
      );
    case 'remote_status':
      if (input.status === 'pending') {
        return presentation(
          'pending',
          'info',
          'preserve',
          'defer_until_reconciled',
          ['retry_status_check'],
        );
      }
      if (input.status === 'blocked') {
        return presentation(
          'blocked',
          'warning',
          'preserve',
          'defer_until_reconciled',
          ['retry_status_check', 'contact_support'],
        );
      }
      return presentation(
        'cleanup_pending',
        'info',
        'cleanup_required',
        'signed_out',
        [],
      );
    case 'transport_uncertain':
      return presentation(
        'transport_uncertain',
        'warning',
        'preserve',
        'defer_until_reconciled',
        ['retry_status_check'],
      );
    case 'receipt_unavailable':
      return presentation(
        'receipt_unavailable',
        'warning',
        'preserve',
        'allow_if_authenticated',
        ['start_new_request'],
      );
    case 'session_reauthentication_required':
      return presentation(
        'reauthentication_required',
        'warning',
        'preserve',
        'signed_out',
        ['sign_in_again'],
      );
    case 'local_cleanup':
      if (input.status === 'completed') {
        return presentation(
          'cleanup_completed',
          'success',
          'cleanup_complete',
          'signed_out',
          [],
        );
      }
      if (input.status === 'failed') {
        return presentation(
          'cleanup_failed',
          'critical',
          'cleanup_required',
          'signed_out',
          ['retry_local_cleanup'],
        );
      }
      return presentation(
        'cleanup_pending',
        'info',
        'cleanup_required',
        'signed_out',
        [],
      );
  }
};
