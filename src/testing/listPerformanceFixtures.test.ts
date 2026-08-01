import { describe, expect, test } from 'vitest';

import {
  createListPerformanceFixtures,
  groupFixtureItems,
  LIST_PERFORMANCE_TARGETS,
  sortFixtureItems,
} from './listPerformanceFixtures';

describe('list performance fixtures', () => {
  test('matches the representative Phase 4 dataset sizes', () => {
    const fixtures = createListPerformanceFixtures();

    expect(fixtures.exercises).toHaveLength(LIST_PERFORMANCE_TARGETS.exercises);
    expect(fixtures.foodEntries).toHaveLength(LIST_PERFORMANCE_TARGETS.foodEntries);
    expect(fixtures.programs).toHaveLength(LIST_PERFORMANCE_TARGETS.programs);
    expect(fixtures.weightEntries).toHaveLength(LIST_PERFORMANCE_TARGETS.weightEntries);
    expect(fixtures.workoutSessions).toHaveLength(
      LIST_PERFORMANCE_TARGETS.workoutSessions,
    );
  });

  test('provides stable unique keys for every representative collection', () => {
    const fixtures = createListPerformanceFixtures();

    for (const collection of Object.values(fixtures)) {
      expect(new Set(collection.map((item) => item.id)).size).toBe(collection.length);
    }
  });

  test('supports deterministic grouping and sorting measurements', () => {
    const fixtures = createListPerformanceFixtures();
    const groups = groupFixtureItems(fixtures.foodEntries);
    const sorted = sortFixtureItems(fixtures.workoutSessions);

    expect(groups.size).toBe(4);
    expect([...groups.values()].flat()).toHaveLength(500);
    expect(sorted[0].sortValue).toBe(1);
    expect(sorted.at(-1)?.sortValue).toBe(500);
  });
});
