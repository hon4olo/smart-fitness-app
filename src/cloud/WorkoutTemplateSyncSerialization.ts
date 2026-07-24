import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { ensureUuid } from '@/lib/ids';
import type {
  Exercise,
  Workout,
  WorkoutCoachMetadata,
  WorkoutPrescriptionSet,
  WorkoutRpe,
} from '@/types';
import type {
  WorkoutTemplateSyncMetadata,
  WorkoutTemplateSyncSnapshot,
} from '@/storage/WorkoutTemplateSyncMetadataStore';

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

const normalizePrescription = (
  prescription: WorkoutPrescriptionSet[] | undefined,
): WorkoutPrescriptionSet[] | undefined => {
  if (!prescription?.length) return undefined;
  return prescription.map((set) => ({
    ...(set.sourceSetId?.trim() ? { sourceSetId: set.sourceSetId.trim() } : {}),
    exerciseId: set.exerciseId.trim(),
    exerciseName: set.exerciseName.trim(),
    weight: set.weight,
    reps: set.reps,
    targetRpe: set.targetRpe,
    ...(set.adjustment ? { adjustment: set.adjustment } : {}),
    ...(set.rationaleCode?.trim()
      ? { rationaleCode: set.rationaleCode.trim() }
      : {}),
  }));
};

const normalizeCoachMetadata = (
  value: WorkoutCoachMetadata | undefined,
): WorkoutCoachMetadata | undefined => {
  if (!value) return undefined;
  return {
    schemaVersion: 1,
    runId: value.runId.trim(),
    sourceSessionId: value.sourceSessionId.trim(),
    strategy: value.strategy,
    confirmedAt: isTimestamp(value.confirmedAt)
      ? new Date(value.confirmedAt).toISOString()
      : value.confirmedAt,
  };
};

export const normalizeWorkoutTemplateForSync = (
  workout: Workout,
  now = new Date().toISOString(),
): Workout => {
  const createdAt = isTimestamp(workout.createdAt)
    ? new Date(workout.createdAt).toISOString()
    : now;
  const prescription = normalizePrescription(workout.prescription);
  const coachMetadata = normalizeCoachMetadata(workout.coachMetadata);
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
    ...(prescription && coachMetadata
      ? { prescription, coachMetadata }
      : {}),
    createdAt,
    isCustom: true,
  };
};

export const toWorkoutTemplateSyncSnapshot = (
  workout: Workout,
): WorkoutTemplateSyncSnapshot => ({
  title: workout.title.trim(),
  description: workout.description?.trim() || null,
  duration: workout.duration.trim() || '30 min',
  exercises: workout.exercises.map((exercise) => ({
    id: exercise.id.trim(),
    name: exercise.name.trim(),
    muscleGroup: exercise.muscleGroup?.trim() || null,
    isCustom: Boolean(exercise.isCustom),
    createdAt: exercise.createdAt,
  })),
  prescription:
    workout.prescription?.map((set) => ({
      sourceSetId: set.sourceSetId?.trim() || null,
      exerciseId: set.exerciseId.trim(),
      exerciseName: set.exerciseName.trim(),
      weight: set.weight,
      reps: set.reps,
      targetRpe: set.targetRpe,
      adjustment: set.adjustment ?? null,
      rationaleCode: set.rationaleCode?.trim() || null,
    })) ?? null,
  coachMetadata: workout.coachMetadata
    ? {
        schemaVersion: 1,
        runId: workout.coachMetadata.runId.trim(),
        sourceSessionId: workout.coachMetadata.sourceSessionId.trim(),
        strategy: workout.coachMetadata.strategy,
        confirmedAt: workout.coachMetadata.confirmedAt,
      }
    : null,
  isCustom: true,
});

export const areWorkoutTemplateSnapshotsEqual = (
  left: WorkoutTemplateSyncSnapshot,
  right: WorkoutTemplateSyncSnapshot,
): boolean => JSON.stringify(left) === JSON.stringify(right);

export const workoutFromTemplateMetadata = (
  metadata: WorkoutTemplateSyncMetadata,
): Workout => ({
  id: metadata.id,
  title: metadata.snapshot.title,
  ...(metadata.snapshot.description
    ? { description: metadata.snapshot.description }
    : {}),
  duration: metadata.snapshot.duration,
  exercises: metadata.snapshot.exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    ...(exercise.muscleGroup
      ? { muscleGroup: exercise.muscleGroup }
      : {}),
    isCustom: exercise.isCustom,
    createdAt: exercise.createdAt,
  })),
  ...(metadata.snapshot.prescription && metadata.snapshot.coachMetadata
    ? {
        prescription: metadata.snapshot.prescription.map((set) => ({
          ...(set.sourceSetId ? { sourceSetId: set.sourceSetId } : {}),
          exerciseId: set.exerciseId,
          exerciseName: set.exerciseName,
          weight: set.weight,
          reps: set.reps,
          targetRpe: set.targetRpe as WorkoutRpe,
          ...(set.adjustment ? { adjustment: set.adjustment } : {}),
          ...(set.rationaleCode ? { rationaleCode: set.rationaleCode } : {}),
        })),
        coachMetadata: metadata.snapshot.coachMetadata,
      }
    : {}),
  createdAt: metadata.createdAt,
  isCustom: true,
});

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
  const snapshot = toWorkoutTemplateSyncSnapshot(workout);
  const previous =
    input.previous?.userId === input.userId ? input.previous : null;
  const baseRevision = {
    id: previous ? `rev-${previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: previous?.syncedAt ?? now,
  };
  const payload =
    input.action === 'delete'
      ? { id: workout.id, deletedAt: now, deviceId: input.deviceId }
      : {
          schemaVersion: 1,
          id: workout.id,
          title: snapshot.title,
          ...(snapshot.description ? { description: snapshot.description } : {}),
          duration: snapshot.duration,
          exercises: snapshot.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            ...(exercise.muscleGroup
              ? { muscleGroup: exercise.muscleGroup }
              : {}),
            isCustom: exercise.isCustom,
            createdAt: exercise.createdAt,
          })),
          ...(snapshot.prescription && snapshot.coachMetadata
            ? {
                prescription: snapshot.prescription.map((set) => ({
                  ...(set.sourceSetId ? { sourceSetId: set.sourceSetId } : {}),
                  exerciseId: set.exerciseId,
                  exerciseName: set.exerciseName,
                  weight: set.weight,
                  reps: set.reps,
                  targetRpe: set.targetRpe,
                  ...(set.adjustment ? { adjustment: set.adjustment } : {}),
                  ...(set.rationaleCode
                    ? { rationaleCode: set.rationaleCode }
                    : {}),
                })),
                coachMetadata: snapshot.coachMetadata,
              }
            : {}),
          isCustom: true,
          createdAt: previous?.createdAt ?? workout.createdAt ?? now,
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
      lastSyncedAt: previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};