import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import {
  areWorkoutTemplateSnapshotsEqual,
  createWorkoutTemplateQueueOperation,
  getWorkoutTemplateEntityId,
  normalizeWorkoutTemplateForSync,
  toWorkoutTemplateSyncSnapshot,
  workoutFromTemplateMetadata,
} from './WorkoutTemplateSync';
import type { WorkoutTemplateSyncMetadata } from '@/storage';
import type { Workout } from '@/types';

export const planWorkoutTemplateSyncOperations = (input: {
  workouts: Workout[];
  metadata: Map<string, WorkoutTemplateSyncMetadata>;
  pendingOperations: OfflineSyncQueueOperation[];
  userId: string;
  deviceId: string;
  now?: string;
}): OfflineSyncQueueOperation[] => {
  const pendingEntityIds = new Set(
    input.pendingOperations
      .filter(
        (operation) =>
          operation.entityType === 'workouts' &&
          operation.metadata?.userId === input.userId,
      )
      .map((operation) => operation.entityId),
  );
  const currentMetadata = [...input.metadata.values()].filter(
    (record) => record.userId === input.userId,
  );
  const metadataById = new Map(currentMetadata.map((record) => [record.id, record]));
  const localById = new Map<string, Workout>();

  for (const workout of input.workouts) {
    if (!workout.isCustom) continue;
    const normalized = normalizeWorkoutTemplateForSync(workout, input.now);
    if (!normalized.title || normalized.exercises.length === 0) continue;
    localById.set(getWorkoutTemplateEntityId(normalized.id), normalized);
  }

  const operations: OfflineSyncQueueOperation[] = [];
  for (const [id, workout] of localById) {
    if (pendingEntityIds.has(id)) continue;
    const previous = metadataById.get(id) ?? null;
    const snapshot = toWorkoutTemplateSyncSnapshot(workout);
    if (
      previous &&
      !previous.deletedAt &&
      areWorkoutTemplateSnapshotsEqual(snapshot, previous.snapshot)
    ) {
      continue;
    }
    operations.push(
      createWorkoutTemplateQueueOperation({
        action: previous && !previous.deletedAt ? 'update' : 'create',
        workout,
        userId: input.userId,
        deviceId: input.deviceId,
        baseRevision: previous?.revision ?? 0,
        previous,
        ...(input.now ? { now: input.now } : {}),
      }),
    );
  }

  for (const previous of currentMetadata) {
    if (previous.deletedAt || localById.has(previous.id) || pendingEntityIds.has(previous.id)) {
      continue;
    }
    operations.push(
      createWorkoutTemplateQueueOperation({
        action: 'delete',
        workout: workoutFromTemplateMetadata(previous),
        userId: input.userId,
        deviceId: input.deviceId,
        baseRevision: previous.revision,
        previous,
        ...(input.now ? { now: input.now } : {}),
      }),
    );
  }

  return operations;
};
