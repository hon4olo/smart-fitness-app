import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { createDeterministicUuid, isUuid } from '@/lib/ids';
import { defaultState } from '@/data/defaults';
import type { AppState, NutritionTargets } from '@/types';
import type { NutritionTargetSyncMetadata } from '@/storage/NutritionTargetSyncMetadataStore';

let nutritionTargetOutboxSuppressionDepth = 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(new Date(value).getTime());

const toInteger = (value: unknown, minimum: number): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : null;
};

export const isNutritionTargetEntity = (entityType: string): boolean =>
  entityType === 'nutritionTargets' || entityType === 'nutrition_targets';

export const isNutritionTargetQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isNutritionTargetEntity(operation.entityType);

export const getNutritionTargetEntityId = (userId: string): string =>
  createDeterministicUuid(`nutritionTargets:active:${userId.trim().toLowerCase()}`);

export const normalizeNutritionTargetsForSync = (
  targets: NutritionTargets,
): NutritionTargets => ({
  calories: Math.max(1, Math.round(Number(targets.calories) || 0)),
  protein: Math.max(0, Math.round(Number(targets.protein) || 0)),
  carbs: Math.max(0, Math.round(Number(targets.carbs) || 0)),
  fats: Math.max(0, Math.round(Number(targets.fats) || 0)),
});

export const areNutritionTargetsEqual = (
  left: NutritionTargets,
  right: NutritionTargets,
): boolean =>
  JSON.stringify(normalizeNutritionTargetsForSync(left)) ===
  JSON.stringify(normalizeNutritionTargetsForSync(right));

export const createNutritionTargetQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  targets: NutritionTargets;
  userId: string;
  deviceId: string;
  baseRevision: number;
  now?: string;
  previous?: NutritionTargetSyncMetadata | null;
}): OfflineSyncQueueOperation => {
  const now = isTimestamp(input.now) ? new Date(input.now).toISOString() : new Date().toISOString();
  const entityId = getNutritionTargetEntityId(input.userId);
  const targets = normalizeNutritionTargetsForSync(input.targets);
  const baseRevision = {
    id: input.previous ? `rev-${input.previous.revision}` : 'rev-0',
    number: input.baseRevision,
    createdAt: input.previous?.syncedAt ?? now,
  };
  const effectiveFrom = input.previous?.effectiveFrom ?? now;
  const payload = input.action === 'delete'
    ? { id: entityId, deletedAt: now, deviceId: input.deviceId }
    : {
        schemaVersion: 1,
        id: entityId,
        ...targets,
        effectiveFrom,
        createdAt: input.previous?.syncedAt ?? now,
        updatedAt: now,
        deviceId: input.deviceId,
      };
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'nutritionTargets',
    entityId,
    action: input.action,
    clientTimestamp: now,
    actorId: input.userId,
    baseRevision,
    payload,
  });

  return {
    opId: `nutritionTargets:${entityId}`,
    entityType: 'nutritionTargets',
    entityId,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'nutritionTargets',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      lastSyncedAt: input.previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};

export type NutritionTargetSyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: NutritionTargetSyncMetadata[];
};

export const applyRemoteNutritionTargetChanges = (
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
  existingMetadata: Map<string, NutritionTargetSyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): NutritionTargetSyncResult => {
  const expectedId = getNutritionTargetEntityId(userId);
  const metadata = new Map(existingMetadata);
  let targets = state.nutritionTargets;
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (!isNutritionTargetEntity(entity.entityType) || entity.operationType === 'delete') {
      continue;
    }
    const payload = isRecord(entity.payload) ? entity.payload : null;
    const rawId = typeof payload?.id === 'string' ? payload.id : entity.entityId ?? '';
    const calories = toInteger(payload?.calories, 1);
    const protein = toInteger(payload?.protein, 0);
    const carbs = toInteger(payload?.carbs, 0);
    const fats = toInteger(payload?.fats, 0);
    const effectiveFrom = payload?.effectiveFrom;

    if (
      rawId !== expectedId ||
      !isUuid(rawId) ||
      payload?.schemaVersion !== 1 ||
      calories === null ||
      protein === null ||
      carbs === null ||
      fats === null ||
      !isTimestamp(effectiveFrom)
    ) {
      continue;
    }

    targets = { calories, protein, carbs, fats };
    appliedRecordIds.push(expectedId);
    metadata.set(expectedId, {
      id: expectedId,
      revision: typeof entity.revision === 'number' && Number.isFinite(entity.revision)
        ? Math.max(0, Math.floor(entity.revision))
        : 0,
      deviceId: typeof payload.deviceId === 'string' && payload.deviceId.trim()
        ? payload.deviceId.trim()
        : 'unknown',
      effectiveFrom: new Date(effectiveFrom).toISOString(),
      syncedAt,
      deletedAt: null,
    });
  }

  for (const deleted of deletedEntities) {
    if (!isNutritionTargetEntity(deleted.entityType)) {
      continue;
    }
    const id = deleted.entityId ?? deleted.id;
    if (id !== expectedId) {
      continue;
    }

    targets = defaultState.nutritionTargets;
    deletedRecordIds.push(expectedId);
    metadata.set(expectedId, {
      id: expectedId,
      revision: typeof deleted.revision === 'number' && Number.isFinite(deleted.revision)
        ? Math.max(0, Math.floor(deleted.revision))
        : 0,
      deviceId: 'unknown',
      effectiveFrom: syncedAt,
      syncedAt,
      deletedAt: deleted.appliedAt ?? syncedAt,
    });
  }

  return {
    nextState: { ...state, nutritionTargets: targets },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};

export const isNutritionTargetOutboxSuppressed = (): boolean =>
  nutritionTargetOutboxSuppressionDepth > 0;

export const runWithoutNutritionTargetOutbox = <T>(operation: () => T): T => {
  nutritionTargetOutboxSuppressionDepth += 1;
  try {
    return operation();
  } finally {
    nutritionTargetOutboxSuppressionDepth -= 1;
  }
};