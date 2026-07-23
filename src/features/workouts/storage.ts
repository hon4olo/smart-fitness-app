import AsyncStorage from '@react-native-async-storage/async-storage';

import { cloneWorkoutSafetyMetadata, parseWorkoutSafetyMetadata } from './workoutSafetySessionMetadata';
import type { WorkoutSession } from '@/types';

import { enqueueWorkoutSessionSyncOperation } from './queueWorkoutSessionSyncOperation';
import type { WorkoutSessionDraft, WorkoutSessionStatus } from './types';

const ACTIVE_WORKOUT_SESSION_DRAFT_STORAGE_KEY = 'active-workout-session-draft';
const WORKOUT_RPE_TRACKING_STORAGE_KEY = 'workout-rpe-tracking-enabled';

let activeWorkoutSessionDraft = null as WorkoutSessionDraft | null;
let activeWorkoutSessionDraftWriteQueue = Promise.resolve();
let activeWorkoutSessionDraftRevision = 0;
let activeWorkoutSessionDraftHydrated = false;
let resolveActiveWorkoutSessionDraftHydration: (() => void) | null = null;
const activeWorkoutSessionDraftHydrationPromise = new Promise<void>((resolve) => {
  resolveActiveWorkoutSessionDraftHydration = resolve;
});
let activeWorkoutSessionStatus: WorkoutSessionStatus = 'idle';
let pendingCompletedWorkoutSession = null as WorkoutSession | null;

const cloneSet = (set: WorkoutSession['sets'][number]) => ({ ...set });

const cloneWorkoutSession = (session: WorkoutSession): WorkoutSession => {
  const { safetyRecovery: rawSafetyRecovery, ...base } = session;
  const safetyRecovery = rawSafetyRecovery
    ? cloneWorkoutSafetyMetadata(rawSafetyRecovery)
    : null;
  return {
    ...base,
    sets: session.sets.map(cloneSet),
    ...(safetyRecovery ? { safetyRecovery } : {}),
  };
};

const cloneWorkoutSessionDraft = (draft: WorkoutSessionDraft): WorkoutSessionDraft => {
  const { safetyRecovery: rawSafetyRecovery, ...base } = draft;
  const safetyRecovery = rawSafetyRecovery
    ? cloneWorkoutSafetyMetadata(rawSafetyRecovery)
    : null;
  return {
    ...base,
    sets: draft.sets.map(cloneSet),
    ...(safetyRecovery ? { safetyRecovery } : {}),
  };
};

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

    const safetyRecovery =
      parsed.safetyRecovery === undefined
        ? undefined
        : parseWorkoutSafetyMetadata(parsed.safetyRecovery);
    if (parsed.safetyRecovery !== undefined && !safetyRecovery) {
      return null;
    }

    return {
      id: parsed.id,
      workoutId: parsed.workoutId,
      workoutTitle: parsed.workoutTitle,
      startedAt: parsed.startedAt,
      sets: parsed.sets.filter((set): set is WorkoutSession['sets'][number] => Boolean(set)).map(cloneSet),
      ...(safetyRecovery ? { safetyRecovery } : {}),
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

export const getActiveWorkoutSessionDraft = () =>
  activeWorkoutSessionDraft ? cloneWorkoutSessionDraft(activeWorkoutSessionDraft) : null;

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

export const stageCompletedWorkoutSessionForSync = (session: WorkoutSession) => {
  pendingCompletedWorkoutSession = cloneWorkoutSession(session);
};

export const markActiveWorkoutSessionCompleted = () => {
  activeWorkoutSessionStatus = 'completed';
  const completedSession = pendingCompletedWorkoutSession;
  pendingCompletedWorkoutSession = null;

  if (completedSession) {
    void enqueueWorkoutSessionSyncOperation('create', completedSession);
  }
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
  pendingCompletedWorkoutSession = null;
};

export const loadWorkoutRpeTrackingEnabled = async () => {
  try {
    return (await AsyncStorage.getItem(WORKOUT_RPE_TRACKING_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
};

export const saveWorkoutRpeTrackingEnabled = async (enabled: boolean) => {
  try {
    await AsyncStorage.setItem(WORKOUT_RPE_TRACKING_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Preference persistence is non-critical for the active workout flow.
  }
};
