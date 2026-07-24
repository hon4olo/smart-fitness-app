import { describe, expect, it } from 'vitest';

import { createConflictResolver } from './CloudConflictResolver';

const revision = (id: string, number: number, createdAt: string) => ({
  id,
  number,
  createdAt,
});

const baseTrainingProgram = {
  id: 'training-program-a',
  name: 'Upper / Lower',
  description: 'Base program',
  goal: 'Hypertrophy',
  difficulty: 'intermediate',
  durationWeeks: 8,
  days: [
    {
      id: 'monday-upper',
      weekday: 'monday',
      workoutTemplateId: 'upper-template-a',
      workoutTemplateName: 'Upper A',
    },
  ],
  progression: {
    targetReps: 10,
    rir: 2,
    strategy: 'double progression',
  },
  createdAt: '2026-07-24T09:00:00.000Z',
  isCustom: true,
};

describe('training program two-device conflict matrix', () => {
  it('merges independent metadata and schedule edits', () => {
    const resolver = createConflictResolver();
    const addedDay = {
      id: 'thursday-lower',
      weekday: 'thursday',
      workoutTemplateId: 'lower-template-a',
      workoutTemplateName: 'Lower A',
    };
    const record = resolver.detectConflict({
      entityType: 'trainingPrograms',
      entityId: baseTrainingProgram.id,
      baseVersion: baseTrainingProgram,
      localVersion: {
        ...baseTrainingProgram,
        name: 'Upper / Lower A',
      },
      remoteVersion: {
        ...baseTrainingProgram,
        durationWeeks: 10,
        days: [...baseTrainingProgram.days, addedDay],
      },
      localRevision: revision('device-a-rev-2', 2, '2026-07-24T10:00:00.000Z'),
      remoteRevision: revision('device-b-rev-2', 2, '2026-07-24T10:01:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.requiresManualReview).toBe(false);
    expect(result.resolvedValue).toEqual({
      ...baseTrainingProgram,
      name: 'Upper / Lower A',
      durationWeeks: 10,
      days: [...baseTrainingProgram.days, addedDay],
    });
  });

  it('merges independent progression edits', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'trainingPrograms',
      entityId: baseTrainingProgram.id,
      baseVersion: baseTrainingProgram,
      localVersion: {
        ...baseTrainingProgram,
        progression: {
          ...baseTrainingProgram.progression,
          targetReps: 12,
        },
      },
      remoteVersion: {
        ...baseTrainingProgram,
        progression: {
          ...baseTrainingProgram.progression,
          rir: 1,
        },
      },
      localRevision: revision('device-a-rev-3', 3, '2026-07-24T10:02:00.000Z'),
      remoteRevision: revision('device-b-rev-3', 3, '2026-07-24T10:03:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('autoResolved');
    expect(result.resolvedValue).toEqual({
      ...baseTrainingProgram,
      progression: {
        ...baseTrainingProgram.progression,
        targetReps: 12,
        rir: 1,
      },
    });
  });

  it('requires review when both devices edit the same program field', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'trainingPrograms',
      entityId: baseTrainingProgram.id,
      baseVersion: baseTrainingProgram,
      localVersion: {
        ...baseTrainingProgram,
        goal: 'Strength',
      },
      remoteVersion: {
        ...baseTrainingProgram,
        goal: 'Endurance',
      },
      localRevision: revision('device-a-rev-4', 4, '2026-07-24T10:04:00.000Z'),
      remoteRevision: revision('device-b-rev-4', 4, '2026-07-24T10:05:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
    expect(result.conflictingFields).toContain('goal');
  });

  it('requires review when both devices change the same scheduled workout', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'trainingPrograms',
      entityId: baseTrainingProgram.id,
      baseVersion: baseTrainingProgram,
      localVersion: {
        ...baseTrainingProgram,
        days: [
          {
            ...baseTrainingProgram.days[0],
            workoutTemplateId: 'upper-template-device-a',
          },
        ],
      },
      remoteVersion: {
        ...baseTrainingProgram,
        days: [
          {
            ...baseTrainingProgram.days[0],
            workoutTemplateId: 'upper-template-device-b',
          },
        ],
      },
      localRevision: revision('device-a-rev-5', 5, '2026-07-24T10:06:00.000Z'),
      remoteRevision: revision('device-b-rev-5', 5, '2026-07-24T10:07:00.000Z'),
    });

    const result = resolver.resolveConflict(record!);

    expect(result.outcome).toBe('needsReview');
    expect(result.requiresManualReview).toBe(true);
    expect(
      result.conflictingFields.some((field) => field.endsWith('.workoutTemplateId')),
    ).toBe(true);
  });

  it('keeps a device-A delete versus device-B update visible', () => {
    const resolver = createConflictResolver();
    const record = resolver.detectConflict({
      entityType: 'trainingPrograms',
      entityId: baseTrainingProgram.id,
      baseVersion: baseTrainingProgram,
      localVersion: null,
      remoteVersion: {
        ...baseTrainingProgram,
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
      entityType: 'trainingPrograms',
      entityId: baseTrainingProgram.id,
      baseVersion: baseTrainingProgram,
      localVersion: {
        ...baseTrainingProgram,
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
