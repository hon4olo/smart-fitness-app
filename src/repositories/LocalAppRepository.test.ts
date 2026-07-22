import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import { isUuid } from '@/lib/ids';
import type { StorageAdapter } from '@/storage/StorageAdapter';

import { createLocalAppRepository } from './LocalAppRepository';

const APP_STATE_KEY = '@smart_fitness_mvp_state';

const createMemoryStorage = (initialState: string): StorageAdapter & { values: Map<string, string> } => {
  const values = new Map<string, string>([[APP_STATE_KEY, initialState]]);

  return {
    values,
    async read(key) {
      return values.get(key) ?? null;
    },
    async write(key, value) {
      values.set(key, value);
    },
    async remove(key) {
      values.delete(key);
    },
  };
};

describe('LocalAppRepository migrations', () => {
  it('migrates and persists legacy weight IDs during restore', async () => {
    const legacyState = JSON.stringify({
      ...defaultState,
      weightHistory: [
        {
          id: '1721640000000',
          date: '2026-07-22',
          weight: 69.5,
          createdAt: '2026-07-22T08:00:00.000Z',
        },
      ],
    });
    const storage = createMemoryStorage(legacyState);
    const repository = createLocalAppRepository(storage);

    const restored = await repository.loadState();
    const migratedId = restored?.weightHistory[0]?.id;

    expect(isUuid(migratedId)).toBe(true);

    const persisted = JSON.parse(storage.values.get(APP_STATE_KEY) ?? '{}') as {
      weightHistory?: Array<{ id?: string }>;
    };
    expect(persisted.weightHistory?.[0]?.id).toBe(migratedId);
  });
});
