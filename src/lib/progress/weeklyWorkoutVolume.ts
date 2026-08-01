import type { WorkoutSession } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export type WeeklyWorkoutVolumePoint = {
  key: string;
  startAt: string;
  endAt: string;
  volume: number;
  workoutCount: number;
};

type WeeklyWorkoutVolumeOptions = {
  weeks?: number;
  timezoneOffsetMinutes?: number;
};

const getSessionTimestamp = (session: WorkoutSession) => {
  const value = session.finishedAt || session.startedAt;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const getLocalWeekStart = (timestamp: number, timezoneOffsetMinutes: number) => {
  const localTimestamp = timestamp + timezoneOffsetMinutes * 60 * 1000;
  const date = new Date(localTimestamp);
  const day = date.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysSinceMonday);
};

const getSessionVolume = (session: WorkoutSession) =>
  session.sets.reduce((total, set) => {
    const isCompleted = set.completed !== false;
    if (!isCompleted || !Number.isFinite(set.weight) || !Number.isFinite(set.reps)) return total;
    if (set.weight <= 0 || set.reps <= 0) return total;
    return total + set.weight * set.reps;
  }, 0);

export const getWeeklyWorkoutVolume = (
  sessions: WorkoutSession[],
  options: WeeklyWorkoutVolumeOptions = {},
): WeeklyWorkoutVolumePoint[] => {
  const weeks = Math.min(12, Math.max(8, options.weeks ?? 10));
  const timezoneOffsetMinutes = options.timezoneOffsetMinutes ?? 0;
  const validSessions = sessions
    .map((session) => ({ session, timestamp: getSessionTimestamp(session) }))
    .filter(
      (entry): entry is { session: WorkoutSession; timestamp: number } =>
        entry.timestamp !== null,
    );

  if (validSessions.length === 0) return [];

  const latestTimestamp = Math.max(...validSessions.map((entry) => entry.timestamp));
  const latestWeekStartLocal = getLocalWeekStart(latestTimestamp, timezoneOffsetMinutes);
  const firstWeekStartLocal = latestWeekStartLocal - (weeks - 1) * WEEK_MS;
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const startLocal = firstWeekStartLocal + index * WEEK_MS;
    const startUtc = startLocal - timezoneOffsetMinutes * 60 * 1000;
    const endUtc = startUtc + WEEK_MS;
    return {
      key: new Date(startLocal).toISOString().slice(0, 10),
      startAt: new Date(startUtc).toISOString(),
      endAt: new Date(endUtc).toISOString(),
      volume: 0,
      workoutCount: 0,
    } satisfies WeeklyWorkoutVolumePoint;
  });

  for (const { session, timestamp } of validSessions) {
    const weekStartLocal = getLocalWeekStart(timestamp, timezoneOffsetMinutes);
    const index = Math.floor((weekStartLocal - firstWeekStartLocal) / WEEK_MS);
    if (index < 0 || index >= buckets.length) continue;

    const volume = getSessionVolume(session);
    if (volume <= 0) continue;
    buckets[index].volume += volume;
    buckets[index].workoutCount += 1;
  }

  return buckets;
};
