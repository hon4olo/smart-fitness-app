import type { WorkoutSession } from '@/types';

import { normalizeWorkoutSessionForSync } from '@/cloud/WorkoutSessionSync';
import { stageCompletedWorkoutSessionForSync } from './storage';
import type { WorkoutSessionDraft } from './types';

const cloneSet = (set: WorkoutSession['sets'][number]) => ({ ...set });

export const formatWorkoutSessionElapsedLabel = (startedAt: string, now = Date.now()) => {
  const elapsedMs = Math.max(0, now - new Date(startedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const buildCompletedWorkoutSessionSnapshot = (
  draft: WorkoutSessionDraft,
  options: { finishedAt?: string; notes?: string } = {},
) => {
  const finishedAt = options.finishedAt ?? new Date().toISOString();
  const session = normalizeWorkoutSessionForSync({
    id: draft.id,
    workoutId: draft.workoutId,
    workoutTitle: draft.workoutTitle,
    startedAt: draft.startedAt,
    finishedAt,
    notes: options.notes?.trim() || undefined,
    sets: draft.sets.map(cloneSet),
  });

  stageCompletedWorkoutSessionForSync(session);
  return session;
};

export const upsertWorkoutSessionById = (sessions: WorkoutSession[], session: WorkoutSession) =>
  sessions.some((existingSession) => existingSession.id === session.id)
    ? sessions.map((existingSession) => (existingSession.id === session.id ? session : existingSession))
    : [...sessions, session];
