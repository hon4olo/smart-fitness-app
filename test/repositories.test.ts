import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { defaultState } from '@/data/defaults';
import { createLocalAppRepository } from '@/repositories';
import type { StorageAdapter } from '@/storage/StorageAdapter';

describe('local app repository', () => {
  const read = vi.fn<StorageAdapter['read']>();
  const write = vi.fn<StorageAdapter['write']>();
  const remove = vi.fn<StorageAdapter['remove']>();

  const storage: StorageAdapter = { read, write, remove };

  beforeEach(() => {
    read.mockReset();
    write.mockReset();
    remove.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T03:04:05.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads and normalizes the stored state using the existing key', async () => {
    const repository = createLocalAppRepository(storage);
    const storedState = {
      ...defaultState,
      workouts: [
        {
          id: 'custom-workout',
          title: 'Custom Workout',
          exercises: ['Bench Press'],
        },
      ],
    };

    read.mockResolvedValueOnce(JSON.stringify(storedState));

    const loadedState = await repository.loadState();

    expect(read).toHaveBeenCalledWith('@smart_fitness_mvp_state');
    expect(loadedState?.workouts[0].exercises[0]).toEqual({
      id: 'bench-press-0',
      name: 'Bench Press',
      isCustom: true,
      createdAt: '2026-01-02T03:04:05.000Z',
    });
  });

  it('saves and clears state using the existing key without changing the payload shape', async () => {
    const repository = createLocalAppRepository(storage);
    const nextState = defaultState;

    await repository.saveState(nextState);
    await repository.clearState();

    expect(write).toHaveBeenCalledWith('@smart_fitness_mvp_state', JSON.stringify(nextState));
    expect(remove).toHaveBeenCalledWith('@smart_fitness_mvp_state');
  });
});
