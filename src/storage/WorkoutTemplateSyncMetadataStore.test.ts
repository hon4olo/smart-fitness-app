import { describe, expect, it, vi } from 'vitest';

import type { StorageAdapter } from './StorageAdapter';
import {
  createWorkoutTemplateSyncMetadataStore,
  WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY,
} from './WorkoutTemplateSyncMetadataStore';

const userId = '11111111-1111-4111-8111-111111111111';
const templateId = '22222222-2222-4222-8222-222222222222';
const runId = '33333333-3333-4333-8333-333333333333';
const sessionId = '44444444-4444-4444-8444-444444444444';
const setId = '55555555-5555-4555-8555-555555555555';

const createStorage = (initial: string | null = null) => {
  let value = initial;
  const storage: StorageAdapter = {
    read: vi.fn(async (key) =>
      key === WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY ? value : null,
    ),
    write: vi.fn(async (_key, next) => {
      value = next;
    }),
    remove: vi.fn(async () => {
      value = null;
    }),
  };
  return { storage, getValue: () => value };
};

describe('WorkoutTemplateSyncMetadataStore', () => {
  it('persists and reloads prescribed snapshots without losing coach metadata', async () => {
    const harness = createStorage();
    const store = createWorkoutTemplateSyncMetadataStore(harness.storage);

    await store.set({
      id: templateId,
      userId,
      revision: 12,
      deviceId: 'device-1',
      createdAt: '2026-07-23T12:00:00.000Z',
      syncedAt: '2026-07-23T12:01:00.000Z',
      deletedAt: null,
      snapshot: {
        title: 'Upper body · progress',
        description: 'Guarded progression',
        duration: '60 min',
        exercises: [
          {
            id: 'bench-press',
            name: 'Bench Press',
            muscleGroup: null,
            isCustom: false,
            createdAt: '2026-07-23T12:00:00.000Z',
          },
        ],
        prescription: [
          {
            sourceSetId: setId,
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            weight: 82.5,
            reps: 8,
            targetRpe: 8,
            adjustment: 'increase',
            rationaleCode: 'low_recorded_rpe',
          },
        ],
        coachMetadata: {
          schemaVersion: 1,
          runId,
          sourceSessionId: sessionId,
          strategy: 'progress',
          confirmedAt: '2026-07-23T12:00:00.000Z',
        },
        isCustom: true,
      },
    });

    expect(harness.getValue()).toContain('"version":2');
    expect(await store.get(templateId)).toMatchObject({
      userId,
      revision: 12,
      snapshot: {
        prescription: [{ sourceSetId: setId, targetRpe: 8 }],
        coachMetadata: { runId, sourceSessionId: sessionId },
      },
    });
  });

  it('loads legacy non-prescribed metadata as explicit null fields', async () => {
    const harness = createStorage(
      JSON.stringify({
        version: 1,
        records: [
          {
            id: templateId,
            userId,
            revision: 4,
            deviceId: 'device-1',
            createdAt: '2026-07-23T10:00:00.000Z',
            syncedAt: '2026-07-23T11:00:00.000Z',
            snapshot: {
              title: 'Push day',
              description: null,
              duration: '45 min',
              exercises: [
                {
                  id: 'bench-press',
                  name: 'Bench Press',
                  muscleGroup: null,
                  isCustom: false,
                  createdAt: '2026-07-23T10:00:00.000Z',
                },
              ],
              isCustom: true,
            },
          },
        ],
      }),
    );
    const record = await createWorkoutTemplateSyncMetadataStore(
      harness.storage,
    ).get(templateId);

    expect(record?.snapshot).toMatchObject({
      prescription: null,
      coachMetadata: null,
    });
  });

  it('rejects prescription without matching coach metadata', async () => {
    const harness = createStorage(
      JSON.stringify({
        records: [
          {
            id: templateId,
            userId,
            revision: 4,
            deviceId: 'device-1',
            createdAt: '2026-07-23T10:00:00.000Z',
            syncedAt: '2026-07-23T11:00:00.000Z',
            snapshot: {
              title: 'Invalid',
              description: null,
              duration: '45 min',
              exercises: [
                {
                  id: 'bench-press',
                  name: 'Bench Press',
                  muscleGroup: null,
                  isCustom: false,
                  createdAt: '2026-07-23T10:00:00.000Z',
                },
              ],
              prescription: [
                {
                  sourceSetId: setId,
                  exerciseId: 'bench-press',
                  exerciseName: 'Bench Press',
                  weight: 82.5,
                  reps: 8,
                  targetRpe: 8,
                  adjustment: 'increase',
                  rationaleCode: 'low_recorded_rpe',
                },
              ],
              isCustom: true,
            },
          },
        ],
      }),
    );

    expect(
      await createWorkoutTemplateSyncMetadataStore(harness.storage).load(),
    ).toEqual(new Map());
  });
});
