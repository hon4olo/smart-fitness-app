import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WorkoutSession } from '@/types';

import type { WorkoutSessionDraft, WorkoutSessionStatus } from './types';

const ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY = 'active-workout-session-draft';

let activeWorkoutSessionDraft = null as WorkoutSessionDraft | null;
let activeWorkoutSessionDraftWriteQueue = Promise.resolve();
let activeWorkoutSessionDraftRevision = 0;
let activeWorkoutSessionDraftHydrated = false;
let resolveActiveWorkoutSessionDraftHydration: (() => void) | null = null;
const activeWorkoutSessionDraftHydrationPromise = new Promise<void>((resolve) => {
  resolveActiveWorkoutSessionDraftHydration = resolve;
});
let activeWorkoutSessionStatus: WorkoutSessionStatus = 'idle';

const cloneSet = (set: WorkoutSession['sets'][number]) => ({ ...set });

const cloneWorkoutSessionDraft = (draft: WorkoutSessionDraft): WorkoutSessionDraft => ({
  ...draft,
  sets: draft.sets.map(cloneSet),
});

const parseWorkoutSessionDraft = (value: string | null): WorkoutSessionDraft | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<WorkoutSessionDraft> | null;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.workoutId !== 'string' ||
      typeof parsed.workoutTitle !== 'string' ||
      typeof parsed.startedAt !== 'string' ||
      !Array.isArray(parsed.sets)
    ) {
      return null;
    }

    return {
      id: parsed.id,
      workoutId: parsed.workoutId,
      workoutTitle: parsed.workoutTitle,
      startedAt: parsed.startedAt,
      sets: parsed.sets.filter((set): set is WorkoutSession['sets'][number] => Boolean(set)).map(cloneSet),
    };
  } catch {
    return null;
  }
};

const persistActiveWorkoutSessionDraft = (draft: WorkoutSessionDraft | null, revision = activeWorkoutSessionDraftRevision) => {
  activeWorkoutSessionDraftWriteQueue = activeWorkoutSessionDraftWriteQueue
    .catch(() => undefined)
    .then(async () => {
      await activeWorkoutSessionDraftHydrationPromise;

      if (revision !== activeWorkoutSessionDraftRevision) {
        return;
      }

      if (draft) {
        await AsyncStorage.setItem(ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY, JSON.stringify(cloneWorkoutSessionDraft(draft)));
        return;
      }

      await AsyncStorage.removeItem(ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY);
    })
    .catch(() => undefined);

  return activeWorkoutSessionDraftWriteQueue;
};

export const getActiveWorkoutSessionDraft = () => (activeWorkoutSessionDraft ? { ...activeWorkoutSessionDraft, sets: activeWorkoutSessionDraft.sets.map(cloneSet) } : null);

export const hydrateActiveWorkoutSessionDraft = async () => {
  const storedDraft = parseWorkoutSessionDraft(await AsyncStorage.getItem(ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY));
  activeWorkoutSessionDraftHydrated = true;
  resolveActiveWorkoutSessionDraftHydration?.();
  resolveActiveWorkoutSessionDraftHydration = null;

  if (activeWorkoutSessionDraftRevision === 0) {
    activeWorkoutSessionDraft = storedDraft;
  }

  return getActiveWorkoutSessionDraft();
};

export const getActiveWorkoutSessionStatus = () => activeWorkoutSessionStatus;

export const markActiveWorkoutSessionFinishing = () => {
  if (activeWorkoutSessionDraft) {
    activeWorkoutSessionStatus = 'finishing';
  }
};

export const markActiveWorkoutSessionCompleted = () => {
  activeWorkoutSessionStatus = 'completed';
};

export const setActiveWorkoutSessionDraft = (draft: WorkoutSessionDraft | null) => {
  activeWorkoutSessionDraftRevision += 1;
  activeWorkoutSessionStatus = draft ? 'active' : 'idle';
  activeWorkoutSessionDraft = draft ? cloneWorkoutSessionDraft(draft) : null;
  void persistActiveWorkoutSessionDraft(activeWorkoutSessionDraft, activeWorkoutSessionDraftRevision);
};

export const clearActiveWorkoutSessionDraft = () => {
  activeWorkoutSessionDraftRevision += 1;
  activeWorkoutSessionDraft = null;
  activeWorkoutSessionStatus = 'idle';
  void persistActiveWorkoutSessionDraft(null, activeWorkoutSessionDraftRevision);
};

export const resetWorkoutSessionStorage = () => {
  activeWorkoutSessionDraft = null;
  activeWorkoutSessionDraftRevision = 0;
  activeWorkoutSessionDraftHydrated = false;
  activeWorkoutSessionStatus = 'idle';
  activeWorkoutSessionDraftWriteQueue = Promise.resolve();
};
