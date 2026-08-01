import { describe, expect, test } from 'vitest';

import { defaultState } from '@/data/defaults';
import {
  createRepresentativeAppState,
  createStressAppState,
} from '@/testing/appStatePerformanceFixtures';

import { analyzeAppStateSize } from './appStateSize';

describe('analyzeAppStateSize', () => {
  test('reports every top-level domain in descending size order', () => {
    const report = analyzeAppStateSize(defaultState);

    expect(report.totalSerializedCharacters).toBe(JSON.stringify(defaultState).length);
    expect(report.domains).toHaveLength(Object.keys(defaultState).length);
    expect(report.domains.map((domain) => domain.key).sort()).toEqual(
      Object.keys(defaultState).sort(),
    );
    expect(report.domains.every((domain, index) => {
      const next = report.domains[index + 1];
      return !next || domain.serializedCharacters >= next.serializedCharacters;
    })).toBe(true);
  });

  test('keeps domain shares bounded and identifies the largest stress domains', () => {
    const report = analyzeAppStateSize(createStressAppState());
    const topKeys = report.domains.slice(0, 3).map((domain) => domain.key);

    expect(report.domains.every((domain) => domain.share >= 0 && domain.share <= 1)).toBe(
      true,
    );
    expect(topKeys).toContain('workoutSessions');
    expect(topKeys).toContain('foodEntries');
  });

  test('produces monotonic default, representative, and stress totals', () => {
    const baseline = analyzeAppStateSize(defaultState).totalSerializedCharacters;
    const representative = analyzeAppStateSize(
      createRepresentativeAppState(),
    ).totalSerializedCharacters;
    const stress = analyzeAppStateSize(createStressAppState()).totalSerializedCharacters;

    expect(representative).toBeGreaterThan(baseline);
    expect(stress).toBeGreaterThan(representative);
  });
});
