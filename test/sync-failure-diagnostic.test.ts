import { describe, expect, it } from 'vitest';

import {
  formatSyncFailureDiagnostic,
  resolveSyncFailureStage,
} from '@/context/syncContextModel';

describe('sync failure diagnostics', () => {
  it('extracts a nested backend code and message from a generic HTTP conflict', () => {
    const error = Object.assign(new Error('Conflict'), {
      status: 409,
      code: 'conflict',
      requestId: 'req-409',
      body: {
        error: {
          code: 'SYNC_IDEMPOTENCY_KEY_REUSE',
          message: 'Idempotency key was already used for a different sync operation',
          details: { secretPayload: 'must-not-leak' },
        },
      },
    });

    const diagnostic = formatSyncFailureDiagnostic(error, 'upload');

    expect(diagnostic).toContain('stage upload');
    expect(diagnostic).toContain('HTTP 409');
    expect(diagnostic).toContain('SYNC_IDEMPOTENCY_KEY_REUSE');
    expect(diagnostic).toContain('Idempotency key was already used');
    expect(diagnostic).toContain('req-409');
    expect(diagnostic).not.toContain('must-not-leak');
  });

  it('derives the failed provider stage from coordinator transitions', () => {
    expect(
      resolveSyncFailureStage(['Idle', 'Preparing', 'Uploading', 'Downloading']),
    ).toBe('download');
    expect(resolveSyncFailureStage(['Idle', 'Preparing', 'Uploading'])).toBe('upload');
  });
});
