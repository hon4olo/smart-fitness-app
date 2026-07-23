import { createOfflineSyncQueueIdempotencyKey } from './CloudQueueHelpers';
import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import { isUuid } from '@/lib/ids';
import {
  normalizeRecoveryCheckIn,
  normalizeUserLimitation,
  upsertRecoveryCheckIn,
  upsertUserLimitation,
} from '@/lib/safetyRecovery';
import type {
  AppState,
  RecoveryCheckIn,
  UserLimitation,
} from '@/types';
import {
  getSafetyRecoverySyncMetadataKey,
  type SafetyRecoverySyncEntityType,
  type SafetyRecoverySyncMetadata,
} from '@/storage/SafetyRecoverySyncMetadataStore';

const SAFETY_RECOVERY_SCHEMA_VERSION = 1 as const;

export type SafetyRecoverySyncResult = {
  nextState: AppState;
  appliedRecordIds: string[];
  deletedRecordIds: string[];
  metadata: SafetyRecoverySyncMetadata[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeTimestamp = (value: unknown, fallback: string): string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : new Date(fallback).toISOString();

export const isUserLimitationEntity = (entityType: string): boolean =>
  entityType === 'userLimitations' ||
  entityType === 'user_limitations' ||
  entityType === 'limitations';

export const isRecoveryCheckInEntity = (entityType: string): boolean =>
  entityType === 'recoveryCheckIns' || entityType === 'recovery_check_ins';

export const isSafetyRecoveryEntity = (entityType: string): boolean =>
  isUserLimitationEntity(entityType) || isRecoveryCheckInEntity(entityType);

export const isSafetyRecoveryQueueOperation = (
  operation: OfflineSyncQueueOperation,
): boolean => isSafetyRecoveryEntity(operation.entityType);

const createBaseRevision = (
  previous: SafetyRecoverySyncMetadata | null | undefined,
  baseRevision: number,
  now: string,
) => ({
  id: previous ? `rev-${previous.revision}` : 'rev-0',
  number: Math.max(0, Math.floor(baseRevision)),
  createdAt: previous?.syncedAt ?? now,
});

const createQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  entityType: SafetyRecoverySyncEntityType;
  entityId: string;
  payload: Record<string, unknown>;
  deviceId: string;
  actorId?: string;
  now: string;
  baseRevision: number;
  previous?: SafetyRecoverySyncMetadata | null;
}): OfflineSyncQueueOperation => {
  const baseRevision = createBaseRevision(
    input.previous,
    input.baseRevision,
    input.now,
  );
  const idempotencyKey = createOfflineSyncQueueIdempotencyKey({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    clientTimestamp: input.now,
    actorId: input.actorId,
    baseRevision,
    payload: input.payload,
  });

  return {
    opId: `${input.entityType}:${input.entityId}`,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    payload: input.payload,
    baseRevision,
    clientTimestamp: input.now,
    actorId: input.actorId,
    idempotencyKey,
    retryCount: 0,
    status: 'pending',
    metadata: {
      entityName: input.entityType,
      deviceId: input.deviceId,
      source: 'local',
      userId: input.actorId,
      lastSyncedAt: input.previous?.syncedAt,
      requestId: idempotencyKey,
    },
  };
};

export const createUserLimitationQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  limitation: UserLimitation;
  deviceId: string;
  actorId?: string;
  baseRevision: number;
  previous?: SafetyRecoverySyncMetadata | null;
  now?: string;
}): OfflineSyncQueueOperation => {
  const now = normalizeTimestamp(input.now, new Date().toISOString());
  const limitation = normalizeUserLimitation(input.limitation, now);
  if (!limitation) {
    throw new Error('Invalid user limitation');
  }
  const payload = input.action === 'delete'
    ? { id: limitation.id, deletedAt: now }
    : {
        schemaVersion: SAFETY_RECOVERY_SCHEMA_VERSION,
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
        createdAt: limitation.createdAt,
        updatedAt: now,
      };

  return createQueueOperation({
    action: input.action,
    entityType: 'userLimitations',
    entityId: limitation.id,
    payload,
    deviceId: input.deviceId,
    actorId: input.actorId,
    now,
    baseRevision: input.baseRevision,
    previous: input.previous,
  });
};

export const createRecoveryCheckInQueueOperation = (input: {
  action: 'create' | 'update' | 'delete';
  checkIn: RecoveryCheckIn;
  deviceId: string;
  actorId?: string;
  baseRevision: number;
  previous?: SafetyRecoverySyncMetadata | null;
  now?: string;
}): OfflineSyncQueueOperation => {
  const now = normalizeTimestamp(input.now, new Date().toISOString());
  const checkIn = normalizeRecoveryCheckIn(input.checkIn, now);
  if (!checkIn) {
    throw new Error('Invalid recovery check-in');
  }
  const payload = input.action === 'delete'
    ? { id: checkIn.id, deletedAt: now }
    : {
        schemaVersion: SAFETY_RECOVERY_SCHEMA_VERSION,
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
        createdAt: checkIn.createdAt,
        updatedAt: now,
      };

  return createQueueOperation({
    action: input.action,
    entityType: 'recoveryCheckIns',
    entityId: checkIn.id,
    payload,
    deviceId: input.deviceId,
    actorId: input.actorId,
    now,
    baseRevision: input.baseRevision,
    previous: input.previous,
  });
};

const parseRemoteUserLimitation = (entity: {
  payload?: Record<string, unknown> | null;
  entityId?: string | null;
}): UserLimitation | null => {
  const payload = isRecord(entity.payload) ? entity.payload : null;
  if (!payload || payload.schemaVersion !== SAFETY_RECOVERY_SCHEMA_VERSION) return null;
  const id = typeof payload.id === 'string' ? payload.id : entity.entityId ?? '';
  if (!isUuid(id) || (entity.entityId && entity.entityId !== id)) return null;
  return normalizeUserLimitation({ ...payload, id: id.toLowerCase() });
};

const parseRemoteRecoveryCheckIn = (entity: {
  payload?: Record<string, unknown> | null;
  entityId?: string | null;
}): RecoveryCheckIn | null => {
  const payload = isRecord(entity.payload) ? entity.payload : null;
  if (!payload || payload.schemaVersion !== SAFETY_RECOVERY_SCHEMA_VERSION) return null;
  const id = typeof payload.id === 'string' ? payload.id : entity.entityId ?? '';
  if (!isUuid(id) || (entity.entityId && entity.entityId !== id)) return null;
  return normalizeRecoveryCheckIn({ ...payload, id: id.toLowerCase() });
};

export const applyRemoteSafetyRecoveryChanges = (
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
  existingMetadata: Map<string, SafetyRecoverySyncMetadata> = new Map(),
  syncedAt = new Date().toISOString(),
): SafetyRecoverySyncResult => {
  let userLimitations = [...state.userLimitations];
  let recoveryCheckIns = [...state.recoveryCheckIns];
  const metadata = new Map(existingMetadata);
  const appliedRecordIds: string[] = [];
  const deletedRecordIds: string[] = [];

  for (const entity of [...changedEntities].sort(
    (left, right) => (left.revision ?? 0) - (right.revision ?? 0),
  )) {
    if (entity.operationType === 'delete') continue;
    const revision =
      typeof entity.revision === 'number' && Number.isFinite(entity.revision)
        ? Math.max(0, Math.floor(entity.revision))
        : 0;
    const deviceId =
      typeof entity.payload?.deviceId === 'string' && entity.payload.deviceId.trim()
        ? entity.payload.deviceId.trim()
        : 'unknown';

    if (isUserLimitationEntity(entity.entityType)) {
      const limitation = parseRemoteUserLimitation(entity);
      if (!limitation) continue;
      userLimitations = upsertUserLimitation(userLimitations, limitation);
      appliedRecordIds.push(limitation.id);
      const record: SafetyRecoverySyncMetadata = {
        id: limitation.id,
        entityType: 'userLimitations',
        revision,
        deviceId,
        syncedAt,
        deletedAt: null,
      };
      metadata.set(
        getSafetyRecoverySyncMetadataKey(record.entityType, record.id),
        record,
      );
    } else if (isRecoveryCheckInEntity(entity.entityType)) {
      const checkIn = parseRemoteRecoveryCheckIn(entity);
      if (!checkIn) continue;
      recoveryCheckIns = upsertRecoveryCheckIn(recoveryCheckIns, checkIn);
      appliedRecordIds.push(checkIn.id);
      const record: SafetyRecoverySyncMetadata = {
        id: checkIn.id,
        entityType: 'recoveryCheckIns',
        revision,
        deviceId,
        syncedAt,
        deletedAt: null,
      };
      metadata.set(
        getSafetyRecoverySyncMetadataKey(record.entityType, record.id),
        record,
      );
    }
  }

  for (const entity of deletedEntities) {
    const id = entity.entityId ?? entity.id ?? '';
    if (!isUuid(id)) continue;
    const revision =
      typeof entity.revision === 'number' && Number.isFinite(entity.revision)
        ? Math.max(0, Math.floor(entity.revision))
        : 0;
    const deletedAt = normalizeTimestamp(entity.appliedAt, syncedAt);

    if (isUserLimitationEntity(entity.entityType)) {
      userLimitations = userLimitations.filter((value) => value.id !== id);
      deletedRecordIds.push(id);
      const record: SafetyRecoverySyncMetadata = {
        id,
        entityType: 'userLimitations',
        revision,
        deviceId: 'unknown',
        syncedAt,
        deletedAt,
      };
      metadata.set(
        getSafetyRecoverySyncMetadataKey(record.entityType, record.id),
        record,
      );
    } else if (isRecoveryCheckInEntity(entity.entityType)) {
      recoveryCheckIns = recoveryCheckIns.filter((value) => value.id !== id);
      deletedRecordIds.push(id);
      const record: SafetyRecoverySyncMetadata = {
        id,
        entityType: 'recoveryCheckIns',
        revision,
        deviceId: 'unknown',
        syncedAt,
        deletedAt,
      };
      metadata.set(
        getSafetyRecoverySyncMetadataKey(record.entityType, record.id),
        record,
      );
    }
  }

  return {
    nextState: {
      ...state,
      userLimitations,
      recoveryCheckIns,
    },
    appliedRecordIds,
    deletedRecordIds,
    metadata: [...metadata.values()],
  };
};
