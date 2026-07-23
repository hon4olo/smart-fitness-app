import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import { getWorkoutTemplateEntityId } from './WorkoutTemplateSync';
import {
  createTrainingProgramQueueOperation,
  getTrainingProgramEntityId,
  normalizeTrainingProgramForSync,
} from './TrainingProgramSync';
import { applyRemoteTrainingProgramChanges } from './TrainingProgramRemoteSync';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const legacyProgramId = 'custom-program-1';
const legacyWorkoutId = 'custom-workout-1';
const entityId = getTrainingProgramEntityId(legacyProgramId);
const workoutTemplateId = getWorkoutTemplateEntityId(legacyWorkoutId);
const program = {
  id: legacyProgramId,
  name: ' Upper / Lower ',
  description: ' Four day split ',
  goal: ' Hypertrophy ',
  difficulty: 'intermediate' as const,
  durationWeeks: 8,
  days: [
    {
      id: ' monday-upper ',
      weekday: 'monday' as const,
      workoutTemplateId: legacyWorkoutId,
      workoutTemplateName: ' Upper A ',
    },
    {
      id: ' tuesday-rest ',
      weekday: 'tuesday' as const,
      restDay: true,
    },
  ],
  progression: {
    targetReps: 10,
    rir: 2,
    strategy: ' double progression ',
  },
  createdAt: '2026-07-23T10:00:00.000Z',
  isCustom: true,
};

describe('training program sync', () => {
  it('normalizes legacy program and workout template ids', () => {
    expect(normalizeTrainingProgramForSync(program)).toEqual({
      id: entityId,
      name: 'Upper / Lower',
      description: 'Four day split',
      goal: 'Hypertrophy',
      difficulty: 'intermediate',
      durationWeeks: 8,
      days: [
        {
          id: 'monday-upper',
          weekday: 'monday',
          workoutTemplateId,
          workoutTemplateName: 'Upper A',
        },
        {
          id: 'tuesday-rest',
          weekday: 'tuesday',
          restDay: true,
        },
      ],
      progression: {
        targetReps: 10,
        rir: 2,
        strategy: 'double progression',
      },
      createdAt: '2026-07-23T10:00:00.000Z',
      isCustom: true,
    });
  });

  it('queues a revisioned payload without ownership fields', () => {
    const operation = createTrainingProgramQueueOperation({
      action: 'create',
      program,
      userId,
      deviceId,
      baseRevision: 0,
      now: '2026-07-23T11:00:00.000Z',
    });

    expect(operation).toMatchObject({
      opId: `trainingPrograms:${entityId}`,
      entityType: 'trainingPrograms',
      entityId,
      action: 'create',
      actorId: userId,
      baseRevision: { number: 0 },
      payload: {
        schemaVersion: 1,
        id: entityId,
        name: 'Upper / Lower',
        goal: 'Hypertrophy',
        difficulty: 'intermediate',
        durationWeeks: 8,
        days: [
          {
            id: 'monday-upper',
            weekday: 'monday',
            workoutTemplateId,
          },
          {
            id: 'tuesday-rest',
            weekday: 'tuesday',
            restDay: true,
          },
        ],
        createdAt: '2026-07-23T10:00:00.000Z',
        updatedAt: '2026-07-23T11:00:00.000Z',
      },
    });
    expect(operation.payload).not.toHaveProperty('userId');
  });

  it('applies valid remote changes and replaces a matching legacy record', () => {
    const result = applyRemoteTrainingProgramChanges(
      { ...defaultState, trainingPrograms: [program] },
      [
        {
          entityType: 'trainingPrograms',
          entityId,
          revision: 6,
          payload: {
            schemaVersion: 1,
            id: entityId,
            name: 'Remote Upper / Lower',
            goal: 'Hypertrophy',
            difficulty: 'intermediate',
            durationWeeks: 10,
            days: [
              {
                id: 'monday-upper',
                weekday: 'monday',
                workoutTemplateId,
              },
            ],
            isCustom: true,
            createdAt: '2026-07-23T10:00:00.000Z',
            updatedAt: '2026-07-23T12:00:00.000Z',
            deviceId,
          },
        },
      ],
      [],
      userId,
      new Map(),
      '2026-07-23T12:01:00.000Z',
    );

    expect(result.nextState.trainingPrograms).toHaveLength(1);
    expect(result.nextState.trainingPrograms[0]).toMatchObject({
      id: entityId,
      name: 'Remote Upper / Lower',
      durationWeeks: 10,
      days: [{ workoutTemplateId }],
    });
    expect(result.metadata[0]).toMatchObject({
      id: entityId,
      userId,
      revision: 6,
      deviceId,
      snapshot: { name: 'Remote Upper / Lower' },
    });
  });

  it('ignores malformed remote payloads and applies tombstones', () => {
    const malformed = applyRemoteTrainingProgramChanges(
      { ...defaultState, trainingPrograms: [program] },
      [
        {
          entityType: 'training_programs',
          entityId,
          revision: 7,
          payload: {
            schemaVersion: 1,
            id: entityId,
            name: 'Broken',
            goal: 'Hypertrophy',
            difficulty: 'intermediate',
            durationWeeks: 8,
            days: [{ id: 'monday', weekday: 'monday' }],
            isCustom: true,
            createdAt: 'bad-date',
          },
        },
      ],
      [],
      userId,
    );
    expect(malformed.appliedRecordIds).toEqual([]);
    expect(malformed.nextState.trainingPrograms).toEqual([program]);

    const deleted = applyRemoteTrainingProgramChanges(
      { ...defaultState, trainingPrograms: [program] },
      [],
      [
        {
          entityType: 'trainingPrograms',
          entityId,
          revision: 8,
          appliedAt: '2026-07-23T13:00:00.000Z',
        },
      ],
      userId,
    );
    expect(deleted.nextState.trainingPrograms).toEqual([]);
    expect(deleted.deletedRecordIds).toEqual([entityId]);
  });
});
