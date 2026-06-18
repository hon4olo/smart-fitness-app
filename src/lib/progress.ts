import type { BodyMeasurement, WeightEntry } from '@/types';

export const getLatestEntry = <T extends { createdAt: string }>(entries: T[]) => {
  if (entries.length === 0) {
    return null;
  }

  return [...entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).at(-1) ?? null;
};

export const calculateWeightDelta = (latestWeight?: number, previousWeight?: number | null) => {
  if (previousWeight === undefined || previousWeight === null) {
    return null;
  }

  return latestWeight !== undefined ? latestWeight - previousWeight : null;
};

export const getLatestWeightEntry = (weightHistory: WeightEntry[]) => {
  return weightHistory[0] ?? null;
};

export const summarizeBodyMeasurements = (bodyMeasurements: BodyMeasurement[]) => {
  return {
    count: bodyMeasurements.length,
    latest: bodyMeasurements[0] ?? null,
  };
};

export const formatWeightDelta = (delta: number) => `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg`;
