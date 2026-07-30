import { describe, expect, it } from 'vitest';

import { defaultState } from '@/data/defaults';
import type { AppState } from '@/types';

import {
  countLocalStateEntities,
  createLocalStateDiagnosticsRecorder,
  LOCAL_STATE_DIAGNOSTICS_STORAGE_KEY,
  utf8ByteLength,
} from './LocalStateDiagnostics';
import type { StorageAdapter } from './StorageAdapter';

const createMemoryStorage = (): StorageAdapter & { values: Map<string, string> } => {
  const values = new Map<string, string>();
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

describe('local state diagnostics', () => {
  it('measures UTF-8 size without requiring TextEncoder', () => {
    expect(utf8ByteLength('abc')).toBe(3);
    expect(utf8ByteLength('тест')).toBe(8);
    expect(utf8ByteLength('🏋️')).toBe(7);
  });

  it('counts entities without retaining their content', () => {
    const state = defaultState as AppState;
    expect(countLocalStateEntities(state)).toEqual({
      workouts: state.workouts.length,
      trainingPrograms: state.trainingPrograms.length,
      exercises: state.exercises.length,
      workoutSessions: state.workoutSessions.length,
      foodEntries: state.foodEntries.length,
      mealTemplates: state.mealTemplates.length,
      weightHistory: state.weightHistory.length,
      bodyMeasurements: state.bodyMeasurements.length,
      userLimitations: state.userLimitations.length,
      recoveryCheckIns: state.recoveryCheckIns.length,
    });
  });

  it('persists aggregate load/save timing, size, counts, and failure rates only', async () => {
    const storage = createMemoryStorage();
    const timestamps = [
      new Date('2026-07-30T00:00:00.000Z'),
      new Date('2026-07-30T00:00:01.000Z'),
      new Date('2026-07-30T00:00:02.000Z'),
    ];
    const recorder = createLocalStateDiagnosticsRecorder(storage, {
      now: () => timestamps.shift() ?? new Date('2026-07-30T00:00:03.000Z'),
    });
    const state = defaultState as AppState;
    const serializedState = JSON.stringify(state);

    recorder.record({
      operation: 'load',
      durationMs: 14.5,
      success: true,
      serializedState,
      state,
    });
    recorder.record({ operation: 'save', durationMs: 22, success: false });
    await recorder.flush();

    const diagnostics = await recorder.read();
    expect(diagnostics).toMatchObject({
      schemaVersion: 1,
      loadCount: 1,
      loadFailureCount: 0,
      saveCount: 1,
      saveFailureCount: 1,
      lastSerializedBytes: utf8ByteLength(serializedState),
      maximumSerializedBytes: utf8ByteLength(serializedState),
      lastLoadDurationMs: 14.5,
      maximumLoadDurationMs: 14.5,
      lastSaveDurationMs: 22,
      maximumSaveDurationMs: 22,
      entityCounts: countLocalStateEntities(state),
    });

    const stored = storage.values.get(LOCAL_STATE_DIAGNOSTICS_STORAGE_KEY) ?? '';
    expect(stored).not.toContain('Bench press');
    expect(stored).not.toContain('Upper Body Strength');
    expect(stored).not.toContain('user@example.com');
  });

  it('fails open when the diagnostics store cannot write', async () => {
    const storage: StorageAdapter = {
      async read() {
        return null;
      },
      async write() {
        throw new Error('storage unavailable');
      },
      async remove() {
        return undefined;
      },
    };
    const recorder = createLocalStateDiagnosticsRecorder(storage);
    recorder.record({ operation: 'save', durationMs: 5, success: true });
    await expect(recorder.flush()).resolves.toBeUndefined();
    await expect(recorder.read()).resolves.toMatchObject({ saveCount: 1 });
  });
});
