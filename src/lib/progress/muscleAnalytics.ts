import type { Exercise, WorkoutSession } from '@/types';

import { DAY_MS } from './formatting';
import { getWorkoutTimestamp, resolveExerciseByName } from '@/lib/workouts';

export const MUSCLE_GROUP_KEYS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
] as const;

export type MuscleGroupKey = (typeof MUSCLE_GROUP_KEYS)[number];
export type MuscleBalanceStatus = 'balanced' | 'undertrained' | 'overtrained';
export type MuscleHeatLevel = 'high' | 'medium' | 'low' | 'none';

export type MuscleExerciseContribution = {
  exerciseName: string;
  workingSets: number;
  volume: number;
  percentageContribution: number;
};

export type MuscleGroupAnalytics = {
  key: MuscleGroupKey;
  label: string;
  workingSets: number;
  volume: number;
  previousWorkingSets: number;
  previousVolume: number;
  volumeShare: number;
  trendPercent: number | null;
  balanceStatus: MuscleBalanceStatus;
  heatLevel: MuscleHeatLevel;
  topExercises: MuscleExerciseContribution[];
};

export type MuscleAnalytics = {
  groups: MuscleGroupAnalytics[];
  totalWorkingSets: number;
  totalVolume: number;
  previousWorkingSets: number;
  previousVolume: number;
  dominantGroup: MuscleGroupAnalytics | null;
  insights: string[];
};

type Bucket = {
  exercises: Map<string, { workingSets: number; volume: number }>;
  workingSets: number;
  volume: number;
};

const MUSCLE_GROUP_LABELS: Record<MuscleGroupKey, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
};

const SYNONYMS: Record<MuscleGroupKey, string[]> = {
  chest: ['chest', 'pec', 'pector', 'push'],
  back: ['back', 'lat', 'lats', 'traps', 'rhomboid', 'rear delt'],
  shoulders: ['shoulder', 'deltoid', 'delt', 'overhead', 'lateral raise'],
  biceps: ['bicep', 'biceps', 'brachialis', 'brachioradialis'],
  triceps: ['tricep', 'triceps'],
  quads: ['quad', 'quads', 'quadriceps', 'vastus'],
  hamstrings: ['hamstring', 'hamstrings', 'posterior thigh'],
  glutes: ['glute', 'glutes', 'gluteal'],
  calves: ['calf', 'calves', 'gastrocnemius', 'soleus'],
  core: ['core', 'ab', 'abs', 'abdominal', 'rectus', 'oblique', 'obliques', 'lower abs', 'deep core'],
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const containsAny = (haystack: string, needles: string[]) => {
  const normalizedHaystack = normalize(haystack);

  return needles.some((needle) => normalizedHaystack.includes(normalize(needle)));
};

const getGroupKeyFromText = (value?: string | null): MuscleGroupKey | null => {
  if (!value) {
    return null;
  }

  const normalized = normalize(value);

  for (const key of MUSCLE_GROUP_KEYS) {
    const label = MUSCLE_GROUP_LABELS[key];
    const synonyms = SYNONYMS[key];

    if (normalized === normalize(label) || normalized.includes(normalize(label)) || containsAny(normalized, synonyms)) {
      return key;
    }
  }

  return null;
};

export const getMuscleGroupLabel = (key: MuscleGroupKey) => MUSCLE_GROUP_LABELS[key];

export const getMuscleGroupStatusLabel = (status: MuscleBalanceStatus) => {
  if (status === 'balanced') {
    return 'Balanced';
  }

  if (status === 'overtrained') {
    return 'Overtrained';
  }

  return 'Undertrained';
};

export const getMuscleHeatLabel = (heatLevel: MuscleHeatLevel) => {
  if (heatLevel === 'high') {
    return 'High volume';
  }

  if (heatLevel === 'medium') {
    return 'Medium volume';
  }

  if (heatLevel === 'low') {
    return 'Low volume';
  }

  return 'No volume';
};

export const formatMuscleTrend = (trendPercent: number | null) => {
  if (trendPercent === null) {
    return 'New';
  }

  const rounded = Math.round(trendPercent);

  if (rounded === 0) {
    return 'Stable';
  }

  return `${rounded > 0 ? '+' : ''}${rounded}%`;
};

export const formatMuscleTrendSentence = (trendPercent: number | null) => {
  if (trendPercent === null) {
    return 'new this week';
  }

  const rounded = Math.round(trendPercent);

  if (rounded === 0) {
    return 'stable vs last week';
  }

  return `${rounded > 0 ? 'increased' : 'decreased'} by ${Math.abs(rounded)}% vs previous week`;
};

const createBucket = (): Bucket => ({ exercises: new Map(), workingSets: 0, volume: 0 });

const createBuckets = () => {
  return MUSCLE_GROUP_KEYS.reduce<Record<MuscleGroupKey, Bucket>>((acc, key) => {
    acc[key] = createBucket();
    return acc;
  }, {} as Record<MuscleGroupKey, Bucket>);
};

const getExerciseGroupKey = (exercise: Exercise | null | undefined): MuscleGroupKey | null => {
  if (!exercise) {
    return null;
  }

  const fromMuscleGroup = getGroupKeyFromText(exercise.muscleGroup ?? null);
  if (fromMuscleGroup) {
    return fromMuscleGroup;
  }

  const primaryMatches = exercise.primaryMuscles ?? [];
  const secondaryMatches = exercise.secondaryMuscles ?? [];
  const categoryMatches = [exercise.category ?? '', exercise.exerciseType ?? '', exercise.tags?.join(' ') ?? ''];

  for (const key of MUSCLE_GROUP_KEYS) {
    const synonyms = SYNONYMS[key];
    if (
      primaryMatches.some((value) => containsAny(value, synonyms)) ||
      secondaryMatches.some((value) => containsAny(value, synonyms)) ||
      categoryMatches.some((value) => containsAny(value, synonyms))
    ) {
      return key;
    }
  }

  return null;
};

const aggregateWeek = (
  workoutSessions: WorkoutSession[],
  exercises: Exercise[],
  startTime: number,
  endTime: number,
) => {
  const buckets = createBuckets();

  workoutSessions.forEach((session) => {
    const timestamp = getWorkoutTimestamp(session);

    if (timestamp < startTime || timestamp >= endTime) {
      return;
    }

    session.sets.forEach((set) => {
      if (set.weight <= 0 || set.reps <= 0) {
        return;
      }

      const exercise = resolveExerciseByName(set.exerciseName, exercises);
      const groupKey = getExerciseGroupKey(exercise);

      if (!groupKey) {
        return;
      }

      const bucket = buckets[groupKey];
      const volume = set.weight * set.reps;
      const current = bucket.exercises.get(set.exerciseName) ?? { workingSets: 0, volume: 0 };

      current.workingSets += 1;
      current.volume += volume;
      bucket.exercises.set(set.exerciseName, current);
      bucket.workingSets += 1;
      bucket.volume += volume;
    });
  });

  return buckets;
};

const buildTopExercises = (bucket: Bucket) => {
  const totalVolume = bucket.volume;

  return [...bucket.exercises.entries()]
    .map(([exerciseName, stats]) => ({
      exerciseName,
      workingSets: stats.workingSets,
      volume: stats.volume,
      percentageContribution: totalVolume > 0 ? (stats.volume / totalVolume) * 100 : 0,
    }))
    .sort((left, right) => right.volume - left.volume || right.workingSets - left.workingSets)
    .slice(0, 3);
};

const classifyBalance = (workingSets: number, volumeShare: number): MuscleBalanceStatus => {
  if (workingSets === 0 || volumeShare < 0.07 || workingSets <= 3) {
    return 'undertrained';
  }

  if (volumeShare > 0.15 || workingSets >= 8) {
    return 'overtrained';
  }

  return 'balanced';
};

const classifyHeat = (workingSets: number, volumeShare: number): MuscleHeatLevel => {
  if (workingSets === 0) {
    return 'none';
  }

  if (volumeShare > 0.15 || workingSets >= 8) {
    return 'high';
  }

  if (volumeShare >= 0.07 || workingSets >= 4) {
    return 'medium';
  }

  return 'low';
};

const getTrendingGroup = (groups: MuscleGroupAnalytics[]) => {
  return [...groups]
    .filter((group) => group.previousVolume > 0 && group.trendPercent !== null)
    .sort((left, right) => Math.abs(right.trendPercent ?? 0) - Math.abs(left.trendPercent ?? 0))
    .at(0) ?? null;
};

export const getMuscleAnalytics = (input: { exercises: Exercise[]; workoutSessions: WorkoutSession[] }): MuscleAnalytics => {
  const endTime = Date.now();
  const currentStart = endTime - 7 * DAY_MS;
  const previousStart = endTime - 14 * DAY_MS;
  const currentBuckets = aggregateWeek(input.workoutSessions, input.exercises, currentStart, endTime);
  const previousBuckets = aggregateWeek(input.workoutSessions, input.exercises, previousStart, currentStart);

  const totalWorkingSets = MUSCLE_GROUP_KEYS.reduce((total, key) => total + currentBuckets[key].workingSets, 0);
  const totalVolume = MUSCLE_GROUP_KEYS.reduce((total, key) => total + currentBuckets[key].volume, 0);
  const previousWorkingSets = MUSCLE_GROUP_KEYS.reduce((total, key) => total + previousBuckets[key].workingSets, 0);
  const previousVolume = MUSCLE_GROUP_KEYS.reduce((total, key) => total + previousBuckets[key].volume, 0);

  const groups = MUSCLE_GROUP_KEYS.map((key) => {
    const currentBucket = currentBuckets[key];
    const previousBucket = previousBuckets[key];
    const volumeShare = totalVolume > 0 ? currentBucket.volume / totalVolume : 0;
    const trendPercent = previousBucket.volume > 0 ? ((currentBucket.volume - previousBucket.volume) / previousBucket.volume) * 100 : currentBucket.volume > 0 ? null : null;
    const topExercises = buildTopExercises(currentBucket);

    return {
      key,
      label: getMuscleGroupLabel(key),
      workingSets: currentBucket.workingSets,
      volume: currentBucket.volume,
      previousWorkingSets: previousBucket.workingSets,
      previousVolume: previousBucket.volume,
      volumeShare,
      trendPercent,
      balanceStatus: classifyBalance(currentBucket.workingSets, volumeShare),
      heatLevel: classifyHeat(currentBucket.workingSets, volumeShare),
      topExercises,
    } satisfies MuscleGroupAnalytics;
  });

  const dominantGroup = groups.reduce<MuscleGroupAnalytics | null>((best, group) => {
    if (!best) {
      return group;
    }

    if (group.volume > best.volume) {
      return group;
    }

    if (group.volume === best.volume && group.workingSets > best.workingSets) {
      return group;
    }

    return best;
  }, null);

  const insights: string[] = [];

  if (dominantGroup && dominantGroup.volume > 0) {
    insights.push(`${dominantGroup.label} is currently your highest-volume muscle group.`);
  }

  const zeroVolumeGroup = groups.find((group) => group.workingSets === 0);
  if (zeroVolumeGroup) {
    insights.push(`${zeroVolumeGroup.label} have not been trained this week.`);
  }

  const biggestIncrease = [...groups]
    .filter((group) => group.trendPercent !== null && group.trendPercent > 0)
    .sort((left, right) => (right.trendPercent ?? 0) - (left.trendPercent ?? 0))[0];

  if (biggestIncrease && biggestIncrease.previousVolume > 0) {
    insights.push(`${biggestIncrease.label} volume increased by ${Math.round(biggestIncrease.trendPercent ?? 0)}% vs previous week.`);
  }

  const biggestDecrease = [...groups]
    .filter((group) => group.trendPercent !== null && group.trendPercent < 0)
    .sort((left, right) => (left.trendPercent ?? 0) - (right.trendPercent ?? 0))[0];

  if (biggestDecrease && biggestDecrease.previousVolume > 0) {
    insights.push(`${biggestDecrease.label} volume decreased by ${Math.abs(Math.round(biggestDecrease.trendPercent ?? 0))}% vs previous week.`);
  }

  if (totalVolume > 0 && previousVolume > 0) {
    const totalTrend = ((totalVolume - previousVolume) / previousVolume) * 100;
    insights.push(`Overall muscle volume ${formatMuscleTrendSentence(totalTrend)}.`);
  }

  return {
    groups,
    totalWorkingSets,
    totalVolume,
    previousWorkingSets,
    previousVolume,
    dominantGroup,
    insights: insights.slice(0, 5),
  };
};

export const getMuscleGroupDetail = (group: MuscleGroupAnalytics | null) => {
  if (!group) {
    return null;
  }

  return {
    ...group,
    trendLabel: formatMuscleTrend(group.trendPercent),
    trendSentence: formatMuscleTrendSentence(group.trendPercent),
    heatLabel: getMuscleHeatLabel(group.heatLevel),
    balanceLabel: getMuscleGroupStatusLabel(group.balanceStatus),
  };
};
