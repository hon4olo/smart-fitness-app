import type { AppState, WorkoutRpe, WorkoutSession, WorkoutSet } from '@/types';
import { cloneWorkoutSafetyMetadata, parseWorkoutSafetyMetadata } from '@/features/workouts/workoutSafetySessionMetadata';
import { ensureUuid, isUuid } from '@/lib/ids';
import type {
  WorkoutSessionSyncMetadata,
} from '@/storage/WorkoutSessionSyncMetadataStore';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';

export type WorkoutSessionRemoteRecord = {
  id: string;
  workoutId: string;
  workoutTitle: string;
  startedAt: string;
  finishedAt: string;
  sets: WorkoutSet[];
  notes?: string;
  safetyRecovery?: WorkoutSession['safetyRecovery'];
  revision: number;
  deviceId: string | null;
  deletedAt: string | null;
};

export type WorkoutSessionSyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: WorkoutSessionSyncMetadata[];
};

const WORKOUT_RPE_VALUES: readonly WorkoutRpe[] = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isWorkoutRpe = (value: unknown): value is WorkoutRpe =>
  typeof value === 'number' && WORKOUT_RPE_VALUES.includes(value as WorkoutRpe);

const isValidTimestamp = (value: string): boolean =>
  Number.isFinite(new Date(value).getTime());

export const isWorkoutSessionEntity = (entityType: string): boolean =>
  entityType === 'workoutSessions' || entityType === 'workout_sessions';

const normalizeSet = (
  value: unknown,
): WorkoutSet | null => {
  if (!isRecord(value)) {
    return null;
  }

  const exerciseId = typeof value.exerciseId === 'string' ? value.exerciseId.trim() : '';
  const exerciseName = typeof value.exerciseName === 'string' ? value.exerciseName.trim() : '';
  const weight = typeof value.weight === 'number' ? value.weight : Number(value.weight);
  const reps = typeof value.reps === 'number' ? value.reps : Number(value.reps);

  if (
    !isUuid(value.id) ||
    !exerciseId ||
    !exerciseName ||
    !Number.isFinite(weight) ||
    weight < 0 ||
    !Number.isInteger(reps) ||
    reps < 0 ||
    (value.completed !== undefined && typeof value.completed !== 'boolean') ||
    (value.targetRpe !== undefined && !isWorkoutRpe(value.targetRpe)) ||
    (value.actualRpe !== undefined && !isWorkoutRpe(value.actualRpe))
  ) {
    return null;
  }

  const set: WorkoutSet = {
    id: value.id.toLowerCase(),
    exerciseId,
    exerciseName,
    weight,
    reps,
    completed: value.completed !== false,
  };

  if (isWorkoutRpe(value.targetRpe)) {
    set.targetRpe = value.targetRpe;
  }
  if (isWorkoutRpe(value.actualRpe)) {
    set.actualRpe = value.actualRpe;
  }

  return set;
};

export const normalizeWorkoutSessionForSync = (
  session: WorkoutSession,
): WorkoutSession => {
  const id = ensureUuid(session.id);
  const safetyRecovery = session.safetyRecovery
    ? cloneWorkoutSafetyMetadata(session.safetyRecovery)
    : null;

  return {
    ...session,
    id,
    sets: session.sets.map((set, index) => ({
      ...set,
      id: ensureUuid(set.id || `${session.id}:set:${index}`),
      completed: set.completed !== false,
    })),
    ...(safetyRecovery ? { safetyRecovery } : {}),
  };
};

export const createWorkoutSessionQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  session: WorkoutSession;
  deviceId: string;
  baseRevision: number;
  actorId?: string;
  now?: string;
  previous?: WorkoutSessionSyncMetadata | null;
}): OfflineSyncQueueOperation => {
  const now = input.now ?? new Date().toISOString();
  const session = normalizeWorkoutSessionForSync(input.session);
  const baseRevision = {
    id: input.previous ? `rev-${input.previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: input.previous?.syncedAt ?? now,
  };
  const payload =
    input.action === 'delete'
      ? {
          id: session.id,
          startedAt: session.startedAt,
          deletedAt: now,
          deviceId: input.deviceId,
        }
      : {
          schemaVersion: 1,
          id: session.id,
          workoutId: session.workoutId,
          workoutTitle: session.workoutTitle,
          startedAt: session.startedAt,
          finishedAt: session.finishedAt,
          sets: session.sets.map((set) => ({ ...set })),
          ...(session.notes ? { notes: session.notes } : {}),
          ...(session.safetyRecovery
            ? {
                safetyRecovery: cloneWorkoutSafetyMetadata(session.safetyRecovery),
              }
            : {}),
          updatedAt: now,
          deviceId: input.deviceId,
        };
  const clientTimestamp = now;
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'workoutSessions',
    entityId: session.id,
    action: input.action,
    clientTimestamp,
    actorId: input.actorId,
    baseRevision,
    payload,
  });

  return {
    opId: `workoutSessions:${session.id}`,
    entityType: 'workoutSessions',
    entityId: session.id,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp,
    actorId: input.actorId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'workoutSessions',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.actorId,
      lastSyncedAt: input.previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};

export const isWorkoutSessionQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isWorkoutSessionEntity(operation.entityType);

const parseRemoteSession = (
  entity: {
    payload?: Record<string, unknown> | null;
    entityId?: string | null;
    revision?: number;
  },
): WorkoutSession | null => {
  const payload = isRecord(entity.payload) ? entity.payload : null;
  if (!payload || payload.schemaVersion !== 1) {
    return null;
  }

  const rawId = typeof payload.id === 'string' ? payload.id : entity.entityId ?? '';
  const workoutId = typeof payload.workoutId === 'string' ? payload.workoutId.trim() : '';
  const workoutTitle = typeof payload.workoutTitle === 'string' ? payload.workoutTitle.trim() : '';
  const startedAt = typeof payload.startedAt === 'string' ? payload.startedAt : '';
  const finishedAt = typeof payload.finishedAt === 'string' ? payload.finishedAt : '';

  if (
    !isUuid(rawId) ||
    !workoutId ||
    !workoutTitle ||
    !isValidTimestamp(startedAt) ||
    !isValidTimestamp(finishedAt) ||
    new Date(finishedAt).getTime() < new Date(startedAt).getTime() ||
    !Array.isArray(payload.sets)
  ) {
    return null;
  }

  const sets = payload.sets.map(normalizeSet);
  if (sets.some((set) => set === null)) {
    return null;
  }

  const safetyRecovery =
    payload.safetyRecovery === undefined
      ? undefined
      : parseWorkoutSafetyMetadata(payload.safetyRecovery);
  if (payload.safetyRecovery !== undefined && !safetyRecovery) {
    return null;
  }

  return {
    id: rawId.toLowerCase(),
    workoutId,
    workoutTitle,
    startedAt,
    finishedAt,
    sets: sets as WorkoutSet[],
    ...(typeof payload.notes === 'string' && payload.notes.trim()
      ? { notes: payload.notes.trim() }
      : {}),
    ...(safetyRecovery ? { safetyRecovery } : {}),
  };
};

export const applyRemoteWorkoutSessionChanges = (
  state: AppState,
  changedEntities: Array<{
    payload?: Record<string, unknown> | null;
    entityId?: string | null;
    entityType: string;
    revision?: number;
    operationType?: string;
    appliedAt?: string | null;
  }>,
  deletedEntities: Array<{
    id?: string;
    entityId?: string;
    entityType: string;
    revision?: number;
    appliedAt?: string | null;
  }> = [],
  existingMetadata: Map<string, WorkoutSessionSyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): WorkoutSessionSyncResult => {
  const metadata = new Map(existingMetadata);
  let sessions = [...state.workoutSessions];
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  const upsertSession = (session: WorkoutSession) => {
    const index = sessions.findIndex((item) => item.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions = [...sessions, session];
    }
  };

  const removeSession = (id: string) => {
    sessions = sessions.filter((session) => session.id !== id);
  };

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (!isWorkoutSessionEntity(entity.entityType) || entity.operationType === 'delete') {
      continue;
    }

    const session = parseRemoteSession(entity);
    if (!session) {
      continue;
    }

    const payload = entity.payload as Record<string, unknown>;
    upsertSession(session);
    appliedRecordIds.push(session.id);
    metadata.set(session.id, {
      id: session.id,
      revision:
        typeof entity.revision === 'number' && Number.isFinite(entity.revision)
          ? Math.max(0, Math.floor(entity.revision))
          : 0,
      deviceId:
        typeof payload.deviceId === 'string' && payload.deviceId.trim()
          ? payload.deviceId
          : 'unknown',
      startedAt: session.startedAt,
      syncedAt,
      deletedAt: null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isWorkoutSessionEntity(deleted.entityType)) {
      continue;
    }

    const rawId = deleted.entityId ?? deleted.id;
    if (!isUuid(rawId)) {
      continue;
    }

    const id = rawId.toLowerCase();
    removeSession(id);
    deletedRecordIds.push(id);
    metadata.set(id, {
      id,
      revision:
        typeof deleted.revision === 'number' && Number.isFinite(deleted.revision)
          ? Math.max(0, Math.floor(deleted.revision))
          : 0,
      deviceId: 'unknown',
      startedAt: syncedAt,
      syncedAt,
      deletedAt: deleted.appliedAt ?? syncedAt,
    });
  }

  return {
    nextState: { ...state, workoutSessions: sessions },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};
