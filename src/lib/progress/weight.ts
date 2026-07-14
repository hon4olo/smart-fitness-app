import type { WeightEntry } from '@/types';

import {
  calculateAverage,
  getTrendDirection,
  sortByCreatedAtAsc,
  type TrendDirection,
  findHistoricalReference,
} from '@/lib/progress/formatting';

export type WeightAnalytics = {
  currentWeight: number | null;
  currentWeightEntry: WeightEntry | null;
  delta7Days: number | null;
  delta30Days: number | null;
  weeklyAverage: number | null;
  direction: TrendDirection;
  recentEntries: WeightEntry[];
};

export const getLatestWeightEntry = (weightHistory: WeightEntry[]) => {
  return sortByCreatedAtAsc(weightHistory).at(-1) ?? null;
};

export const getWeightAnalytics = (weightHistory: WeightEntry[]): WeightAnalytics => {
  const recentEntries = sortByCreatedAtAsc(weightHistory).slice(-14);
  const latestEntry = getLatestWeightEntry(weightHistory);

  if (!latestEntry) {
    return {
      currentWeight: null,
      currentWeightEntry: null,
      delta7Days: null,
      delta30Days: null,
      weeklyAverage: null,
      direction: 'stable',
      recentEntries,
    };
  }

  const reference7Days = findHistoricalReference(recentEntries, latestEntry, 7);
  const reference30Days = findHistoricalReference(recentEntries, latestEntry, 30);
  const delta7Days = reference7Days ? latestEntry.weight - reference7Days.weight : null;
  const delta30Days = reference30Days ? latestEntry.weight - reference30Days.weight : null;
  const weekThreshold = new Date(latestEntry.createdAt).getTime() - 7 * 24 * 60 * 60 * 1000;
  const weekValues = recentEntries
    .filter((entry) => new Date(entry.createdAt).getTime() >= weekThreshold)
    .map((entry) => entry.weight);

  return {
    currentWeight: latestEntry.weight,
    currentWeightEntry: latestEntry,
    delta7Days,
    delta30Days,
    weeklyAverage: calculateAverage(weekValues) ?? latestEntry.weight,
    direction: getTrendDirection(delta7Days),
    recentEntries,
  };
};
