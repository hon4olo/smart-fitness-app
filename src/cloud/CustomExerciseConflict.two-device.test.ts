import { describe, expect, it } from 'vitest';

import { createConflictPolicyRegistry } from './CloudConflictPolicies';
import { createConflictResolver } from './CloudConflictResolver';

const revision = (id: string, number: number, createdAt: string) => ({
  id,
  number,
  createdAt,
});

const baseCustomExercise = {
  id: 'custom-exercise-a',
  name: 'Cable Y Raise',
  aliases: ['Cable Y-Raise'],
  category: 'shoulders',
  primaryMuscles: ['lateral deltoid'],
  secondaryMuscles: ['trapezius'],
  equipment: ['cable'],
  movementPattern: ['shoulder abduction'],
  difficulty: 'intermediate',
  exerciseType: 'isolation',
  unilateral: false,
  tags: ['shoulders'],
  instructions: ['Raise the handles in a Y path.'],
  tips: ['Keep the load controlled.'],
  commonMistakes: ['Shrugging excessively.'],
  estimatedSetupTime: 45,
  muscleGroup: 'Shoulders',
  notes: 'Base notes',
  isCustom: true,
  source: 'user',
  favorite: false,
  metadata: {
    origin: 'exercise-library',
    visibility: 'private',
  },
  createdAt: '2026-07-24T09:00:00.000Z',
};

describe('custom exercise two-device conflict matrix', () => {
  it('registers a structured merge policy for custom exercises', () => {
    expect(createConflictPolicyRegistry().getPolicy('customExercises')).toMatchObject({
      strategy: 'mergeFields',
      allowDeleteStrategy: 'manualReview',
    });
  });

  it('merges independent exercise metadata and equipment edits', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'customExercises',
      entityId: baseCustomExercise.id,
      baseVersion: baseCustomExercise,
      localVersion: {
        ...baseCustomExercise,
        name: 'Single-Arm Cable Y Raise',
      },
      remoteVersion: {
        ...baseCustomExercise,
        equipment: ['dual cable'],
      },
      localRevision: revision('device-a-rev-2', 2, '2026-07-24T10:00:00.000Z'),
      remoteRevision: revision('device-b-rev-2', 2, '2026-07-24T10:01:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.requiresManualReview).toBe(false);
    expect(result.resolvedValue).toEqual({
      ...baseCustomExercise,
      name: 'Single-Arm Cable Y Raise',
      equipment: ['dual cable'],
    });
  });

  it('merges independent nested metadata edits', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'customExercises',
      entityId: baseCustomExercise.id,
      baseVersion: baseCustomExercise,
      localVersion: {
        ...baseCustomExercise,
        metadata: {
          ...baseCustomExercise.metadata,
          visibility: 'shared',
        },
      },
      remoteVersion: {
        ...baseCustomExercise,
        metadata: {
          ...baseCustomExercise.metadata,
          sourceDevice: 'device-b',
        },
      },
      localRevision: revision('device-a-rev-3', 3, '2026-07-24T10:02:00.000Z'),
      remoteRevision: revision('device-b-rev-3', 3, '2026-07-24T10:03:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({
      ...baseCustomExercise,
      metadata: {
        origin: 'exercise-library',
        visibility: 'shared',
        sourceDevice: 'device-b',
      },
    });
  });

  it('requires review when both devices edit the same exercise field', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'customExercises',
      entityId: baseCustomExercise.id,
      baseVersion: baseCustomExercise,
      localVersion: {
        ...baseCustomExercise,
        notes: 'Device A notes',
      },
      remoteVersion: {
        ...baseCustomExercise,
        notes: 'Device B notes',
      },
      localRevision: revision('device-a-rev-4', 4, '2026-07-24T10:04:00.000Z'),
      remoteRevision: revision('device-b-rev-4', 4, '2026-07-24T10:05:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
    expect(result.conflictingFields).toContain('notes');
  });

  it('requires review when both devices edit the same nested metadata field', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'customExercises',
      entityId: baseCustomExercise.id,
      baseVersion: baseCustomExercise,
      localVersion: {
        ...baseCustomExercise,
        metadata: {
          ...baseCustomExercise.metadata,
          visibility: 'shared',
        },
      },
      remoteVersion: {
        ...baseCustomExercise,
        metadata: {
          ...baseCustomExercise.metadata,
          visibility: 'public',
        },
      },
      localRevision: revision('device-a-rev-5', 5, '2026-07-24T10:06:00.000Z'),
      remoteRevision: revision('device-b-rev-5', 5, '2026-07-24T10:07:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
    expect(result.conflictingFields).toContain('metadata.visibility');
  });

  it('keeps a device-A delete versus device-B update visible', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'customExercises',
      entityId: baseCustomExercise.id,
      baseVersion: baseCustomExercise,
      localVersion: null,
      remoteVersion: {
        ...baseCustomExercise,
        name: 'Remote update',
      },
      localRevision: revision('device-a-delete-6', 6, '2026-07-24T10:08:00.000Z'),
      remoteRevision: revision('device-b-update-6', 6, '2026-07-24T10:09:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.conflictingFields).toEqual(['root']);
    expect(result.reason).toBe('local delete versus remote update');
  });

  it('keeps a device-A update versus device-B delete visible', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'customExercises',
      entityId: baseCustomExercise.id,
      baseVersion: baseCustomExercise,
      localVersion: {
        ...baseCustomExercise,
        name: 'Local update',
      },
      remoteVersion: null,
      localRevision: revision('device-a-update-7', 7, '2026-07-24T10:10:00.000Z'),
      remoteRevision: revision('device-b-delete-7', 7, '2026-07-24T10:11:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.conflictingFields).toEqual(['root']);
    expect(result.reason).toBe('local update versus remote delete');
  });
});
