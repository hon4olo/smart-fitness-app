import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { isUuid } from '@/lib/ids';
import {
  normalizeRecoveryCheckIn,
  normalizeUserLimitation,
} from '@/lib/safetyRecoveryState';
import type {
  AppState,
  RecoveryCheckIn,
  UserLimitation,
} from '@/types';
import type {
  SafetyRecoveryEntityType,
  SafetyRecoverySyncMetadata,
} from '@/storage';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const metadataKey = (
  userId: string,
  entityType: SafetyRecoveryEntityType,
  id: string,
): string => `${userId}:${entityType}:${id}`;

export const isUserLimitationEntity = (entityType: string): boolean =>
  entityType === 'userLimitations' ||
  entityType === 'user_limitations' ||
  entityType === 'limitations';

export const isRecoveryCheckInEntity = (entityType: string): boolean =>
  entityType === 'recoveryCheckIns' || entityType === 'recovery_check_ins';

export const isSafetyRecoveryQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean =>
  isUserLimitationEntity(operation.entityType) ||
  isRecoveryCheckInEntity(operation.entityType);

const baseRevisionFor = (
  previous: SafetyRecoverySyncMetadata | null,
  baseRevision: number,
  now: string,
) => ({
  id: previous ? `rev-${previous.revision}` : 'rev-0',
  number: baseRevision,
  createdAt: previous?.syncedAt ?? now,
});

export const createUserLimitationQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  limitation: UserLimitation;
  userId: string;
  deviceId: string;
  baseRevision: number;
  previous?: SafetyRecoverySyncMetadata | null;
  now?: string;
}): OfflineSyncQueueOperation => {
  const limitation = normalizeUserLimitation(input.limitation);
  if (!limitation) throw new Error('Invalid user limitation');
  const now = input.now ?? new Date().toISOString();
  const previous =
    input.previous?.userId === input.userId &&
    input.previous.entityType === 'userLimitations'
      ? input.previous
      : null;
  const baseRevision = baseRevisionFor(previous, input.baseRevision, now);
  const payload =
    input.action === 'delete'
      ? { id: limitation.id, deletedAt: now, deviceId: input.deviceId }
      : {
          schemaVersion: 1,
          id: limitation.id,
          kind: limitation.kind,
          bodyRegion: limitation.bodyRegion,
          side: limitation.side,
          severity: limitation.severity,
          status: limitation.status,
          trainingImpact: limitation.trainingImpact,
          movementPatterns: limitation.movementPatterns,
          onsetDate: limitation.onsetDate,
          resolvedDate: limitation.resolvedDate,
          ...(limitation.notes ? { notes: limitation.notes } : {}),
          createdAt: previous?.createdAt ?? limitation.createdAt,
          updatedAt: limitation.updatedAt,
        };
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'userLimitations',
    entityId: limitation.id,
    action: input.action,
    clientTimestamp: now,
    actorId: input.userId,
    baseRevision,
    payload,
  });
  return {
    opId: `userLimitations:${limitation.id}`,
    entityType: 'userLimitations',
    entityId: limitation.id,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'userLimitations',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      lastSyncedAt: previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};

export const createRecoveryCheckInQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  checkIn: RecoveryCheckIn;
  userId: string;
  deviceId: string;
  baseRevision: number;
  previous?: SafetyRecoverySyncMetadata | null;
  now?: string;
}): OfflineSyncQueueOperation => {
  const checkIn = normalizeRecoveryCheckIn(input.checkIn);
  if (!checkIn) throw new Error('Invalid recovery check-in');
  const now = input.now ?? new Date().toISOString();
  const previous =
    input.previous?.userId === input.userId &&
    input.previous.entityType === 'recoveryCheckIns'
      ? input.previous
      : null;
  const baseRevision = baseRevisionFor(previous, input.baseRevision, now);
  const payload =
    input.action === 'delete'
      ? { id: checkIn.id, deletedAt: now, deviceId: input.deviceId }
      : {
          schemaVersion: 1,
          id: checkIn.id,
          recordedAt: checkIn.recordedAt,
          sleepDurationHours: checkIn.sleepDurationHours,
          sleepQuality: checkIn.sleepQuality,
          fatigue: checkIn.fatigue,
          soreness: checkIn.soreness,
          stress: checkIn.stress,
          painInterference: checkIn.painInterference,
          readiness: checkIn.readiness,
          ...(checkIn.notes ? { notes: checkIn.notes } : {}),
          createdAt: previous?.createdAt ?? checkIn.createdAt,
          updatedAt: checkIn.updatedAt,
        };
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: 'recoveryCheckIns',
    entityId: checkIn.id,
    action: input.action,
    clientTimestamp: now,
    actorId: input.userId,
    baseRevision,
    payload,
  });
  return {
    opId: `recoveryCheckIns:${checkIn.id}`,
    entityType: 'recoveryCheckIns',
    entityId: checkIn.id,
    action: input.action,
    payload,
    baseRevision,
    clientTimestamp: now,
    actorId: input.userId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: 'recoveryCheckIns',
      deviceId: input.deviceId,
      source: 'local',
      userId: input.userId,
      lastSyncedAt: previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};

const isNullableIntegerScale = (
  value: unknown,
  minimum: number,
  maximum: number,
): boolean =>
  value === null ||
  (typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum);

const parseRemoteLimitation = (payload: Record<string, unknown>) => {
  if (payload.schemaVersion !== 1) return null;
  return normalizeUserLimitation(payload);
};

const parseRemoteCheckIn = (payload: Record<string, unknown>) => {
  if (
    payload.schemaVersion !== 1 ||
    (payload.sleepDurationHours !== null &&
      (typeof payload.sleepDurationHours !== 'number' ||
        !Number.isFinite(payload.sleepDurationHours) ||
        payload.sleepDurationHours < 0 ||
        payload.sleepDurationHours > 24)) ||
    !isNullableIntegerScale(payload.sleepQuality, 1, 5) ||
    !isNullableIntegerScale(payload.fatigue, 1, 5) ||
    !isNullableIntegerScale(payload.soreness, 0, 5) ||
    !isNullableIntegerScale(payload.stress, 1, 5) ||
    !isNullableIntegerScale(payload.painInterference, 0, 5) ||
    !isNullableIntegerScale(payload.readiness, 1, 5)
  ) {
    return null;
  }
  return normalizeRecoveryCheckIn(payload);
};

export type SafetyRecoverySyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: SafetyRecoverySyncMetadata[];
};

export const applyRemoteSafetyRecoveryChanges = (
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
  existingMetadata: Map<string, SafetyRecoverySyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): SafetyRecoverySyncResult => {
  let userLimitations = [...state.userLimitations];
  let recoveryCheckIns = [...state.recoveryCheckIns];
  const metadata = new Map(existingMetadata);
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of changedEntities) {
    if (entity.operationType === 'delete' || !isRecord(entity.payload)) continue;
    const entityId = entity.entityId ?? '';
    const revision =
      typeof entity.revision === 'number' && Number.isFinite(entity.revision)
        ? Math.max(0, Math.floor(entity.revision))
        : 0;
    if (isUserLimitationEntity(entity.entityType)) {
      const limitation = parseRemoteLimitation(entity.payload);
      if (!limitation || limitation.id !== entityId) continue;
      userLimitations = [
        limitation,
        ...userLimitations.filter((item) => item.id !== limitation.id),
      ];
      metadata.set(metadataKey(userId, 'userLimitations', limitation.id), {
        entityType: 'userLimitations',
        id: limitation.id,
        userId,
        revision,
        deviceId:
          typeof entity.payload.deviceId === 'string'
            ? entity.payload.deviceId
            : 'unknown',
        createdAt: limitation.createdAt,
        syncedAt,
        snapshot: limitation,
        deletedAt: null,
      });
      appliedRecordIds.push(limitation.id);
    } else if (isRecoveryCheckInEntity(entity.entityType)) {
      const checkIn = parseRemoteCheckIn(entity.payload);
      if (!checkIn || checkIn.id !== entityId) continue;
      recoveryCheckIns = [
        checkIn,
        ...recoveryCheckIns.filter((item) => item.id !== checkIn.id),
      ];
      metadata.set(metadataKey(userId, 'recoveryCheckIns', checkIn.id), {
        entityType: 'recoveryCheckIns',
        id: checkIn.id,
        userId,
        revision,
        deviceId:
          typeof entity.payload.deviceId === 'string'
            ? entity.payload.deviceId
            : 'unknown',
        createdAt: checkIn.createdAt,
        syncedAt,
        snapshot: checkIn,
        deletedAt: null,
      });
      appliedRecordIds.push(checkIn.id);
    }
  }

  for (const entity of deletedEntities) {
    const id = entity.entityId ?? entity.id;
    if (!id || !isUuid(id)) continue;
    const revision =
      typeof entity.revision === 'number' && Number.isFinite(entity.revision)
        ? Math.max(0, Math.floor(entity.revision))
        : 0;
    if (isUserLimitationEntity(entity.entityType)) {
      userLimitations = userLimitations.filter((item) => item.id !== id);
      const key = metadataKey(userId, 'userLimitations', id);
      const previous = metadata.get(key);
      if (previous) {
        metadata.set(key, {
          ...previous,
          revision,
          syncedAt,
          deletedAt: entity.appliedAt ?? syncedAt,
        });
      }
      deletedRecordIds.push(id);
    } else if (isRecoveryCheckInEntity(entity.entityType)) {
      recoveryCheckIns = recoveryCheckIns.filter((item) => item.id !== id);
      const key = metadataKey(userId, 'recoveryCheckIns', id);
      const previous = metadata.get(key);
      if (previous) {
        metadata.set(key, {
          ...previous,
          revision,
          syncedAt,
          deletedAt: entity.appliedAt ?? syncedAt,
        });
      }
      deletedRecordIds.push(id);
    }
  }

  return {
    nextState: {
      ...state,
      userLimitations: userLimitations.sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
      recoveryCheckIns: recoveryCheckIns.sort((a, b) =>
        b.recordedAt.localeCompare(a.recordedAt),
      ),
    },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};
