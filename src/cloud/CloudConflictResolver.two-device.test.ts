import { describe, expect, it } from 'vitest';

import { createConflictResolver } from './CloudConflictResolver';

const revision = (id: string, number: number, createdAt: string) => ({
  id,
  number,
  createdAt,
});

const baseWorkoutTemplate = {
  id: 'workout-template-a',
  title: 'Push day',
  description: 'Base template',
  duration: '45 min',
  exercises: [
    {
      id: 'bench-press',
      name: 'Bench Press',
      muscleGroup: 'Chest',
      isCustom: false,
      createdAt: '2026-07-24T09:00:00.000Z',
    },
  ],
  isCustom: true,
  createdAt: '2026-07-24T09:00:00.000Z',
};

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

  describe('workout template conflict matrix', () => {
    it('merges independent template metadata and exercise-list edits', () => {
      const resolver = createConflictResolver();
      const addedExercise = {
        id: 'incline-dumbbell-press',
        name: 'Incline Dumbbell Press',
        muscleGroup: 'Chest',
        isCustom: false,
        createdAt: '2026-07-24T09:30:00.000Z',
      };
      const record = resolver.detectConflict({
        entityType: 'workouts',
        entityId: baseWorkoutTemplate.id,
        baseVersion: baseWorkoutTemplate,
        localVersion: {
          ...baseWorkoutTemplate,
          title: 'Push day A',
        },
        remoteVersion: {
          ...baseWorkoutTemplate,
          duration: '55 min',
          exercises: [...baseWorkoutTemplate.exercises, addedExercise],
        },
        localRevision: revision('device-a-rev-2', 2, '2026-07-24T10:00:00.000Z'),
        remoteRevision: revision('device-b-rev-2', 2, '2026-07-24T10:01:00.000Z'),
      });

      const result = resolver.resolveConflict(record!);

      expect(result.outcome).toBe('autoResolved');
      expect(result.requiresManualReview).toBe(false);
      expect(result.resolvedValue).toEqual({
        ...baseWorkoutTemplate,
        title: 'Push day A',
        duration: '55 min',
        exercises: [...baseWorkoutTemplate.exercises, addedExercise],
      });
    });

    it('requires review when both devices edit the same template field', () => {
      const resolver = createConflictResolver();
      const record = resolver.detectConflict({
        entityType: 'workouts',
        entityId: baseWorkoutTemplate.id,
        baseVersion: baseWorkoutTemplate,
        localVersion: {
          ...baseWorkoutTemplate,
          description: 'Device A description',
        },
        remoteVersion: {
          ...baseWorkoutTemplate,
          description: 'Device B description',
        },
        localRevision: revision('device-a-rev-3', 3, '2026-07-24T10:02:00.000Z'),
        remoteRevision: revision('device-b-rev-3', 3, '2026-07-24T10:03:00.000Z'),
      });

      const result = resolver.resolveConflict(record!);

      expect(result.outcome).toBe('needsReview');
      expect(result.requiresManualReview).toBe(true);
      expect(result.conflictingFields).toContain('description');
    });

    it('requires review when both devices edit the same exercise field', () => {
      const resolver = createConflictResolver();
      const record = resolver.detectConflict({
        entityType: 'workouts',
        entityId: baseWorkoutTemplate.id,
        baseVersion: baseWorkoutTemplate,
        localVersion: {
          ...baseWorkoutTemplate,
          exercises: [
            {
              ...baseWorkoutTemplate.exercises[0],
              name: 'Paused Bench Press',
            },
          ],
        },
        remoteVersion: {
          ...baseWorkoutTemplate,
          exercises: [
            {
              ...baseWorkoutTemplate.exercises[0],
              name: 'Close-Grip Bench Press',
            },
          ],
        },
        localRevision: revision('device-a-rev-4', 4, '2026-07-24T10:04:00.000Z'),
        remoteRevision: revision('device-b-rev-4', 4, '2026-07-24T10:05:00.000Z'),
      });

      const result = resolver.resolveConflict(record!);

      expect(result.outcome).toBe('needsReview');
      expect(result.requiresManualReview).toBe(true);
      expect(result.conflictingFields.some((field) => field.endsWith('.name'))).toBe(true);
    });

    it('keeps a device-A delete versus device-B update visible', () => {
      const resolver = createConflictResolver();
      const record = resolver.detectConflict({
        entityType: 'workouts',
        entityId: baseWorkoutTemplate.id,
        baseVersion: baseWorkoutTemplate,
        localVersion: null,
        remoteVersion: {
          ...baseWorkoutTemplate,
          title: 'Remote update',
        },
        localRevision: revision('device-a-delete-5', 5, '2026-07-24T10:06:00.000Z'),
        remoteRevision: revision('device-b-update-5', 5, '2026-07-24T10:07:00.000Z'),
      });

      const result = resolver.resolveConflict(record!);

      expect(result.outcome).toBe('needsReview');
      expect(result.conflictingFields).toEqual(['root']);
      expect(result.reason).toBe('local delete versus remote update');
    });

    it('keeps a device-A update versus device-B delete visible', () => {
      const resolver = createConflictResolver();
      const record = resolver.detectConflict({
        entityType: 'workouts',
        entityId: baseWorkoutTemplate.id,
        baseVersion: baseWorkoutTemplate,
        localVersion: {
          ...baseWorkoutTemplate,
          title: 'Local update',
        },
        remoteVersion: null,
        localRevision: revision('device-a-update-6', 6, '2026-07-24T10:08:00.000Z'),
        remoteRevision: revision('device-b-delete-6', 6, '2026-07-24T10:09:00.000Z'),
      });

      const result = resolver.resolveConflict(record!);

      expect(result.outcome).toBe('needsReview');
      expect(result.conflictingFields).toEqual(['root']);
      expect(result.reason).toBe('local update versus remote delete');
    });
  });
});
