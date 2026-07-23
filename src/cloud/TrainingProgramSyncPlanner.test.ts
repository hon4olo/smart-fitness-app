import { describe, expect, it } from 'vitest';

import type { TrainingProgramSyncMetadata } from '@/storage';
import {
  getTrainingProgramEntityId,
  normalizeTrainingProgramForSync,
  toTrainingProgramSyncSnapshot,
} from './TrainingProgramSync';
import { planTrainingProgramSyncOperations } from './TrainingProgramSyncPlanner';

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const workoutTemplateId = '33333333-3333-4333-8333-333333333333';
const now = '2026-07-23T12:00:00.000Z';
const program = {
  id: 'custom-program-1',
  name: 'Upper / Lower',
  goal: 'Hypertrophy',
  difficulty: 'intermediate' as const,
  durationWeeks: 8,
  days: [
    {
      id: 'monday-upper',
      weekday: 'monday' as const,
      workoutTemplateId,
    },
  ],
  createdAt: '2026-07-23T10:00:00.000Z',
  isCustom: true,
};
const normalized = normalizeTrainingProgramForSync(program, now);
const entityId = getTrainingProgramEntityId(program.id);

const metadata = (overrides: Partial<TrainingProgramSyncMetadata> = {}) => ({
  id: entityId,
  userId,
  revision: 4,
  deviceId,
  createdAt: normalized.createdAt,
  syncedAt: '2026-07-23T11:00:00.000Z',
  snapshot: toTrainingProgramSyncSnapshot(normalized),
  deletedAt: null,
  ...overrides,
});

describe('training program sync planner', () => {
  it('creates an operation for a new custom program', () => {
    const operations = planTrainingProgramSyncOperations({
      programs: [program],
      metadata: new Map(),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      entityType: 'trainingPrograms',
      entityId,
      action: 'create',
      baseRevision: { number: 0 },
    });
  });

  it('skips unchanged, seeded and already pending programs', () => {
    const unchanged = planTrainingProgramSyncOperations({
      programs: [program],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });
    expect(unchanged).toEqual([]);

    const seeded = planTrainingProgramSyncOperations({
      programs: [{ ...program, isCustom: false }],
      metadata: new Map(),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });
    expect(seeded).toEqual([]);

    const pending = planTrainingProgramSyncOperations({
      programs: [{ ...program, name: 'Changed' }],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [
        {
          opId: `trainingPrograms:${entityId}`,
          entityType: 'trainingPrograms',
          entityId,
          action: 'update',
          payload: {},
          baseRevision: { id: 'rev-4', number: 4, createdAt: now },
          clientTimestamp: now,
          idempotencyKey: 'pending-program',
          retryCount: 0,
          status: 'pending',
          metadata: { userId },
        },
      ],
      userId,
      deviceId,
      now,
    });
    expect(pending).toEqual([]);
  });

  it('creates update and deletion operations from revision metadata', () => {
    const updated = planTrainingProgramSyncOperations({
      programs: [{ ...program, name: 'Upper / Lower v2' }],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });
    expect(updated[0]).toMatchObject({
      entityId,
      action: 'update',
      baseRevision: { number: 4 },
    });

    const deleted = planTrainingProgramSyncOperations({
      programs: [],
      metadata: new Map([[`${userId}:${entityId}`, metadata()]]),
      pendingOperations: [],
      userId,
      deviceId,
      now,
    });
    expect(deleted[0]).toMatchObject({
      entityId,
      action: 'delete',
      baseRevision: { number: 4 },
    });
  });
});
