import type { TrainingProgramSyncMetadata } from '@/storage';
import type { TrainingProgram } from '@/types';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import {
  areTrainingProgramSnapshotsEqual,
  createTrainingProgramQueueOperation,
  getTrainingProgramEntityId,
  normalizeTrainingProgramForSync,
  toTrainingProgramSyncSnapshot,
  trainingProgramFromMetadata,
} from './TrainingProgramSync';

export const planTrainingProgramSyncOperations = (input: {
  programs: TrainingProgram[];
  metadata: Map<string, TrainingProgramSyncMetadata>;
  pendingOperations: OfflineSyncQueueOperation[];
  userId: string;
  deviceId: string;
  now?: string;
}): OfflineSyncQueueOperation[] => {
  const pendingEntityIds = new Set(
    input.pendingOperations
      .filter(
        (operation) =>
          operation.entityType === 'trainingPrograms' &&
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
  const localById = new Map<string, TrainingProgram>();

  for (const program of input.programs) {
    if (!program.isCustom) continue;
    const normalized = normalizeTrainingProgramForSync(program, input.now);
    if (!normalized.name || !normalized.goal || normalized.days.length === 0) {
      continue;
    }
    const dayIds = new Set(normalized.days.map((day) => day.id));
    const weekdays = new Set(normalized.days.map((day) => day.weekday));
    if (
      dayIds.size !== normalized.days.length ||
      weekdays.size !== normalized.days.length
    ) {
      continue;
    }
    localById.set(getTrainingProgramEntityId(normalized.id), normalized);
  }

  const operations: OfflineSyncQueueOperation[] = [];
  for (const [id, program] of localById) {
    if (pendingEntityIds.has(id)) continue;
    const previous = metadataById.get(id) ?? null;
    const snapshot = toTrainingProgramSyncSnapshot(program);
    if (
      previous &&
      !previous.deletedAt &&
      areTrainingProgramSnapshotsEqual(snapshot, previous.snapshot)
    ) {
      continue;
    }
    operations.push(
      createTrainingProgramQueueOperation({
        action: previous && !previous.deletedAt ? 'update' : 'create',
        program,
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
      createTrainingProgramQueueOperation({
        action: 'delete',
        program: trainingProgramFromMetadata(previous),
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
