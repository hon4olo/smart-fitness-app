import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION,
  mapAccountDeletionStatusPresentation,
  parseAccountDeletionPresentationInput,
  type AccountDeletionPresentationInput,
} from './accountDeletionStatusPresentation';

const input = <T extends Record<string, unknown>>(
  value: T,
): T & { schemaVersion: typeof ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION } => ({
  schemaVersion: ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION,
  ...value,
});

describe('account deletion status presentation', () => {
  it('strictly parses every supported bounded input shape', () => {
    const candidates: AccountDeletionPresentationInput[] = [
      input({ kind: 'request_submitting' }),
      input({ kind: 'remote_status', status: 'pending', blockerCode: null }),
      input({
        kind: 'remote_status',
        status: 'blocked',
        blockerCode: 'legal_hold_active',
      }),
      input({ kind: 'remote_status', status: 'completed', blockerCode: null }),
      input({ kind: 'transport_uncertain', reason: 'offline' }),
      input({ kind: 'receipt_unavailable', reason: 'expired' }),
      input({ kind: 'session_reauthentication_required' }),
      input({ kind: 'local_cleanup', status: 'pending' }),
      input({ kind: 'local_cleanup', status: 'failed' }),
      input({ kind: 'local_cleanup', status: 'completed' }),
    ];

    for (const candidate of candidates) {
      expect(parseAccountDeletionPresentationInput(candidate)).toEqual(candidate);
    }
  });

  it.each([
    null,
    [],
    {},
    { schemaVersion: 2, kind: 'request_submitting' },
    input({ kind: 'remote_status', status: 'pending', blockerCode: null, raw: 'x' }),
    input({ kind: 'remote_status', status: 'pending', blockerCode: 'legal_hold_active' }),
    input({ kind: 'remote_status', status: 'blocked', blockerCode: null }),
    input({ kind: 'remote_status', status: 'completed', blockerCode: 'server_cleanup_incomplete' }),
    input({ kind: 'transport_uncertain', reason: 'network_error' }),
    input({ kind: 'receipt_unavailable', reason: 'deleted' }),
    input({ kind: 'local_cleanup', status: 'unknown' }),
    input({ kind: 'session_reauthentication_required', email: 'private@example.com' }),
  ])('rejects malformed or over-broad input %#', (candidate) => {
    expect(parseAccountDeletionPresentationInput(candidate)).toBeNull();
  });

  it('fails closed for unknown input without exposing details', () => {
    expect(
      mapAccountDeletionStatusPresentation({
        backendMessage: 'raw provider failure',
        requestId: 'private',
        statusSecret: 'private',
      }),
    ).toEqual({
      schemaVersion: ACCOUNT_DELETION_PRESENTATION_SCHEMA_VERSION,
      statusId: 'status_unavailable',
      tone: 'warning',
      titleKey: 'privacy.accountDeletion.status_unavailable.title',
      messageKey: 'privacy.accountDeletion.status_unavailable.message',
      localDataPolicy: 'preserve',
      sessionPolicy: 'defer_until_reconciled',
      actions: ['retry_status_check'],
    });
  });

  it('preserves local data for pending, blocked and uncertain outcomes', () => {
    const pending = mapAccountDeletionStatusPresentation(
      input({ kind: 'remote_status', status: 'pending', blockerCode: null }),
    );
    const blocked = mapAccountDeletionStatusPresentation(
      input({
        kind: 'remote_status',
        status: 'blocked',
        blockerCode: 'legal_hold_active',
      }),
    );
    const uncertain = mapAccountDeletionStatusPresentation(
      input({ kind: 'transport_uncertain', reason: 'timeout' }),
    );

    for (const result of [pending, blocked, uncertain]) {
      expect(result.localDataPolicy).toBe('preserve');
      expect(result.sessionPolicy).toBe('defer_until_reconciled');
      expect(result.actions).toContain('retry_status_check');
    }
  });

  it('maps every backend blocker to the same bounded user presentation', () => {
    const blockerCodes = [
      'database_deletion_incomplete',
      'delivery_cleanup_incomplete',
      'legal_hold_active',
      'private_media_cleanup_incomplete',
      'server_cleanup_incomplete',
    ] as const;

    const presentations = blockerCodes.map((blockerCode) =>
      mapAccountDeletionStatusPresentation(
        input({ kind: 'remote_status', status: 'blocked', blockerCode }),
      ),
    );

    for (const result of presentations) {
      expect(result).toEqual(presentations[0]);
      expect(result.statusId).toBe('blocked');
      expect(result.actions).toEqual(['retry_status_check', 'contact_support']);
    }
  });

  it('never treats an unavailable receipt as proof of deletion', () => {
    for (const reason of ['expired', 'not_found'] as const) {
      const result = mapAccountDeletionStatusPresentation(
        input({ kind: 'receipt_unavailable', reason }),
      );

      expect(result.statusId).toBe('receipt_unavailable');
      expect(result.localDataPolicy).toBe('preserve');
      expect(result.sessionPolicy).toBe('allow_if_authenticated');
      expect(result.actions).toEqual(['start_new_request']);
    }
  });

  it('requires cleanup after authoritative remote completion', () => {
    const result = mapAccountDeletionStatusPresentation(
      input({ kind: 'remote_status', status: 'completed', blockerCode: null }),
    );

    expect(result.statusId).toBe('cleanup_pending');
    expect(result.localDataPolicy).toBe('cleanup_required');
    expect(result.sessionPolicy).toBe('signed_out');
    expect(result.actions).toEqual([]);
  });

  it('offers only local-cleanup retry after cleanup failure', () => {
    const result = mapAccountDeletionStatusPresentation(
      input({ kind: 'local_cleanup', status: 'failed' }),
    );

    expect(result.statusId).toBe('cleanup_failed');
    expect(result.localDataPolicy).toBe('cleanup_required');
    expect(result.sessionPolicy).toBe('signed_out');
    expect(result.actions).toEqual(['retry_local_cleanup']);
  });

  it('uses localization keys and no raw identifiers, secrets or messages', () => {
    const result = mapAccountDeletionStatusPresentation(
      input({ kind: 'transport_uncertain', reason: 'unavailable' }),
    );
    const serialized = JSON.stringify(result);

    expect(result.titleKey).toMatch(/^privacy\.accountDeletion\.[a-z_]+\.title$/u);
    expect(result.messageKey).toMatch(/^privacy\.accountDeletion\.[a-z_]+\.message$/u);
    expect(serialized).not.toMatch(
      /requestId|statusSecret|userId|email|blockerCode|provider|database|media/iu,
    );
  });
});
