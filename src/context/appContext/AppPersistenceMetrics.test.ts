import { beforeEach, describe, expect, test, vi } from 'vitest';

import { defaultState } from '@/data/defaults';

import {
  clearAppPersistenceMeasurements,
  getAppPersistenceMeasurements,
  measureAppStatePersistence,
  measureAppStateRestore,
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
        operation: 'save',
        outcome: 'success',
        serializedCharacters: JSON.stringify(defaultState).length,
      }),
    ]);
  });

  test('records successful restore duration and restored snapshot size', async () => {
    const load = vi.fn(async () => defaultState);

    await expect(measureAppStateRestore({ load })).resolves.toBe(defaultState);

    expect(load).toHaveBeenCalledTimes(1);
    expect(getAppPersistenceMeasurements()).toEqual([
      expect.objectContaining({
        hasOutbox: false,
        label: 'Restore app state',
        operation: 'restore',
        outcome: 'success',
        serializedCharacters: JSON.stringify(defaultState).length,
      }),
    ]);
  });

  test('records an empty restore without inventing payload data', async () => {
    await expect(measureAppStateRestore({ load: async () => null })).resolves.toBeNull();

    expect(getAppPersistenceMeasurements()).toEqual([
      expect.objectContaining({
        operation: 'restore',
        outcome: 'success',
        serializedCharacters: 0,
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
        operation: 'save',
        outcome: 'failure',
      }),
    ]);
  });

  test('records restore failures and preserves the original rejection', async () => {
    const failure = new Error('restore failed');

    await expect(
      measureAppStateRestore({
        load: async () => {
          throw failure;
        },
      }),
    ).rejects.toBe(failure);

    expect(getAppPersistenceMeasurements()).toEqual([
      expect.objectContaining({
        operation: 'restore',
        outcome: 'failure',
        serializedCharacters: 0,
      }),
    ]);
  });

  test('adds no measurement overhead when disabled', async () => {
    setAppPersistenceMeasurementEnabled(false);
    const save = vi.fn(async () => undefined);
    const load = vi.fn(async () => defaultState);

    await measureAppStatePersistence({
      hasOutbox: false,
      label: 'Save workout session',
      nextState: defaultState,
      save,
    });
    await measureAppStateRestore({ load });

    expect(save).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
    expect(getAppPersistenceMeasurements()).toEqual([]);
  });
});
