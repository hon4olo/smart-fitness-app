import { describe, expect, it } from 'vitest';

import { serializeSupportDiagnostics } from '@/features/settings/supportDiagnostics';

describe('support diagnostics privacy contract', () => {
  it('serializes only release and aggregate sync metadata', () => {
    const output = serializeSupportDiagnostics({
      appVersion: '1.0.0',
      buildNumber: '42',
      runtimeVersion: '1.0.0',
      channel: 'preview',
      updateId: 'update-1',
      updateSource: 'downloaded',
      environment: 'preview',
      syncStatus: 'offline',
      pendingOperations: 3,
      conflictCount: 1,
    });

    expect(output).toContain('App: 1.0.0 (42)');
    expect(output).toContain('Runtime: 1.0.0');
    expect(output).toContain('Pending: 3');
    expect(output).not.toMatch(/email|token|password|userId|entityId|foodName|weightValue/i);
  });
});
