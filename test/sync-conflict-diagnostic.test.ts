import { describe, expect, it } from 'vitest';

import { getSyncConflictDiagnosticItems } from '@/features/settings/syncConflictDiagnostic';
import type { SyncConflictSnapshot } from '@/storage';

const snapshot = (conflictId = 'conflict:nutritionTargets:user-1:payload'): SyncConflictSnapshot => ({
  conflictId,
  source: 'push',
  status: 'needsReview',
  entityType: 'nutritionTargets',
  entityId: 'target-1',
  detectedAt: '2026-07-27T14:07:00.000Z',
  reason: 'base revision required for structured merge',
  details: {
    resolutionStrategy: 'manualReview',
    localRevision: { id: 'local-rev', number: 2, createdAt: '2026-07-27T14:06:00.000Z' },
    remoteRevision: { id: 'remote-rev', number: 3, createdAt: '2026-07-27T14:06:30.000Z' },
    metadata: { requestId: 'req-safe-123' },
    conflictingFields: ['calorieTarget', 'proteinTarget'],
    localVersion: { email: 'private@example.com', calorieTarget: 2800, token: 'secret-token' },
    remoteVersion: { calorieTarget: 2500 },
  },
});

describe('sync conflict diagnostics', () => {
  it('surfaces exact safe resolution metadata', () => {
    const items = getSyncConflictDiagnosticItems(snapshot());
    const byKey = Object.fromEntries(items.map((item) => [item.key, item.value]));

    expect(byKey.status).toBe('needsReview');
    expect(byKey.reason).toBe('base revision required for structured merge');
    expect(byKey.strategy).toBe('manualReview');
    expect(byKey.localRevision).toContain('#2');
    expect(byKey.remoteRevision).toContain('#3');
    expect(byKey.requestId).toBe('req-safe-123');
    expect(byKey.fields).toBe('calorieTarget, proteinTarget');
    expect(byKey.fingerprint).toMatch(/^conflict-[0-9a-f]{8}$/);
  });

  it('falls back to the stored explanation when the top-level reason is absent', () => {
    const value = snapshot();
    delete value.reason;
    value.details = {
      explanation: 'manual review required after overlapping nutrition target changes',
      localVersion: { calories: 2800 },
      remoteVersion: { calories: 2500 },
    };

    const reason = getSyncConflictDiagnosticItems(value).find((item) => item.key === 'reason');
    expect(reason?.value).toBe(
      'manual review required after overlapping nutrition target changes',
    );
  });

  it('never exposes local or remote payload content or the raw conflict id', () => {
    const raw = snapshot().conflictId;
    const serialized = JSON.stringify(getSyncConflictDiagnosticItems(snapshot()));

    expect(serialized).not.toContain('private@example.com');
    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('2800');
    expect(serialized).not.toContain(raw);
  });

  it('creates a stable opaque fingerprint for support', () => {
    const first = getSyncConflictDiagnosticItems(snapshot()).find((item) => item.key === 'fingerprint');
    const second = getSyncConflictDiagnosticItems(snapshot()).find((item) => item.key === 'fingerprint');
    const different = getSyncConflictDiagnosticItems(snapshot('different-conflict')).find(
      (item) => item.key === 'fingerprint',
    );

    expect(first?.value).toBe(second?.value);
    expect(first?.value).not.toBe(different?.value);
  });
});
