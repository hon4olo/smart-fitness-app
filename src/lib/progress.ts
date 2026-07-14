import type { BodyMeasurement, WeightEntry, WorkoutSession } from '@/types';

import { calculateEstimated1RM } from '@/lib/workouts';

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_STABLE_THRESHOLD = 0.15;

export type TrendDirection = 'up' | 'down' | 'stable';

export type WeightAnalytics = {
  currentWeight: number | null;
  currentWeightEntry: WeightEntry | null;
  delta7Days: number | null;
  delta30Days: number | null;
  weeklyAverage: number | null;
  direction: TrendDirection;
  recentEntries: WeightEntry[];
};

export type MeasurementInsight = {
  id: string;
  label: string;
  latestValue: string;
  previousValue?: string;
  delta: number | null;
  deltaLabel?: string;
  direction: TrendDirection;
  improved: boolean;
  createdAt: string;
};

export type WorkoutVolumePoint = {
  id: string;
  label: string;
  volume: number;
  createdAt: string;
};

export type ExerciseProgression = {
  exerciseName: string;
  lastPerformedAt: string;
  latestWeight: number;
  latestReps: number;
  latestEstimated1RM: number;
  previousEstimated1RM: number | null;
  trendDelta: number | null;
  recentVolume: number;
  totalSets: number;
  daysInactive: number;
};

export type PersonalRecordEntry = {
  id: string;
  createdAt: string;
  exerciseName: string;
  label: string;
  value: string;
  deltaLabel?: string;
  kind: 'latest' | 'estimated';
};

export type ProgressAnalytics = {
  weight: WeightAnalytics;
  measurements: MeasurementInsight[];
  workoutVolumeTrend: WorkoutVolumePoint[];
  improvingExercises: ExerciseProgression[];
  inactiveExercises: ExerciseProgression[];
  latestPrs: PersonalRecordEntry[];
  estimatedNewPrs: PersonalRecordEntry[];
};

type NumericMeasurement = {
  numeric: number;
  unit: string;
};

type ExerciseSessionPoint = {
  createdAt: string;
  estimated1RM: number;
  totalVolume: number;
  topSetWeight: number;
  topSetReps: number;
};

const sortByCreatedAtAsc = <T extends { createdAt: string }>(entries: T[]) => {
  return [...entries].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
};

const sortByCreatedAtDesc = <T extends { createdAt: string }>(entries: T[]) => {
  return [...entries].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
};

const formatDelta = (delta: number) => `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`;

const parseNumericMeasurement = (value: string): NumericMeasurement | null => {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);

  if (!match) {
    return null;
  }

  return {
    numeric: Number(match[1]),
    unit: match[2].trim(),
  };
};

const getTrendDirection = (delta: number | null): TrendDirection => {
  if (delta === null) {
    return 'stable';
  }

  if (Math.abs(delta) <= TREND_STABLE_THRESHOLD) {
    return 'stable';
  }

  return delta > 0 ? 'up' : 'down';
};

const calculateAverage = (values: number[]) => {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

const findHistoricalReference = <T extends { createdAt: string }>(entries: T[], latest: T, daysBack: number) => {
  const latestTime = new Date(latest.createdAt).getTime();
  const threshold = latestTime - daysBack * DAY_MS;
  const eligibleEntries = entries.filter((entry) => new Date(entry.createdAt).getTime() <= threshold);

  if (eligibleEntries.length > 0) {
    return eligibleEntries.at(-1) ?? null;
  }

  return entries[0] ?? null;
};

const summarizeExerciseSessions = (workoutSessions: WorkoutSession[]) => {
  const sessions = sortByCreatedAtAsc(workoutSessions.map((session) => ({ ...session, createdAt: session.finishedAt || session.startedAt })));
  const exerciseMap = new Map<string, ExerciseSessionPoint[]>();
  const volumeTrend: WorkoutVolumePoint[] = [];

  sessions.forEach((session) => {
    let sessionVolume = 0;
    const perExercise = new Map<string, { topSetWeight: number; topSetReps: number; estimated1RM: number; totalVolume: number }>();

    session.sets.forEach((set) => {
      if (set.weight <= 0 || set.reps <= 0) {
        return;
      }

      sessionVolume += set.weight * set.reps;
      const estimated1RM = calculateEstimated1RM(set.weight, set.reps);
      const previous = perExercise.get(set.exerciseName);

      if (!previous || estimated1RM > previous.estimated1RM) {
        perExercise.set(set.exerciseName, {
          topSetWeight: set.weight,
          topSetReps: set.reps,
          estimated1RM,
          totalVolume: (previous?.totalVolume ?? 0) + set.weight * set.reps,
        });
      } else {
        perExercise.set(set.exerciseName, {
          ...previous,
          totalVolume: previous.totalVolume + set.weight * set.reps,
        });
      }
    });

    volumeTrend.push({
      id: session.id,
      label: session.finishedAt || session.startedAt,
      volume: sessionVolume,
      createdAt: session.finishedAt || session.startedAt,
    });

    perExercise.forEach((point, exerciseName) => {
      const current = exerciseMap.get(exerciseName) ?? [];
      current.push({
        createdAt: session.finishedAt || session.startedAt,
        estimated1RM: point.estimated1RM,
        totalVolume: point.totalVolume,
        topSetWeight: point.topSetWeight,
        topSetReps: point.topSetReps,
      });
      exerciseMap.set(exerciseName, current);
    });
  });

  return { exerciseMap, sessions, volumeTrend };
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
  const weekThreshold = new Date(latestEntry.createdAt).getTime() - 7 * DAY_MS;
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

export const getMeasurementInsights = (bodyMeasurements: BodyMeasurement[]): MeasurementInsight[] => {
  const grouped = sortByCreatedAtAsc(bodyMeasurements).reduce<Record<string, BodyMeasurement[]>>((groups, measurement) => {
    const key = measurement.label.trim().toLowerCase();
    const nextGroup = groups[key] ?? [];

    return {
      ...groups,
      [key]: [...nextGroup, measurement],
    };
  }, {});

  return Object.values(grouped)
    .map((measurements) => {
      const sorted = sortByCreatedAtAsc(measurements);
      const latest = sorted.at(-1)!;
      const previous = sorted.at(-2);
      const latestParsed = parseNumericMeasurement(latest.value);
      const previousParsed = previous ? parseNumericMeasurement(previous.value) : null;
      const comparable =
        latestParsed && previousParsed && latestParsed.unit === previousParsed.unit && latestParsed.numeric !== undefined && previousParsed.numeric !== undefined;
      const delta = comparable ? latestParsed.numeric - previousParsed.numeric : null;
      const direction = getTrendDirection(delta);
      const improved = delta !== null ? delta < 0 : false;

      return {
        id: latest.id,
        label: latest.label,
        latestValue: latest.value,
        previousValue: previous?.value,
        delta,
        deltaLabel:
          delta === null
            ? undefined
            : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}${latestParsed?.unit ? ` ${latestParsed.unit}` : ''}`,
        direction,
        improved,
        createdAt: latest.createdAt,
      } satisfies MeasurementInsight;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6);
};

export const getWorkoutVolumeTrend = (workoutSessions: WorkoutSession[]): WorkoutVolumePoint[] => {
  return summarizeExerciseSessions(workoutSessions).volumeTrend
    .filter((point) => point.volume > 0)
    .slice(-10);
};

export const getExerciseProgressions = (workoutSessions: WorkoutSession[], exerciseNames: string[] = []) => {
  const { exerciseMap } = summarizeExerciseSessions(workoutSessions);
  const names = new Set<string>([...exerciseNames, ...exerciseMap.keys()]);

  const progressions: ExerciseProgression[] = [];

  names.forEach((exerciseName) => {
    const points = sortByCreatedAtAsc(exerciseMap.get(exerciseName) ?? []);

    if (points.length === 0) {
      return;
    }

    const latest = points.at(-1)!;
    const previous = points.at(-2) ?? null;
    const trendDelta = previous ? latest.estimated1RM - previous.estimated1RM : null;
    const lastPerformedAt = latest.createdAt;
    const daysInactive = Math.max(0, Math.floor((Date.now() - new Date(lastPerformedAt).getTime()) / DAY_MS));
    const recentVolume = points.slice(-3).reduce((total, point) => total + point.totalVolume, 0);

    progressions.push({
      exerciseName,
      lastPerformedAt,
      latestWeight: latest.topSetWeight,
      latestReps: latest.topSetReps,
      latestEstimated1RM: latest.estimated1RM,
      previousEstimated1RM: previous?.estimated1RM ?? null,
      trendDelta,
      recentVolume,
      totalSets: points.length,
      daysInactive,
    });
  });

  return progressions.sort((left, right) => {
    const deltaLeft = left.trendDelta ?? Number.NEGATIVE_INFINITY;
    const deltaRight = right.trendDelta ?? Number.NEGATIVE_INFINITY;

    if (deltaRight !== deltaLeft) {
      return deltaRight - deltaLeft;
    }

    return new Date(right.lastPerformedAt).getTime() - new Date(left.lastPerformedAt).getTime();
  });
};

export const getImprovingExercises = (workoutSessions: WorkoutSession[], exerciseNames: string[] = []) => {
  return getExerciseProgressions(workoutSessions, exerciseNames)
    .filter((exercise) => exercise.trendDelta !== null && exercise.trendDelta > TREND_STABLE_THRESHOLD)
    .slice(0, 4);
};

export const getInactiveExercises = (workoutSessions: WorkoutSession[], exerciseNames: string[] = []) => {
  return getExerciseProgressions(workoutSessions, exerciseNames)
    .filter((exercise) => exercise.daysInactive >= 14)
    .sort((left, right) => right.daysInactive - left.daysInactive)
    .slice(0, 4);
};

export const getPersonalRecords = (workoutSessions: WorkoutSession[], exerciseNames: string[] = []) => {
  const { exerciseMap } = summarizeExerciseSessions(workoutSessions);
  const names = new Set<string>([...exerciseNames, ...exerciseMap.keys()]);
  const latestPrs: PersonalRecordEntry[] = [];
  const estimatedNewPrs: PersonalRecordEntry[] = [];

  names.forEach((exerciseName) => {
    const points = sortByCreatedAtAsc(exerciseMap.get(exerciseName) ?? []);

    if (points.length === 0) {
      return;
    }

    let bestWeight = 0;
    let bestVolume = 0;
    let best1RM = 0;

    points.forEach((point) => {
      const pointVolume = point.totalVolume;
      const point1RM = point.estimated1RM;

      if (point.topSetWeight > bestWeight) {
        bestWeight = point.topSetWeight;
        latestPrs.push({
          id: `${exerciseName}-weight-${point.createdAt}`,
          createdAt: point.createdAt,
          exerciseName,
          label: 'New weight PR',
          value: `${point.topSetWeight.toFixed(1)} kg`,
          kind: 'latest',
        });
      }

      if (pointVolume > bestVolume) {
        bestVolume = pointVolume;
        latestPrs.push({
          id: `${exerciseName}-volume-${point.createdAt}`,
          createdAt: point.createdAt,
          exerciseName,
          label: 'New volume PR',
          value: `${pointVolume.toLocaleString()} kg`,
          kind: 'latest',
        });
      }

      if (point1RM > best1RM) {
        best1RM = point1RM;
        latestPrs.push({
          id: `${exerciseName}-1rm-${point.createdAt}`,
          createdAt: point.createdAt,
          exerciseName,
          label: 'New estimated 1RM PR',
          value: `${point1RM.toFixed(1)} kg`,
          kind: 'estimated',
        });
      }

    });

    const recentDeltas = points.slice(-3).map((point, index, array) => {
      if (index === 0) {
        return 0;
      }

      return point.estimated1RM - array[index - 1].estimated1RM;
    });
    const averageDelta = calculateAverage(recentDeltas.slice(1));

    if (averageDelta !== null && averageDelta > TREND_STABLE_THRESHOLD) {
      const projected = points.at(-1)!.estimated1RM + averageDelta;

      estimatedNewPrs.push({
        id: `${exerciseName}-projection`,
        createdAt: points.at(-1)!.createdAt,
        exerciseName,
        label: 'Projected next 1RM PR',
        value: `${projected.toFixed(1)} kg`,
        deltaLabel: `+${averageDelta.toFixed(1)} kg trend`,
        kind: 'estimated',
      });
    }
  });

  const latestRecords = sortByCreatedAtDesc(latestPrs).slice(0, 6);
  const projectedRecords = sortByCreatedAtDesc(estimatedNewPrs).slice(0, 4);

  return {
    latestPrs: latestRecords,
    estimatedNewPrs: projectedRecords,
  };
};

export const getProgressAnalytics = (state: {
  bodyMeasurements: BodyMeasurement[];
  exercises: { name: string }[];
  weightHistory: WeightEntry[];
  workoutSessions: WorkoutSession[];
}): ProgressAnalytics => {
  const exerciseNames = state.exercises.map((exercise) => exercise.name);

  const prs = getPersonalRecords(state.workoutSessions, exerciseNames);

  return {
    weight: getWeightAnalytics(state.weightHistory),
    measurements: getMeasurementInsights(state.bodyMeasurements),
    workoutVolumeTrend: getWorkoutVolumeTrend(state.workoutSessions),
    improvingExercises: getImprovingExercises(state.workoutSessions, exerciseNames),
    inactiveExercises: getInactiveExercises(state.workoutSessions, exerciseNames),
    latestPrs: prs.latestPrs,
    estimatedNewPrs: prs.estimatedNewPrs,
  };
};

export const formatProgressDelta = (delta: number | null, unit = 'kg') => {
  if (delta === null) {
    return '—';
  }

  return `${formatDelta(delta)} ${unit}`;
};
