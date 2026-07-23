import type { MealTemplateSyncMetadata } from '@/storage';
import type { MealTemplate } from '@/types';

import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import {
  areMealTemplateSnapshotsEqual,
  createMealTemplateQueueOperation,
  getMealTemplateEntityId,
  isMealTemplateQueueOperation,
  mealTemplateFromMetadata,
  normalizeMealTemplateForSync,
  toMealTemplateSyncSnapshot,
} from './MealTemplateSync';

export const planMealTemplateSyncOperations = (input: {
  templates: MealTemplate[];
  metadata: Map<string, MealTemplateSyncMetadata>;
  pendingOperations: OfflineSyncQueueOperation[];
  userId: string;
  deviceId: string;
  now?: string;
}): OfflineSyncQueueOperation[] => {
  const pendingEntityIds = new Set(
    input.pendingOperations
      .filter(
        (operation) =>
          isMealTemplateQueueOperation(operation) &&
          operation.metadata?.userId === input.userId,
      )
      .map((operation) => operation.entityId),
  );
  const currentMetadata = [...input.metadata.values()].filter(
    (record) => record.userId === input.userId,
  );
  const metadataById = new Map(currentMetadata.map((record) => [record.id, record]));
  const localById = new Map<string, MealTemplate>();

  for (const template of input.templates) {
    const normalized = normalizeMealTemplateForSync(template, input.now);
    if (!normalized.name || normalized.items.length === 0) continue;
    localById.set(getMealTemplateEntityId(normalized.id), normalized);
  }

  const operations: OfflineSyncQueueOperation[] = [];
  for (const [id, template] of localById) {
    if (pendingEntityIds.has(id)) continue;
    const previous = metadataById.get(id) ?? null;
    const snapshot = toMealTemplateSyncSnapshot(template);
    if (
      previous &&
      !previous.deletedAt &&
      areMealTemplateSnapshotsEqual(snapshot, previous.snapshot)
    ) {
      continue;
    }
    operations.push(
      createMealTemplateQueueOperation({
        action: previous && !previous.deletedAt ? 'update' : 'create',
        template,
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
      createMealTemplateQueueOperation({
        action: 'delete',
        template: mealTemplateFromMetadata(previous),
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
