export type ListPerformanceFixture = {
  id: string;
  label: string;
  groupKey: string;
  sortValue: number;
};

const buildFixture = (
  prefix: string,
  count: number,
  groupCount: number,
): ListPerformanceFixture[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    label: `${prefix} ${index + 1}`,
    groupKey: `${prefix}-group-${index % groupCount}`,
    sortValue: count - index,
  }));

export const LIST_PERFORMANCE_TARGETS = {
  exercises: 500,
  foodEntries: 500,
  programs: 100,
  weightEntries: 365,
  workoutSessions: 500,
} as const;

export const createListPerformanceFixtures = () => ({
  exercises: buildFixture('exercise', LIST_PERFORMANCE_TARGETS.exercises, 20),
  foodEntries: buildFixture('food-entry', LIST_PERFORMANCE_TARGETS.foodEntries, 4),
  programs: buildFixture('program', LIST_PERFORMANCE_TARGETS.programs, 10),
  weightEntries: buildFixture('weight-entry', LIST_PERFORMANCE_TARGETS.weightEntries, 12),
  workoutSessions: buildFixture(
    'workout-session',
    LIST_PERFORMANCE_TARGETS.workoutSessions,
    52,
  ),
});

export const groupFixtureItems = (items: ListPerformanceFixture[]) => {
  const groups = new Map<string, ListPerformanceFixture[]>();

  for (const item of items) {
    const group = groups.get(item.groupKey);
    if (group) {
      group.push(item);
    } else {
      groups.set(item.groupKey, [item]);
    }
  }

  return groups;
};

export const sortFixtureItems = (items: ListPerformanceFixture[]) =>
  [...items].sort((left, right) => left.sortValue - right.sortValue);
