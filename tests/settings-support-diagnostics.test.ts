import { describe, expect, it, vi } from 'vitest';

const sourceCommit = 'a'.repeat(40);

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '1.0.0',
      extra: {
        buildProvenance: { schemaVersion: 1, sourceCommit },
      },
    },
    nativeAppVersion: '1.0.0',
    nativeBuildVersion: '42',
  },
}));

vi.mock('expo-updates', () => ({
  channel: 'preview',
  isEmbeddedLaunch: false,
  runtimeVersion: '1.0.0',
  updateId: 'update-1',
}));

import {
  createSupportDiagnostics,
  serializeSupportDiagnostics,
} from '@/features/settings/supportDiagnostics';

describe('support diagnostics privacy contract', () => {
  it('serializes only versioned release and aggregate sync evidence', () => {
    const diagnostics = createSupportDiagnostics(
      {
        syncStatus: 'offline',
        pendingOperations: 3,
        conflictCount: 1,
      },
      { now: () => '2026-08-04T15:00:00.000Z' },
    );
    const output = serializeSupportDiagnostics(diagnostics);

    expect(output).toContain('Event: support_diagnostics_snapshot v1');
    expect(output).toContain('Evidence: 2026-08-04T15:00:00.000Z');
    expect(output).toContain(`Source: ${sourceCommit}`);
    expect(output).toContain('App: 1.0.0 (42)');
    expect(output).toContain('Runtime: 1.0.0');
    expect(output).toContain('Pending: present (3)');
    expect(output).toContain('Conflicts: present (1)');
    expect(output).not.toMatch(
      /email|token|password|userId|entityId|foodName|weightValue/i,
    );
  });
});
