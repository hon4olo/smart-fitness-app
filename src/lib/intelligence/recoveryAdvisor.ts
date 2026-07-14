import type { Exercise, Workout, WorkoutSession } from '@/types';

import { PROGRAM_MUSCLE_GROUPS, PROGRAM_MUSCLE_GROUP_KEYS, getSessionVolume, getWorkoutTimestamp, resolveExerciseByName } from '@/lib/workouts';

import { clampNumber, uniqueValues } from './ruleEngine';

export type RecoveryStatus = 'Ready' | 'Recovering' | 'Fully Recovered' | 'Recovery Delayed' | 'Overloaded';

export type RecoveryAdvisorInput = {
  exercises: Exercise[];
  now?: number | Date;
  workoutSessions: WorkoutSession[];
  workouts: Workout[];
};

export type RecoveryAdvisorResult = {
  lastWorkoutAt: string | null;
  recommendedNextWorkout: string;
  recommendedWaitTime: string;
  recentWorkoutCount: number;
  recoveryExplanation: string;
  status: RecoveryStatus;
  weeklyVolume: number;
};

type MuscleRecoveryState = {
  lastTrainedAt: number;
  sessions: number;
  volume: number;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getNowMs = (now?: number | Date) => {
  if (typeof now === 'number') {
    return now;
  }

  if (now instanceof Date) {
    return now.getTime();
  }

  return Date.now();
};

const getExerciseMuscleGroups = (exercise: Exercise) => {
  const haystacks = uniqueValues([
    exercise.muscleGroup,
    exercise.category,
    exercise.exerciseType,
    ...(exercise.primaryMuscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
    ...(exercise.tags ?? []),
    ...(exercise.aliases ?? []),
    exercise.name,
  ].filter(Boolean).map((value) => normalize(String(value))));

  return PROGRAM_MUSCLE_GROUP_KEYS.filter((groupKey) => {
    const group = PROGRAM_MUSCLE_GROUPS[groupKey];
    const needles = [group.label, ...group.synonyms].map(normalize);
    return haystacks.some((haystack) => needles.some((needle) => haystack.includes(needle) || needle.includes(haystack)));
  }).map((groupKey) => PROGRAM_MUSCLE_GROUPS[groupKey].label);
};

const buildMuscleRecoveryState = (sessions: WorkoutSession[], exercises: Exercise[]) => {
  const state = new Map<string, MuscleRecoveryState>();

  sessions.forEach((session) => {
    const sessionTimestamp = getWorkoutTimestamp(session);
    const sessionMuscles = uniqueValues(
      session.sets.flatMap((set) => {
        const resolvedExercise = resolveExerciseByName(set.exerciseName, exercises);
        return resolvedExercise ? getExerciseMuscleGroups(resolvedExercise) : [];
      })
    );

    sessionMuscles.forEach((muscle) => {
      const current = state.get(muscle) ?? { lastTrainedAt: 0, sessions: 0, volume: 0 };
      state.set(muscle, {
        lastTrainedAt: Math.max(current.lastTrainedAt, sessionTimestamp),
        sessions: current.sessions + 1,
        volume: current.volume + getSessionVolume(session),
      });
    });
  });

  return state;
};

const formatHours = (hours: number) => {
  if (hours <= 0) {
    return '0h';
  }

  if (hours < 24) {
    return `${Math.max(1, Math.round(hours))}h`;
  }

  return `${Math.max(1, Math.round(hours / 24))} day${hours >= 48 ? 's' : ''}`;
};

const getRecommendedWaitTime = (status: RecoveryStatus, hoursSinceLastWorkout: number) => {
  if (status === 'Overloaded') {
    return '48–72h';
  }

  if (status === 'Recovery Delayed') {
    return '24–48h';
  }

  if (status === 'Recovering') {
    return hoursSinceLastWorkout < 12 ? '12–24h' : '6–12h';
  }

  if (status === 'Fully Recovered') {
    return '0–12h';
  }

  return '0h';
};

const pickNextWorkout = (muscleState: Map<string, MuscleRecoveryState>, hoursSinceLastWorkout: number, workouts: Workout[], nowMs: number) => {
  const candidates = Array.from(muscleState.entries())
    .map(([label, value]) => ({
      hoursSinceLastTrained: value.lastTrainedAt > 0 ? Math.max(0, (nowMs - value.lastTrainedAt) / (1000 * 60 * 60)) : 0,
      label,
      sessions: value.sessions,
      volume: value.volume,
    }))
    .sort((left, right) => right.hoursSinceLastTrained - left.hoursSinceLastTrained || left.sessions - right.sessions || left.volume - right.volume);

  const bestCandidate = candidates[0];
  if (!bestCandidate) {
    return hoursSinceLastWorkout < 24 ? 'Mobility and recovery work' : workouts[0]?.title ?? 'Any planned workout';
  }

  return `Train ${bestCandidate.label.toLowerCase()}`;
};

export const getRecoveryAdvisor = ({ exercises, now, workoutSessions, workouts }: RecoveryAdvisorInput): RecoveryAdvisorResult => {
  const nowMs = getNowMs(now);
  const lastWorkout = [...workoutSessions].sort((left, right) => getWorkoutTimestamp(left) - getWorkoutTimestamp(right)).at(-1) ?? null;
  const lastWorkoutAt = lastWorkout ? new Date(getWorkoutTimestamp(lastWorkout)).toISOString() : null;
  const hoursSinceLastWorkout = lastWorkout ? (nowMs - getWorkoutTimestamp(lastWorkout)) / (1000 * 60 * 60) : Number.POSITIVE_INFINITY;
  const recentWorkoutCount = workoutSessions.filter((session) => nowMs - getWorkoutTimestamp(session) <= 7 * 24 * 60 * 60 * 1000).length;
  const weeklyVolume = workoutSessions
    .filter((session) => nowMs - getWorkoutTimestamp(session) <= 7 * 24 * 60 * 60 * 1000)
    .reduce((total, session) => total + getSessionVolume(session), 0);
  const muscleRecoveryState = buildMuscleRecoveryState(workoutSessions, exercises);
  const muscleStateEntries = Array.from(muscleRecoveryState.entries());
  const slowestMuscle = muscleStateEntries
    .map(([label, value]) => ({
      hoursSinceLastTrained: value.lastTrainedAt > 0 ? (nowMs - value.lastTrainedAt) / (1000 * 60 * 60) : Number.POSITIVE_INFINITY,
      label,
      sessions: value.sessions,
      volume: value.volume,
    }))
    .sort((left, right) => right.hoursSinceLastTrained - left.hoursSinceLastTrained || left.sessions - right.sessions || left.volume - right.volume)[0];

  const status: RecoveryStatus =
    !lastWorkout
      ? 'Ready'
      : hoursSinceLastWorkout < 12 || recentWorkoutCount >= 6 || weeklyVolume >= 12000
        ? 'Overloaded'
        : hoursSinceLastWorkout < 24
          ? 'Recovering'
          : hoursSinceLastWorkout < 48 && weeklyVolume >= 8000
            ? 'Recovery Delayed'
            : hoursSinceLastWorkout >= 48 && weeklyVolume <= 7000 && recentWorkoutCount <= 3
              ? 'Fully Recovered'
              : 'Ready';

  const explanationParts = [
    lastWorkout ? `Last workout was ${formatHours(hoursSinceLastWorkout)} ago.` : 'No workout history yet.',
    recentWorkoutCount > 0 ? `${recentWorkoutCount} workout${recentWorkoutCount === 1 ? '' : 's'} logged in the last 7 days.` : 'No workouts logged in the last 7 days.',
    weeklyVolume > 0 ? `Weekly volume is ${Math.round(weeklyVolume)} kg.` : null,
    slowestMuscle ? `${slowestMuscle.label} has been idle the longest.` : null,
  ].filter(Boolean);

  const recommendedNextWorkout = pickNextWorkout(muscleRecoveryState, hoursSinceLastWorkout, workouts, nowMs);
  const recommendedWaitTime = getRecommendedWaitTime(status, Number.isFinite(hoursSinceLastWorkout) ? hoursSinceLastWorkout : 0);

  return {
    lastWorkoutAt,
    recommendedNextWorkout,
    recommendedWaitTime,
    recentWorkoutCount,
    recoveryExplanation: explanationParts.join(' '),
    status,
    weeklyVolume: clampNumber(Math.round(weeklyVolume), 0, Number.MAX_SAFE_INTEGER),
  };
};
