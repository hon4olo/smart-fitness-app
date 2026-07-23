import { describe, expect, it, vi } from 'vitest';

import type { StorageAdapter } from './StorageAdapter';
import {
  createTrainingProgramSyncMetadataStore,
  TRAINING_PROGRAM_SYNC_METADATA_STORAGE_KEY,
} from './TrainingProgramSyncMetadataStore';

const userId = '11111111-1111-4111-8111-111111111111';
const programId = '22222222-2222-4222-8222-222222222222';
const workoutTemplateId = '33333333-3333-4333-8333-333333333333';

const createStorage = (initial: string | null = null) => {
  let value = initial;
  const storage: StorageAdapter = {
    read: vi.fn(async (key) =>
      key === TRAINING_PROGRAM_SYNC_METADATA_STORAGE_KEY ? value : null,
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

const record = {
  id: programId,
  userId,
  revision: 5,
  deviceId: 'device-1',
  createdAt: '2026-07-23T10:00:00.000Z',
  syncedAt: '2026-07-23T11:00:00.000Z',
  deletedAt: null,
  snapshot: {
    name: 'Upper / Lower',
    description: null,
    goal: 'Hypertrophy',
    difficulty: 'intermediate' as const,
    durationWeeks: 8,
    days: [
      {
        id: 'monday-upper',
        weekday: 'monday' as const,
        workoutTemplateId,
        workoutTemplateName: 'Upper A',
        notes: null,
        restDay: false,
      },
      {
        id: 'tuesday-rest',
        weekday: 'tuesday' as const,
        workoutTemplateId: null,
        workoutTemplateName: null,
        notes: null,
        restDay: true,
      },
    ],
    progression: {
      targetReps: 10,
      targetWeight: null,
      rir: 2,
      strategy: 'double progression',
    },
    isCustom: true as const,
    metadata: { source: 'manual' },
  },
};

describe('TrainingProgramSyncMetadataStore', () => {
  it('round-trips typed program snapshots', async () => {
    const harness = createStorage();
    const store = createTrainingProgramSyncMetadataStore(harness.storage);

    await store.set(record);

    expect(harness.getValue()).toContain('"version":1');
    expect(await store.get(programId)).toEqual(record);
  });

  it('rejects duplicate weekdays and incomplete training days', async () => {
    const duplicate = createStorage(
      JSON.stringify({
        records: [
          {
            ...record,
            snapshot: {
              ...record.snapshot,
              days: [
                record.snapshot.days[0],
                { ...record.snapshot.days[0], id: 'duplicate-day' },
              ],
            },
          },
        ],
      }),
    );
    expect(
      await createTrainingProgramSyncMetadataStore(duplicate.storage).load(),
    ).toEqual(new Map());

    const incomplete = createStorage(
      JSON.stringify({
        records: [
          {
            ...record,
            snapshot: {
              ...record.snapshot,
              days: [
                {
                  ...record.snapshot.days[0],
                  workoutTemplateId: null,
                },
              ],
            },
          },
        ],
      }),
    );
    expect(
      await createTrainingProgramSyncMetadataStore(incomplete.storage).load(),
    ).toEqual(new Map());
  });

  it('fails closed on malformed timestamps', async () => {
    const harness = createStorage(
      JSON.stringify({ records: [{ ...record, syncedAt: 'not-a-date' }] }),
    );
    expect(
      await createTrainingProgramSyncMetadataStore(harness.storage).load(),
    ).toEqual(new Map());
  });
});
