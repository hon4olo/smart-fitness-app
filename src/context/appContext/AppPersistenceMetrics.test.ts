import { beforeEach, describe, expect, test, vi } from 'vitest';

import { defaultState } from '@/data/defaults';

import {
  clearAppPersistenceMeasurements,
  getAppPersistenceMeasurements,
  measureAppStatePersistence,
  setAppPersistenceMeasurementEnabled,
} from './AppPersistenceMetrics';

describe('AppPersistenceMetrics', () => {
  beforeEach(() => {
    clearAppPersistenceMeasurements();
    setAppPersistenceMeasurementEnabled(true);
  });

  test('records only bounded metadata for a successful snapshot write', async () => {
    const save = vi.fn(async () => undefined);

    await measureAppStatePersistence({
      hasOutbox: false,
      label: 'Save profile goals',
      nextState: defaultState,
      save,
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(getAppPersistenceMeasurements()).toEqual([
      expect.objectContaining({
        hasOutbox: false,
        label: 'Save profile goals',
        outcome: 'success',
        serializedCharacters: JSON.stringify(defaultState).length,
      }),
    ]);
  });

  test('records failure metadata and preserves the original rejection', async () => {
    const failure = new Error('storage failed');

    await expect(
      measureAppStatePersistence({
        hasOutbox: true,
        label: 'Save weight entry',
        nextState: defaultState,
        save: async () => {
          throw failure;
        },
      }),
    ).rejects.toBe(failure);

    expect(getAppPersistenceMeasurements()).toEqual([
      expect.objectContaining({
        hasOutbox: true,
        label: 'Save weight entry',
        outcome: 'failure',
      }),
    ]);
  });

  test('adds no measurement overhead when disabled', async () => {
    setAppPersistenceMeasurementEnabled(false);
    const save = vi.fn(async () => undefined);

    await measureAppStatePersistence({
      hasOutbox: false,
      label: 'Save workout session',
      nextState: defaultState,
      save,
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(getAppPersistenceMeasurements()).toEqual([]);
  });
});
