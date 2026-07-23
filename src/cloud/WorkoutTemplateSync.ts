import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { ensureUuid, isUuid } from '@/lib/ids';
import type { AppState, Exercise, Workout } from '@/types';
import type {
  WorkoutTemplateSyncMetadata,
} from '@/storage/WorkoutTemplateSyncMetadataStore';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

export const isWorkoutTemplateEntity = (entityType: string): boolean =>
  entityType === 'workouts' ||
  entityType === 'workoutTemplates' ||
  entityType === 'workout_templates';

export const isWorkoutTemplateQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isWorkoutTemplateEntity(operation.entityType);

export const getWorkoutTemplateEntityId = (workoutId: string): string =>
  ensureUuid(workoutId);

const normalizeExercise = (exercise: Exercise, fallbackCreatedAt: string): Exercise => ({
  id: exercise.id.trim(),
  name: exercise.name.trim(),
  ...(exercise.muscleGroup?.trim()
    ? { muscleGroup: exercise.muscleGroup.trim() }
    : {}),
  isCustom: Boolean(exercise.isCustom),
  createdAt: isTimestamp(exercise.createdAt)
    ? new Date(exercise.createdAt).toISOString()
    : fallbackCreatedAt,
});

export const normalizeWorkoutTemplateForSync = (
  workout: Workout,
  now = new Date().toISOString(),
): Workout => {
  const createdAt = isTimestamp(workout.createdAt)
    ? new Date(workout.createdAt).toISOString()
    : now;
  return {
    id: getWorkoutTemplateEntityId(workout.id),
    title: workout.title.trim(),
    ...(workout.description?.trim()
      ? { description: workout.description.trim() }
      : {}),
    duration: workout.duration.trim() || '30 min',
    exercises: workout.exercises.map((exercise) =>
      normalizeExercise(exercise, createdAt),
    ),
    createdAt,
    isCustom: true,
  };
};

export const createWorkoutTemplateQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  workout: Workout;
  userId: string;
  deviceId: string;
  baseRevision: number;
  previous?: WorkoutTemplateSyncMetadata | null;
  now?: string;
}): OfflineSyncQueueOperation => {
  const now = isTimestamp(input.now)
    ? new Date(input.now).toISOString()
    : new Date().toISOString();
  const workout = normalizeWorkoutTemplateForSync(input.workout, now);
  const baseRevision = {
    id: input.previous ? `rev-${input.previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: input.previous?.syncedAt ?? now,
  };
  const payload =
    input.action === 'delete'
      ? { id: workout.id, deletedAt: now, deviceId: input.deviceId }
      : {
          schemaVersion: 1,
          id: workout.id,
          title: workout.title,
          ...(workout.description ? { description: workout.description } : {}),
          duration: workout.duration,
          exercises: workout.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            ...(exercise.muscleGroup
              ? { muscleGroup: exercise.muscleGroup }
              : {}),
            isCustom: Boolean(exercise.isCustom),
            createdAt: exercise.createdAt ?? workout.createdAt ?? now,
          })),
          isCustom: true,
          createdAt: input.previous?.createdAt ?? workout.createdAt ?? now,
          updatedAt: now,
          deviceId: input.deviceId,
        };
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'workouts',
    entityId: workout.id,
    action: input.action,
    clientTimestamp: now,
    actorId: input.userId,
    baseRevision,
    payload,
  });

  return {
    opId: `workouts:${workout.id}`,
    entityType: 'workouts',
    entityId: workout.id,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'workouts',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      lastSyncedAt: input.previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};

const readExercise = (
  value: unknown,
  fallbackCreatedAt: string,
): Exercise | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.isCustom !== 'boolean' ||
    !isTimestamp(value.createdAt)
  ) {
    return null;
  }
  if (
    value.muscleGroup !== undefined &&
    (typeof value.muscleGroup !== 'string' || !value.muscleGroup.trim())
  ) {
    return null;
  }
  return {
    id: value.id.trim(),
    name: value.name.trim(),
    ...(typeof value.muscleGroup === 'string'
      ? { muscleGroup: value.muscleGroup.trim() }
      : {}),
    isCustom: value.isCustom,
    createdAt: new Date(value.createdAt ?? fallbackCreatedAt).toISOString(),
  };
};

const readRemoteWorkout = (payload: Record<string, unknown>): Workout | null => {
  if (
    payload.schemaVersion !== 1 ||
    typeof payload.id !== 'string' ||
    !isUuid(payload.id) ||
    typeof payload.title !== 'string' ||
    !payload.title.trim() ||
    typeof payload.duration !== 'string' ||
    !payload.duration.trim() ||
    typeof payload.isCustom !== 'boolean' ||
    !Array.isArray(payload.exercises) ||
    payload.exercises.length === 0 ||
    !isTimestamp(payload.createdAt)
  ) {
    return null;
  }
  if (
    payload.description !== undefined &&
    (typeof payload.description !== 'string' || !payload.description.trim())
  ) {
    return null;
  }
  const createdAt = new Date(payload.createdAt).toISOString();
  const exercises = payload.exercises.map((exercise) =>
    readExercise(exercise, createdAt),
  );
  if (exercises.some((exercise) => !exercise)) return null;
  const exerciseIds = new Set<string>();
  for (const exercise of exercises as Exercise[]) {
    if (exerciseIds.has(exercise.id)) return null;
    exerciseIds.add(exercise.id);
  }

  return {
    id: payload.id,
    title: payload.title.trim(),
    ...(typeof payload.description === 'string'
      ? { description: payload.description.trim() }
      : {}),
    duration: payload.duration.trim(),
    exercises: exercises as Exercise[],
    createdAt,
    isCustom: true,
  };
};

export type WorkoutTemplateSyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: WorkoutTemplateSyncMetadata[];
};

export const applyRemoteWorkoutTemplateChanges = (
  state: AppState,
  changedEntities: Array<{
    payload?: Record<string, unknown> | null;
    entityId?: string | null;
    entityType: string;
    revision?: number;
    operationType?: string;
  }>,
  deletedEntities: Array<{
    id?: string;
    entityId?: string;
    entityType: string;
    revision?: number;
    appliedAt?: string | null;
  }>,
  existingMetadata: Map<string, WorkoutTemplateSyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): WorkoutTemplateSyncResult => {
  const metadata = new Map(existingMetadata);
  let workouts = [...state.workouts];
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (!isWorkoutTemplateEntity(entity.entityType) || entity.operationType === 'delete') {
      continue;
    }
    const payload = isRecord(entity.payload) ? entity.payload : null;
    const workout = payload ? readRemoteWorkout(payload) : null;
    const entityId = entity.entityId ?? workout?.id ?? '';
    if (!workout || workout.id !== entityId) continue;

    workouts = [
      ...workouts.filter((item) => getWorkoutTemplateEntityId(item.id) !== workout.id),
      workout,
    ];
    appliedRecordIds.push(workout.id);
    metadata.set(workout.id, {
      id: workout.id,
      revision:
        typeof entity.revision === 'number' && Number.isFinite(entity.revision)
          ? Math.max(0, Math.floor(entity.revision))
          : 0,
      deviceId:
        typeof payload?.deviceId === 'string' && payload.deviceId.trim()
          ? payload.deviceId.trim()
          : 'unknown',
      createdAt: workout.createdAt ?? syncedAt,
      syncedAt,
      deletedAt: null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isWorkoutTemplateEntity(deleted.entityType)) continue;
    const id = deleted.entityId ?? deleted.id;
    if (!id || !isUuid(id)) continue;
    workouts = workouts.filter(
      (item) => getWorkoutTemplateEntityId(item.id) !== id,
    );
    deletedRecordIds.push(id);
    const previous = metadata.get(id);
    metadata.set(id, {
      id,
      revision:
        typeof deleted.revision === 'number' && Number.isFinite(deleted.revision)
          ? Math.max(0, Math.floor(deleted.revision))
          : 0,
      deviceId: previous?.deviceId ?? 'unknown',
      createdAt: previous?.createdAt ?? syncedAt,
      syncedAt,
      deletedAt: deleted.appliedAt ?? syncedAt,
    });
  }

  return {
    nextState: { ...state, workouts },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};
