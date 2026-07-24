import { describe, expect, it } from 'vitest';

import { createConflictResolver } from './CloudConflictResolver';

const revision = (id: string, number: number, createdAt: string) => ({
  id,
  number,
  createdAt,
});

describe('CloudConflictResolver two-device scenarios', () => {
  it('merges non-overlapping workout edits from two devices', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'workouts',
      entityId: 'workout-a',
      baseVersion: { id: 'workout-a', title: 'Push', notes: 'Base' },
      localVersion: { id: 'workout-a', title: 'Push A', notes: 'Base' },
      remoteVersion: { id: 'workout-a', title: 'Push', notes: 'Remote note' },
      localRevision: revision('local-2', 2, '2026-07-24T10:00:00.000Z'),
      remoteRevision: revision('remote-2', 2, '2026-07-24T10:01:00.000Z'),
    });

    expect(record).not.toBeNull();
    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.requiresManualReview).toBe(false);
    expect(result.resolvedValue).toEqual({
      id: 'workout-a',
      title: 'Push A',
      notes: 'Remote note',
    });
  });

  it('requires review for overlapping workout edits', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'workouts',
      entityId: 'workout-a',
      baseVersion: { id: 'workout-a', title: 'Push' },
      localVersion: { id: 'workout-a', title: 'Push A' },
      remoteVersion: { id: 'workout-a', title: 'Push B' },
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
    expect(result.conflictingFields).toContain('title');
  });

  it('keeps delete-versus-update conflicts visible', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'trainingPrograms',
      entityId: 'program-a',
      baseVersion: { id: 'program-a', name: 'Plan' },
      localVersion: null,
      remoteVersion: { id: 'program-a', name: 'Plan B' },
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.conflictingFields).toEqual(['root']);
    expect(result.reason).toBe('local delete versus remote update');
  });

  it('uses revision order for profile last-write-wins', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'profile',
      entityId: 'user-a',
      localVersion: { id: 'user-a', trainingDaysPerWeek: 4 },
      remoteVersion: { id: 'user-a', trainingDaysPerWeek: 5 },
      localRevision: revision('local-3', 3, '2026-07-24T10:00:00.000Z'),
      remoteRevision: revision('remote-4', 4, '2026-07-24T09:00:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({ id: 'user-a', trainingDaysPerWeek: 5 });
    expect(result.reason).toBe('remote version is newer');
  });
});
