import { describe, expect, it } from 'vitest';

import {
  createSupportDiagnosticsSnapshot,
  serializeSupportDiagnostics,
  SUPPORT_DIAGNOSTICS_EVENT_NAME,
  SUPPORT_DIAGNOSTICS_SCHEMA_VERSION,
  type SupportDiagnosticsInput,
} from './supportDiagnosticsModel';

const sourceCommit = 'a'.repeat(40);

const baseInput: SupportDiagnosticsInput = {
  evidenceTimestamp: '2026-08-04T14:45:00.000Z',
  sourceCommit,
  appVersion: '1.0.3',
  buildNumber: '42',
  runtimeVersion: '1.0.3',
  channel: 'production',
  updateId: '11111111-1111-4111-8111-111111111111',
  updateSource: 'downloaded',
  environment: 'staging',
  syncStatus: 'conflict',
  pendingOperations: 4,
  conflictCount: 2,
};

describe('support diagnostics model', () => {
  it('creates a versioned bounded snapshot with exact immutable provenance', () => {
    const diagnostics = createSupportDiagnosticsSnapshot({
      ...baseInput,
      sourceCommit: sourceCommit.toUpperCase(),
      pendingOperations: 50_000,
      conflictCount: -4,
    });

    expect(diagnostics).toEqual({
      eventName: SUPPORT_DIAGNOSTICS_EVENT_NAME,
      schemaVersion: SUPPORT_DIAGNOSTICS_SCHEMA_VERSION,
      evidenceTimestamp: '2026-08-04T14:45:00.000Z',
      sourceCommit,
      appVersion: '1.0.3',
      buildNumber: '42',
      runtimeVersion: '1.0.3',
      channel: 'production',
      updateId: '11111111-1111-4111-8111-111111111111',
      updateSource: 'downloaded',
      environment: 'preview',
      syncStatus: 'conflict',
      pendingOperations: 9_999,
      pendingState: 'present',
      conflictCount: 0,
      conflictState: 'none',
    });
  });

  it('fails closed on mutable or malformed provenance', () => {
    const diagnostics = createSupportDiagnosticsSnapshot({
      ...baseInput,
      evidenceTimestamp: 'not-a-date',
      sourceCommit: 'main',
      environment: 'customer-a',
    });

    expect(diagnostics).toMatchObject({
      evidenceTimestamp: 'unknown',
      sourceCommit: 'unknown',
      environment: 'unknown',
    });
  });

  it('drops unapproved user data and serializes only the explicit evidence contract', () => {
    const inputWithSensitiveExtras = {
      ...baseInput,
      email: 'person@example.com',
      accessToken: 'secret-access-token',
      refreshToken: 'secret-refresh-token',
      payload: { weight: 72.5, foodName: 'private meal' },
      userId: 'private-user-id',
    } as SupportDiagnosticsInput & Record<string, unknown>;

    const diagnostics = createSupportDiagnosticsSnapshot(
      inputWithSensitiveExtras,
    );
    const serialized = serializeSupportDiagnostics(diagnostics);

    expect(Object.keys(diagnostics).sort()).toEqual(
      [
        'appVersion',
        'buildNumber',
        'channel',
        'conflictCount',
        'conflictState',
        'environment',
        'eventName',
        'evidenceTimestamp',
        'pendingOperations',
        'pendingState',
        'runtimeVersion',
        'schemaVersion',
        'sourceCommit',
        'syncStatus',
        'updateId',
        'updateSource',
      ].sort(),
    );
    expect(serialized).toContain(
      `Event: ${SUPPORT_DIAGNOSTICS_EVENT_NAME} v${SUPPORT_DIAGNOSTICS_SCHEMA_VERSION}`,
    );
    expect(serialized).toContain(`Source: ${sourceCommit}`);
    expect(serialized).not.toContain('person@example.com');
    expect(serialized).not.toContain('secret-access-token');
    expect(serialized).not.toContain('secret-refresh-token');
    expect(serialized).not.toContain('private meal');
    expect(serialized).not.toContain('private-user-id');
    expect(serialized).not.toContain('72.5');
  });
});
