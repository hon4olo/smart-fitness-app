export type TrendDirection = 'up' | 'down' | 'stable';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const TREND_STABLE_THRESHOLD = 0.15;

export const sortByCreatedAtAsc = <T extends { createdAt: string }>(entries: T[]) => {
  return [...entries].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
};

export const sortByCreatedAtDesc = <T extends { createdAt: string }>(entries: T[]) => {
  return [...entries].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
};

export const formatDelta = (delta: number) => `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`;

export const formatProgressDelta = (delta: number | null, unit = 'kg') => {
  if (delta === null) {
    return '—';
  }

  return `${formatDelta(delta)} ${unit}`;
};

export const getTrendDirection = (delta: number | null): TrendDirection => {
  if (delta === null) {
    return 'stable';
  }

  if (Math.abs(delta) <= TREND_STABLE_THRESHOLD) {
    return 'stable';
  }

  return delta > 0 ? 'up' : 'down';
};

export const calculateAverage = (values: number[]) => {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

type CreatedAtEntry = { createdAt: string };

export const findHistoricalReference = <T extends CreatedAtEntry>(entries: T[], latest: T, daysBack: number) => {
  const latestTime = new Date(latest.createdAt).getTime();
  const threshold = latestTime - daysBack * DAY_MS;
  const eligibleEntries = entries.filter((entry) => new Date(entry.createdAt).getTime() <= threshold);

  if (eligibleEntries.length > 0) {
    return eligibleEntries.at(-1) ?? null;
  }

  return entries[0] ?? null;
};

export const parseNumericMeasurement = (value: string) => {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);

  if (!match) {
    return null;
  }

  return {
    numeric: Number(match[1]),
    unit: match[2].trim(),
  };
};
