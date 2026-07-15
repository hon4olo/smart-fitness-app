import { describe, expect, it } from 'vitest';

import { createConflictPolicyRegistry, createConflictResolver } from '@/cloud';

const resolver = createConflictResolver();

const makeConflict = (overrides: Record<string, unknown> = {}) =>
  resolver.detectConflict({
    entityType: (overrides.entityType as string | undefined) ?? 'profile',
    entityId: (overrides.entityId as string | undefined) ?? 'entity-1',
    localVersion: overrides.localVersion,
    remoteVersion: overrides.remoteVersion,
    baseVersion: overrides.baseVersion,
    localRevision: overrides.localRevision as { id: string; number: number; createdAt: string } | undefined,
    remoteRevision: overrides.remoteRevision as { id: string; number: number; createdAt: string } | undefined,
    detectedAt: (overrides.detectedAt as string | undefined) ?? '2026-01-02T03:04:05.000Z',
    metadata: overrides.metadata as Record<string, unknown> | undefined,
    reason: overrides.reason as string | undefined,
  });

describe('conflict resolution layer', () => {
  it('identical versions produce no conflict', () => {
    const conflict = makeConflict({
      entityType: 'profile',
      entityId: 'profile-1',
      localVersion: { goal: 'cut', updatedAt: '2026-01-01T10:00:00.000Z' },
      remoteVersion: { goal: 'cut', updatedAt: '2026-01-01T10:00:00.000Z' },
    });

    expect(conflict).toBeNull();
  });

  it('local-wins policy chooses local value', () => {
    const conflict = makeConflict({
      entityType: 'profile',
      entityId: 'profile-1',
      localVersion: { goal: 'lean bulk', updatedAt: '2026-01-01T10:00:00.000Z' },
      remoteVersion: { goal: 'cut', updatedAt: '2026-01-01T11:00:00.000Z' },
    });

    expect(conflict).not.toBeNull();
    const result = resolver.resolveConflict(conflict!, { strategy: 'localWins' });
    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({ goal: 'lean bulk', updatedAt: '2026-01-01T10:00:00.000Z' });
    expect(result.requiresManualReview).toBe(false);
  });

  it('remote-wins policy chooses remote value', () => {
    const conflict = makeConflict({
      entityType: 'profile',
      entityId: 'profile-1',
      localVersion: { goal: 'lean bulk', updatedAt: '2026-01-01T10:00:00.000Z' },
      remoteVersion: { goal: 'cut', updatedAt: '2026-01-01T11:00:00.000Z' },
    });

    const result = resolver.resolveConflict(conflict!, { strategy: 'remoteWins' });
    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({ goal: 'cut', updatedAt: '2026-01-01T11:00:00.000Z' });
  });

  it('last-write-wins by revision chooses the higher revision', () => {
    const conflict = makeConflict({
      entityType: 'nutritionTargets',
      entityId: 'nutrition-1',
      localVersion: { calories: 2200, updatedAt: '2026-01-01T10:00:00.000Z' },
      remoteVersion: { calories: 2000, updatedAt: '2026-01-01T09:00:00.000Z' },
      localRevision: { id: 'rev-2', number: 2, createdAt: '2026-01-01T10:00:00.000Z' },
      remoteRevision: { id: 'rev-1', number: 1, createdAt: '2026-01-01T09:00:00.000Z' },
    });

    const result = resolver.resolveConflict(conflict!);
    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({ calories: 2200, updatedAt: '2026-01-01T10:00:00.000Z' });
  });

  it('last-write-wins by timestamp resolves deterministically when revisions tie', () => {
    const conflict = makeConflict({
      entityType: 'nutritionTargets',
      entityId: 'nutrition-1',
      localVersion: { calories: 2200, updatedAt: '2026-01-01T10:00:00.000Z' },
      remoteVersion: { calories: 2000, updatedAt: '2026-01-01T12:00:00.000Z' },
      localRevision: { id: 'rev-1', number: 1, createdAt: '2026-01-01T10:00:00.000Z' },
      remoteRevision: { id: 'rev-1b', number: 1, createdAt: '2026-01-01T10:00:00.000Z' },
    });

    const result = resolver.resolveConflict(conflict!);
    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({ calories: 2000, updatedAt: '2026-01-01T12:00:00.000Z' });
  });

  it('deterministic tie handling prefers local when timestamps and revisions are equal', () => {
    const conflict = makeConflict({
      entityType: 'nutritionTargets',
      entityId: 'nutrition-1',
      localVersion: { calories: 2200, updatedAt: '2026-01-01T10:00:00.000Z', source: 'local' },
      remoteVersion: { calories: 2200, updatedAt: '2026-01-01T10:00:00.000Z', source: 'remote' },
      localRevision: { id: 'rev-1', number: 1, createdAt: '2026-01-01T10:00:00.000Z' },
      remoteRevision: { id: 'rev-1', number: 1, createdAt: '2026-01-01T10:00:00.000Z' },
    });

    const result = resolver.resolveConflict(conflict!, { strategy: 'lastWriteWins', preferStableTieBreak: 'local' });
    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({ calories: 2200, updatedAt: '2026-01-01T10:00:00.000Z', source: 'local' });
  });

  it('append-only union deduplicates by stable id', () => {
    const conflict = makeConflict({
      entityType: 'workoutSessions',
      entityId: 'history-1',
      localVersion: [
        { id: 'a', startedAt: '2026-01-01T08:00:00.000Z' },
        { id: 'b', startedAt: '2026-01-01T09:00:00.000Z' },
      ],
      remoteVersion: [
        { id: 'b', startedAt: '2026-01-01T09:00:00.000Z' },
        { id: 'c', startedAt: '2026-01-01T10:00:00.000Z' },
      ],
    });

    const result = resolver.resolveConflict(conflict!);
    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual([
      { id: 'a', startedAt: '2026-01-01T08:00:00.000Z' },
      { id: 'b', startedAt: '2026-01-01T09:00:00.000Z' },
      { id: 'c', startedAt: '2026-01-01T10:00:00.000Z' },
    ]);
  });

  it('append-only union preserves deterministic ordering', () => {
    const conflict = makeConflict({
      entityType: 'foodEntries',
      entityId: 'food-history-1',
      localVersion: [
        { id: 'meal-a', createdAt: '2026-01-01T08:00:00.000Z' },
        { id: 'meal-b', createdAt: '2026-01-01T09:00:00.000Z' },
      ],
      remoteVersion: [
        { id: 'meal-c', createdAt: '2026-01-01T07:30:00.000Z' },
        { id: 'meal-b', createdAt: '2026-01-01T09:00:00.000Z' },
      ],
    });

    const result = resolver.resolveConflict(conflict!);
    expect(result.resolvedValue).toEqual([
      { id: 'meal-a', createdAt: '2026-01-01T08:00:00.000Z' },
      { id: 'meal-b', createdAt: '2026-01-01T09:00:00.000Z' },
      { id: 'meal-c', createdAt: '2026-01-01T07:30:00.000Z' },
    ]);
  });

  it('non-overlapping three-way merge merges both sides', () => {
    const conflict = makeConflict({
      entityType: 'workouts',
      entityId: 'template-1',
      baseVersion: {
        id: 'template-1',
        title: 'Upper Body',
        settings: { restSeconds: 90, rounds: 3 },
      },
      localVersion: {
        id: 'template-1',
        title: 'Upper Body',
        settings: { restSeconds: 75, rounds: 3 },
      },
      remoteVersion: {
        id: 'template-1',
        title: 'Upper Body Power',
        settings: { restSeconds: 90, rounds: 3 },
      },
    });

    const result = resolver.resolveConflict(conflict!);
    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({
      id: 'template-1',
      title: 'Upper Body Power',
      settings: { restSeconds: 75, rounds: 3 },
    });
  });

  it('overlapping field changes require review', () => {
    const conflict = makeConflict({
      entityType: 'mealTemplates',
      entityId: 'meal-template-1',
      baseVersion: {
        id: 'meal-template-1',
        title: 'Breakfast',
        macros: { protein: 30, carbs: 40 },
      },
      localVersion: {
        id: 'meal-template-1',
        title: 'Breakfast A',
        macros: { protein: 30, carbs: 45 },
      },
      remoteVersion: {
        id: 'meal-template-1',
        title: 'Breakfast B',
        macros: { protein: 30, carbs: 50 },
      },
    });

    const result = resolver.resolveConflict(conflict!);
    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
    expect(result.conflictingFields).toContain('title');
    expect(result.conflictingFields).toContain('macros.carbs');
  });

  it('delete versus update conflicts require review by default', () => {
    const conflict = makeConflict({
      entityType: 'profile',
      entityId: 'profile-1',
      localVersion: null,
      remoteVersion: { goal: 'cut', updatedAt: '2026-01-01T11:00:00.000Z' },
      localRevision: { id: 'rev-2', number: 2, createdAt: '2026-01-01T12:00:00.000Z' },
      remoteRevision: { id: 'rev-3', number: 3, createdAt: '2026-01-01T13:00:00.000Z' },
    });

    const result = resolver.resolveConflict(conflict!, { strategy: 'manualReview' });
    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
  });

  it('local delete can win when policy explicitly permits it', () => {
    const conflict = makeConflict({
      entityType: 'profile',
      entityId: 'profile-1',
      localVersion: null,
      remoteVersion: { goal: 'cut', updatedAt: '2026-01-01T11:00:00.000Z' },
      localRevision: { id: 'rev-2', number: 2, createdAt: '2026-01-01T12:00:00.000Z' },
      remoteRevision: { id: 'rev-3', number: 3, createdAt: '2026-01-01T13:00:00.000Z' },
    });

    const result = resolver.resolveConflict(conflict!, { strategy: 'localWins' });
    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toBeNull();
  });

  it('batch resolution returns deterministic results in input order', () => {
    const first = makeConflict({
      entityType: 'workoutSessions',
      entityId: 'history-1',
      localVersion: [{ id: 'a' }],
      remoteVersion: [{ id: 'a' }, { id: 'b' }],
    });
    const second = makeConflict({
      entityType: 'mealTemplates',
      entityId: 'meal-template-1',
      baseVersion: { id: 'meal-template-1', title: 'Breakfast' },
      localVersion: { id: 'meal-template-1', title: 'Breakfast A' },
      remoteVersion: { id: 'meal-template-1', title: 'Breakfast B' },
    });

    const results = resolver.resolveBatch([first!, second!]);
    expect(results).toHaveLength(2);
    expect(results[0].outcome).toBe('autoResolved');
    expect(results[1].outcome).toBe('needsReview');
  });

  it('unknown entity types fall back to manual review', () => {
    const conflict = makeConflict({
      entityType: 'mysteryEntity',
      entityId: 'mystery-1',
      localVersion: { token: 'alpha', updatedAt: '2026-01-01T10:00:00.000Z' },
      remoteVersion: { token: 'beta', updatedAt: '2026-01-01T11:00:00.000Z' },
    });

    expect(conflict).not.toBeNull();
    const result = resolver.resolveConflict(conflict!);
    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
  });

  it('explanation output is deterministic and does not leak payload values', () => {
    const conflict = makeConflict({
      entityType: 'profile',
      entityId: 'profile-1',
      localVersion: { token: 'secret-local', updatedAt: '2026-01-01T10:00:00.000Z' },
      remoteVersion: { token: 'secret-remote', updatedAt: '2026-01-01T11:00:00.000Z' },
    });

    const result = resolver.resolveConflict(conflict!, { strategy: 'localWins' });
    expect(result.explanation).toContain('entity profile:profile-1');
    expect(result.explanation).toContain('strategy localWins');
    expect(result.explanation).toContain('outcome autoResolved');
    expect(result.explanation).not.toContain('secret-local');
    expect(result.explanation).not.toContain('secret-remote');
  });

  it('nested object merge works where safe', () => {
    const conflict = makeConflict({
      entityType: 'trainingPrograms',
      entityId: 'program-1',
      baseVersion: {
        id: 'program-1',
        meta: { name: 'Starter', focus: 'general' },
        notes: { intro: 'Welcome' },
      },
      localVersion: {
        id: 'program-1',
        meta: { name: 'Starter', focus: 'strength' },
        notes: { intro: 'Welcome' },
      },
      remoteVersion: {
        id: 'program-1',
        meta: { name: 'Starter Plus', focus: 'general' },
        notes: { intro: 'Welcome', outro: 'Good job' },
      },
    });

    const result = resolver.resolveConflict(conflict!);
    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({
      id: 'program-1',
      meta: { name: 'Starter Plus', focus: 'strength' },
      notes: { intro: 'Welcome', outro: 'Good job' },
    });
  });

  it('child ordering is preserved where possible', () => {
    const conflict = makeConflict({
      entityType: 'workouts',
      entityId: 'template-2',
      baseVersion: {
        id: 'template-2',
        title: 'Full Body',
        exercises: [
          { id: 'a', name: 'Squat' },
          { id: 'b', name: 'Press' },
        ],
      },
      localVersion: {
        id: 'template-2',
        title: 'Full Body',
        exercises: [
          { id: 'a', name: 'Squat' },
          { id: 'b', name: 'Press' },
          { id: 'c', name: 'Row' },
        ],
      },
      remoteVersion: {
        id: 'template-2',
        title: 'Full Body',
        exercises: [
          { id: 'a', name: 'Squat' },
          { id: 'b', name: 'Press' },
          { id: 'd', name: 'Pull-up' },
        ],
      },
    });

    const result = resolver.resolveConflict(conflict!);
    expect(result.outcome).toBe('autoResolved');
    expect((result.resolvedValue as { exercises: Array<{ id: string }> }).exercises.map((exercise) => exercise.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('canAutoResolve returns true for auto-resolved conflicts', () => {
    const conflict = makeConflict({
      entityType: 'workoutSessions',
      entityId: 'history-1',
      localVersion: [{ id: 'a' }],
      remoteVersion: [{ id: 'a' }, { id: 'b' }],
    });

    expect(resolver.canAutoResolve(conflict!)).toBe(true);
  });

  it('canAutoResolve returns false for review-needed conflicts', () => {
    const conflict = makeConflict({
      entityType: 'mealTemplates',
      entityId: 'meal-template-1',
      baseVersion: { id: 'meal-template-1', title: 'Breakfast' },
      localVersion: { id: 'meal-template-1', title: 'Breakfast A' },
      remoteVersion: { id: 'meal-template-1', title: 'Breakfast B' },
    });

    expect(resolver.canAutoResolve(conflict!)).toBe(false);
  });
});
