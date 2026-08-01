import type { WeightEntry } from '@/types';

export type WeightTrendRange = 7 | 30 | 90;

const DAY_MS = 24 * 60 * 60 * 1000;

const isValidEntry = (entry: WeightEntry) =>
  Number.isFinite(entry.weight) && Number.isFinite(Date.parse(entry.createdAt));

export const getWeightTrendEntries = (
  weightHistory: WeightEntry[],
  range: WeightTrendRange,
): WeightEntry[] => {
  const validEntries = weightHistory.filter(isValidEntry);
  if (validEntries.length === 0) return [];

  const latestTimestamp = Math.max(
    ...validEntries.map((entry) => Date.parse(entry.createdAt)),
  );
  const threshold = latestTimestamp - (range - 1) * DAY_MS;
  const latestEntryByDate = new Map<string, WeightEntry>();

  for (const entry of validEntries) {
    const timestamp = Date.parse(entry.createdAt);
    if (timestamp < threshold || timestamp > latestTimestamp) continue;

    const current = latestEntryByDate.get(entry.date);
    if (!current || Date.parse(current.createdAt) <= timestamp) {
      latestEntryByDate.set(entry.date, entry);
    }
  }

  return [...latestEntryByDate.values()].sort(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt),
  );
};
