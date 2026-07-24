import { isUuid } from '@/lib/ids';
import type {
  AppState,
  Exercise,
  Workout,
  WorkoutCoachMetadata,
  WorkoutPrescriptionSet,
  WorkoutRpe,
} from '@/types';
import type { WorkoutTemplateSyncMetadata } from '@/storage/WorkoutTemplateSyncMetadataStore';

import {
  getWorkoutTemplateEntityId,
  isWorkoutTemplateEntity,
  toWorkoutTemplateSyncSnapshot,
} from './WorkoutTemplateSyncSerialization';

const RPE_VALUES = new Set<number>([6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const metadataKey = (userId: string, id: string): string => `${userId}:${id}`;

const readExercise = (value: unknown): Exercise | null => {
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
    createdAt: new Date(value.createdAt).toISOString(),
  };
};

const readPrescription = (
  value: unknown,
): WorkoutPrescriptionSet[] | null | undefined => {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const result: WorkoutPrescriptionSet[] = [];
  const sourceIds = new Set<string>();
  for (const set of value) {
    if (
      !isRecord(set) ||
      (set.sourceSetId !== undefined &&
        (typeof set.sourceSetId !== 'string' || !isUuid(set.sourceSetId))) ||
      typeof set.exerciseId !== 'string' ||
      !set.exerciseId.trim() ||
      typeof set.exerciseName !== 'string' ||
      !set.exerciseName.trim() ||
      typeof set.weight !== 'number' ||
      !Number.isFinite(set.weight) ||
      set.weight < 0 ||
      typeof set.reps !== 'number' ||
      !Number.isSafeInteger(set.reps) ||
      set.reps < 1 ||
      typeof set.targetRpe !== 'number' ||
      !RPE_VALUES.has(set.targetRpe) ||
      (set.adjustment !== undefined &&
        set.adjustment !== 'decrease' &&
        set.adjustment !== 'maintain' &&
        set.adjustment !== 'increase') ||
      (set.rationaleCode !== undefined &&
        (typeof set.rationaleCode !== 'string' || !set.rationaleCode.trim()))
    ) {
      return undefined;
    }
    const sourceSetId =
      typeof set.sourceSetId === 'string' ? set.sourceSetId : undefined;
    if (sourceSetId && sourceIds.has(sourceSetId)) return undefined;
    if (sourceSetId) sourceIds.add(sourceSetId);
    result.push({
      ...(sourceSetId ? { sourceSetId } : {}),
      exerciseId: set.exerciseId.trim(),
      exerciseName: set.exerciseName.trim(),
      weight: set.weight,
      reps: set.reps,
      targetRpe: set.targetRpe as WorkoutRpe,
      ...(set.adjustment === 'decrease' ||
      set.adjustment === 'maintain' ||
      set.adjustment === 'increase'
        ? { adjustment: set.adjustment }
        : {}),
      ...(typeof set.rationaleCode === 'string'
        ? { rationaleCode: set.rationaleCode.trim() }
        : {}),
    });
  }
  return result;
};

const readCoachMetadata = (
  value: unknown,
): WorkoutCoachMetadata | null | undefined => {
  if (value === undefined || value === null) return null;
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    typeof value.runId !== 'string' ||
    !isUuid(value.runId) ||
    typeof value.sourceSessionId !== 'string' ||
    !isUuid(value.sourceSessionId) ||
    (value.strategy !== 'deload' &&
      value.strategy !== 'maintain' &&
      value.strategy !== 'progress') ||
    !isTimestamp(value.confirmedAt)
  ) {
    return undefined;
  }
  return {
    schemaVersion: 1,
    runId: value.runId,
    sourceSessionId: value.sourceSessionId,
    strategy: value.strategy,
    confirmedAt: new Date(value.confirmedAt).toISOString(),
  };
};

const readRemoteWorkout = (payload: Record<string, unknown>): Workout | null => {
  const prescription = readPrescription(payload.prescription);
  const coachMetadata = readCoachMetadata(payload.coachMetadata);
  if (
    payload.schemaVersion !== 1 ||
    typeof payload.id !== 'string' ||
    !isUuid(payload.id) ||
    typeof payload.title !== 'string' ||
    !payload.title.trim() ||
    typeof payload.duration !== 'string' ||
    !payload.duration.trim() ||
    payload.isCustom !== true ||
    !Array.isArray(payload.exercises) ||
    payload.exercises.length === 0 ||
    !isTimestamp(payload.createdAt) ||
    prescription === undefined ||
    coachMetadata === undefined ||
    Boolean(prescription) !== Boolean(coachMetadata)
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
  const exercises = payload.exercises.map(readExercise);
  if (exercises.some((exercise) => !exercise)) return null;
  const exerciseIds = new Set<string>();
  for (const exercise of exercises as Exercise[]) {
    if (exerciseIds.has(exercise.id)) return null;
    exerciseIds.add(exercise.id);
  }
  if (prescription?.some((set) => !exerciseIds.has(set.exerciseId))) return null;

  return {
    id: payload.id,
    title: payload.title.trim(),
    ...(typeof payload.description === 'string'
      ? { description: payload.description.trim() }
      : {}),
    duration: payload.duration.trim(),
    exercises: exercises as Exercise[],
    ...(prescription && coachMetadata
      ? { prescription, coachMetadata }
      : {}),
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
  userId: string,
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
    metadata.set(metadataKey(userId, workout.id), {
      id: workout.id,
      userId,
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
      snapshot: toWorkoutTemplateSyncSnapshot(workout),
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
    const key = metadataKey(userId, id);
    const previous = metadata.get(key);
    if (previous) {
      metadata.set(key, {
        ...previous,
        revision:
          typeof deleted.revision === 'number' && Number.isFinite(deleted.revision)
            ? Math.max(0, Math.floor(deleted.revision))
            : previous.revision,
        syncedAt,
        deletedAt: deleted.appliedAt ?? syncedAt,
      });
    }
  }

  return {
    nextState: { ...state, workouts },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};