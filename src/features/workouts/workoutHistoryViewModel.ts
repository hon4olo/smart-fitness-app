import type {
  TrainingProgram,
  WorkoutSafetyMetadata,
  WorkoutSafetyReviewStatus,
  WorkoutSession,
  WorkoutSet,
} from '@/types';

import { getSessionExercises, getSessionVolume, getWorkoutTimestamp } from './historyModel';

export type WorkoutHistorySafetyTone = 'neutral' | 'positive' | 'warning' | 'critical';
export type WorkoutHistoryPeriodFilter = 'all' | '7d' | '30d' | '90d';
export type WorkoutHistorySafetyFilter =
  | 'all'
  | 'ready'
  | 'modify'
  | 'blocked'
  | 'needs_input'
  | 'missing_or_stale'
  | 'no_context';
export type WorkoutHistoryProgramFilter = 'all' | 'unassigned' | string;

export type WorkoutHistoryDateRange = {
  startAt: number;
  endAt: number;
};

export type WorkoutHistoryFilters = {
  period: WorkoutHistoryPeriodFilter;
  programId: WorkoutHistoryProgramFilter;
  safety: WorkoutHistorySafetyFilter;
  dateRange?: WorkoutHistoryDateRange | null;
};

export type WorkoutHistoryRouteParams = {
  from?: string | string[];
  to?: string | string[];
  safety?: string | string[];
};

export type WorkoutHistoryProgramOption = {
  id: WorkoutHistoryProgramFilter;
  label: string;
};

export type WorkoutHistoryItemView = {
  session: WorkoutSession;
  dateLabel: string;
  durationLabel: string;
  exerciseCount: number;
  setCount: number;
  volume: number;
  volumeLabel: string;
  safetyLabel: string;
  safetyTone: WorkoutHistorySafetyTone;
  hasSafetyContext: boolean;
};

export type WorkoutHistoryExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  completedSetCount: number;
  volume: number;
};

const PERIOD_DAYS: Record<Exclude<WorkoutHistoryPeriodFilter, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const SAFETY_FILTERS = new Set<WorkoutHistorySafetyFilter>([
  'all',
  'ready',
  'modify',
  'blocked',
  'needs_input',
  'missing_or_stale',
  'no_context',
]);

const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const parseRouteTimestamp = (value: string | string[] | undefined): number => {
  const normalized = firstParam(value)?.trim();
  if (!normalized) return Number.NaN;
  if (/^\d+$/.test(normalized)) {
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : Number.NaN;
  }
  return Date.parse(normalized);
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const isValidWorkoutHistoryDateRange = (
  range: WorkoutHistoryDateRange | null | undefined,
): range is WorkoutHistoryDateRange =>
  Boolean(
    range &&
      Number.isFinite(range.startAt) &&
      Number.isFinite(range.endAt) &&
      range.startAt >= 0 &&
      range.endAt > range.startAt,
  );

export const parseWorkoutHistoryRouteFilters = (
  params: WorkoutHistoryRouteParams,
): { dateRange: WorkoutHistoryDateRange | null; safety: WorkoutHistorySafetyFilter } => {
  const dateRange = {
    startAt: parseRouteTimestamp(params.from),
    endAt: parseRouteTimestamp(params.to),
  };
  const safetyParam = firstParam(params.safety)?.trim() as WorkoutHistorySafetyFilter | undefined;

  return {
    dateRange: isValidWorkoutHistoryDateRange(dateRange) ? dateRange : null,
    safety: safetyParam && SAFETY_FILTERS.has(safetyParam) ? safetyParam : 'all',
  };
};

export const formatWorkoutHistoryDateRange = (range: WorkoutHistoryDateRange): string => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const inclusiveEnd = Math.max(range.startAt, range.endAt - 1);
  return `${formatter.format(new Date(range.startAt))}–${formatter.format(new Date(inclusiveEnd))}`;
};

export const getWorkoutDurationMinutes = (session: WorkoutSession): number => {
  const startedAt = Date.parse(session.startedAt);
  const finishedAt = Date.parse(session.finishedAt);
  if (!Number.isFinite(startedAt) || !Number.isFinite(finishedAt) || finishedAt < startedAt) {
    return 0;
  }
  return Math.max(0, Math.round((finishedAt - startedAt) / 60_000));
};

export const formatWorkoutDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
};

export const formatWorkoutVolume = (volume: number): string =>
  `${Math.round(volume).toLocaleString()} kg`;

const safetyCopy = (
  metadata: WorkoutSafetyMetadata | undefined,
): { label: string; tone: WorkoutHistorySafetyTone } => {
  if (!metadata) return { label: 'No recorded review', tone: 'neutral' };
  if (metadata.gateKind === 'review_missing') {
    return { label: 'Continued without review', tone: 'warning' };
  }
  if (metadata.gateKind === 'review_stale') {
    return { label: 'Continued with stale review', tone: 'warning' };
  }
  if (metadata.reviewStatus === 'blocked') {
    return { label: 'Hard block acknowledged', tone: 'critical' };
  }
  if (metadata.reviewStatus === 'modify') {
    return { label: 'Modifications acknowledged', tone: 'warning' };
  }
  if (metadata.reviewStatus === 'needs_input') {
    return { label: 'Incomplete review acknowledged', tone: 'warning' };
  }
  if (metadata.reviewStatus === 'ready') {
    return { label: 'Ready review', tone: 'positive' };
  }
  return { label: 'Safety context recorded', tone: 'neutral' };
};

export const buildWorkoutHistoryItemView = (
  session: WorkoutSession,
): WorkoutHistoryItemView => {
  const volume = getSessionVolume(session);
  const safety = safetyCopy(session.safetyRecovery);
  return {
    session,
    dateLabel: formatDate(session.finishedAt),
    durationLabel: formatWorkoutDuration(getWorkoutDurationMinutes(session)),
    exerciseCount: getSessionExercises(session).length,
    setCount: session.sets.length,
    volume,
    volumeLabel: formatWorkoutVolume(volume),
    safetyLabel: safety.label,
    safetyTone: safety.tone,
    hasSafetyContext: Boolean(session.safetyRecovery),
  };
};

export const buildWorkoutHistory = (
  sessions: WorkoutSession[],
): WorkoutHistoryItemView[] =>
  [...sessions]
    .sort((left, right) => getWorkoutTimestamp(right) - getWorkoutTimestamp(left))
    .map(buildWorkoutHistoryItemView);

const getProgramWorkoutIds = (program: TrainingProgram): Set<string> =>
  new Set(
    program.days
      .map((day) => day.workoutTemplateId)
      .filter((workoutId): workoutId is string => Boolean(workoutId?.trim())),
  );

export const buildWorkoutHistoryProgramOptions = (
  programs: TrainingProgram[],
): WorkoutHistoryProgramOption[] => [
  { id: 'all', label: 'All programs' },
  ...[...programs]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((program) => ({ id: program.id, label: program.name })),
  { id: 'unassigned', label: 'Unassigned' },
];

const matchesPeriod = (
  session: WorkoutSession,
  period: WorkoutHistoryPeriodFilter,
  now: number,
  dateRange?: WorkoutHistoryDateRange | null,
): boolean => {
  const timestamp = getWorkoutTimestamp(session);
  if (timestamp <= 0) return false;
  if (isValidWorkoutHistoryDateRange(dateRange)) {
    return timestamp >= dateRange.startAt && timestamp < dateRange.endAt;
  }
  if (period === 'all') return true;
  const cutoff = now - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;
  return timestamp >= cutoff && timestamp <= now;
};

const matchesProgram = (
  session: WorkoutSession,
  programId: WorkoutHistoryProgramFilter,
  programs: TrainingProgram[],
): boolean => {
  if (programId === 'all') return true;
  const matchingProgramIds = programs
    .filter((program) => getProgramWorkoutIds(program).has(session.workoutId))
    .map((program) => program.id);
  if (programId === 'unassigned') return matchingProgramIds.length === 0;
  return matchingProgramIds.includes(programId);
};

const matchesSafety = (
  session: WorkoutSession,
  safety: WorkoutHistorySafetyFilter,
): boolean => {
  if (safety === 'all') return true;
  const metadata = session.safetyRecovery;
  if (safety === 'no_context') return !metadata;
  if (!metadata) return false;
  if (safety === 'missing_or_stale') {
    return metadata.gateKind === 'review_missing' || metadata.gateKind === 'review_stale';
  }
  return metadata.reviewStatus === safety;
};

export const filterWorkoutHistory = (
  sessions: WorkoutSession[],
  programs: TrainingProgram[],
  filters: WorkoutHistoryFilters,
  now = Date.now(),
): WorkoutHistoryItemView[] =>
  buildWorkoutHistory(sessions).filter(
    (item) =>
      matchesPeriod(item.session, filters.period, now, filters.dateRange) &&
      matchesProgram(item.session, filters.programId, programs) &&
      matchesSafety(item.session, filters.safety),
  );

export const groupWorkoutSessionSets = (
  session: WorkoutSession,
): WorkoutHistoryExerciseGroup[] => {
  const groups = new Map<string, WorkoutHistoryExerciseGroup>();
  session.sets.forEach((set) => {
    const key = `${set.exerciseId}::${set.exerciseName}`;
    const current = groups.get(key) ?? {
      exerciseId: set.exerciseId,
      exerciseName: set.exerciseName,
      sets: [],
      completedSetCount: 0,
      volume: 0,
    };
    current.sets.push({ ...set });
    if (set.completed !== false) current.completedSetCount += 1;
    current.volume += set.weight * set.reps;
    groups.set(key, current);
  });
  return [...groups.values()];
};

export const formatWorkoutSafetyStatus = (
  status: WorkoutSafetyReviewStatus | null,
): string => {
  if (!status) return 'No review status';
  if (status === 'needs_input') return 'Needs input';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const formatWorkoutSafetyGate = (metadata: WorkoutSafetyMetadata): string => {
  if (metadata.gateKind === 'review_missing') return 'Review missing';
  if (metadata.gateKind === 'review_stale') return 'Review stale';
  if (metadata.gateKind === 'confirmation_required') return 'Explicit confirmation required';
  return 'Ready without confirmation';
};
