import { describe, expect, test } from 'vitest';

declare const require: any;

const { performance } = require('node:perf_hooks') as {
  performance: { now(): number };
};

import { defaultState } from '@/data/defaults';
import { createLocalAppRepository } from '@/repositories';
import type { LocalStateDiagnosticsRecorder } from '@/storage/LocalStateDiagnostics';
import { utf8ByteLength } from '@/storage/LocalStateDiagnostics';
import type { StorageAdapter } from '@/storage/StorageAdapter';
import {
  createRepresentativeAppState,
  createStressAppState,
} from '@/testing/appStatePerformanceFixtures';
import type { AppState } from '@/types';

const noopDiagnostics: LocalStateDiagnosticsRecorder = {
  record() {},
  reset() {},
  async read() {
    throw new Error('not used');
  },
  async flush() {},
};

const createMemoryStorage = (): StorageAdapter & {
  getStoredValue(): string | null;
  setStoredValue(value: string): void;
} => {
  let storedValue: string | null = null;
  return {
    async read() {
      return storedValue;
    },
    async write(_key, value) {
      storedValue = value;
    },
    async remove() {
      storedValue = null;
    },
    getStoredValue() {
      return storedValue;
    },
    setStoredValue(value) {
      storedValue = value;
    },
  };
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
};

const measureSyncMedian = (iterations: number, run: () => void): number => {
  const durations = Array.from({ length: iterations }, () => {
    const startedAt = performance.now();
    run();
    return performance.now() - startedAt;
  });
  return median(durations);
};

const measureAsyncMedian = async (
  iterations: number,
  run: () => Promise<void>,
): Promise<number> => {
  const durations: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const startedAt = performance.now();
    await run();
    durations.push(performance.now() - startedAt);
  }
  return median(durations);
};

type BenchmarkResult = {
  label: 'default' | 'representative' | 'stress';
  serializedBytes: number;
  stringifyMedianMs: number;
  parseMedianMs: number;
  repositorySaveMedianMs: number;
  repositoryLoadMedianMs: number;
};

const benchmarkState = async (
  label: BenchmarkResult['label'],
  state: AppState,
  iterations: number,
): Promise<BenchmarkResult> => {
  const serialized = JSON.stringify(state);
  const storage = createMemoryStorage();
  const repository = createLocalAppRepository(storage, {
    diagnosticsRecorder: noopDiagnostics,
  });

  const stringifyMedianMs = measureSyncMedian(iterations, () => {
    JSON.stringify(state);
  });
  const parseMedianMs = measureSyncMedian(iterations, () => {
    JSON.parse(serialized);
  });
  const repositorySaveMedianMs = await measureAsyncMedian(iterations, async () => {
    await repository.saveState(state);
  });
  const repositoryLoadMedianMs = await measureAsyncMedian(iterations, async () => {
    storage.setStoredValue(serialized);
    await repository.loadState();
  });

  expect(storage.getStoredValue()).not.toBeNull();

  return {
    label,
    serializedBytes: utf8ByteLength(serialized),
    stringifyMedianMs,
    parseMedianMs,
    repositorySaveMedianMs,
    repositoryLoadMedianMs,
  };
};

describe('AppState repository benchmark capture', () => {
  test('captures default, representative, and stress repository costs', async () => {
    const results = [
      await benchmarkState('default', defaultState, 30),
      await benchmarkState('representative', createRepresentativeAppState(), 15),
      await benchmarkState('stress', createStressAppState(), 7),
    ];

    console.log(`APP_STATE_BENCHMARK_RESULTS=${JSON.stringify(results)}`);

    expect(results[1].serializedBytes).toBeGreaterThan(results[0].serializedBytes);
    expect(results[2].serializedBytes).toBeGreaterThan(results[1].serializedBytes);

    // Temporary capture gate: replaced with stable assertions after CI output is recorded.
    expect('benchmark-captured').toBe('update-results-document');
  });
});
