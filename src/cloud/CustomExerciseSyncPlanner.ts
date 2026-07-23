import type { CustomExerciseSyncMetadata } from '@/storage';
import type { Exercise } from '@/types';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import {
  areCustomExerciseSnapshotsEqual,
  createCustomExerciseQueueOperation,
  customExerciseFromMetadata,
  getCustomExerciseEntityId,
  isCustomExerciseQueueOperation,
  normalizeCustomExerciseForSync,
  toCustomExerciseSyncSnapshot,
} from './CustomExerciseSync';

export const planCustomExerciseSyncOperations = (input: {
  exercises: Exercise[];
  metadata: Map<string, CustomExerciseSyncMetadata>;
  pendingOperations: OfflineSyncQueueOperation[];
  userId: string;
  deviceId: string;
  now?: string;
}): OfflineSyncQueueOperation[] => {
  const pendingEntityIds = new Set(
    input.pendingOperations
      .filter(
        (operation) =>
          isCustomExerciseQueueOperation(operation) &&
          operation.metadata?.userId === input.userId,
      )
      .map((operation) => operation.entityId),
  );
  const currentMetadata = [...input.metadata.values()].filter(
    (record) => record.userId === input.userId,
  );
  const metadataById = new Map(
    currentMetadata.map((record) => [record.id, record]),
  );
  const localById = new Map<string, Exercise>();

  for (const exercise of input.exercises) {
    if (!exercise.isCustom) continue;
    const normalized = normalizeCustomExerciseForSync(exercise, input.now);
    if (!normalized.name) continue;
    localById.set(getCustomExerciseEntityId(normalized.id), normalized);
  }

  const operations: OfflineSyncQueueOperation[] = [];
  for (const [id, exercise] of localById) {
    if (pendingEntityIds.has(id)) continue;
    const previous = metadataById.get(id) ?? null;
    const snapshot = toCustomExerciseSyncSnapshot(exercise);
    if (
      previous &&
      !previous.deletedAt &&
      areCustomExerciseSnapshotsEqual(snapshot, previous.snapshot)
    ) {
      continue;
    }
    operations.push(
      createCustomExerciseQueueOperation({
        action: previous && !previous.deletedAt ? 'update' : 'create',
        exercise,
        userId: input.userId,
        deviceId: input.deviceId,
        baseRevision: previous?.revision ?? 0,
        previous,
        ...(input.now ? { now: input.now } : {}),
      }),
    );
  }

  for (const previous of currentMetadata) {
    if (
      previous.deletedAt ||
      localById.has(previous.id) ||
      pendingEntityIds.has(previous.id)
    ) {
      continue;
    }
    operations.push(
      createCustomExerciseQueueOperation({
        action: 'delete',
        exercise: customExerciseFromMetadata(previous),
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
