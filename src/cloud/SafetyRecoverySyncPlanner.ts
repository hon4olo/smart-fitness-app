import type { OfflineSyncQueueOperation } from './CloudQueueTypes';
import {
  createRecoveryCheckInQueueOperation,
  createUserLimitationQueueOperation,
  isSafetyRecoveryQueueOperation,
} from './SafetyRecoverySync';
import type { SafetyRecoverySyncMetadata } from '@/storage';
import type { RecoveryCheckIn, UserLimitation } from '@/types';

const snapshotsEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

export const planSafetyRecoverySyncOperations = (input: {
  userLimitations: UserLimitation[];
  recoveryCheckIns: RecoveryCheckIn[];
  metadata: Map<string, SafetyRecoverySyncMetadata>;
  pendingOperations: OfflineSyncQueueOperation[];
  userId: string;
  deviceId: string;
  now?: string;
}): OfflineSyncQueueOperation[] => {
  const pendingKeys = new Set(
    input.pendingOperations
      .filter(
        (operation) =>
          isSafetyRecoveryQueueOperation(operation) &&
          operation.metadata?.userId === input.userId,
      )
      .map((operation) => `${operation.entityType}:${operation.entityId}`),
  );
  const userMetadata = [...input.metadata.values()].filter(
    (item) => item.userId === input.userId,
  );
  const limitationMetadata = new Map(
    userMetadata
      .filter((item) => item.entityType === 'userLimitations')
      .map((item) => [item.id, item]),
  );
  const checkInMetadata = new Map(
    userMetadata
      .filter((item) => item.entityType === 'recoveryCheckIns')
      .map((item) => [item.id, item]),
  );
  const localLimitations = new Map(input.userLimitations.map((item) => [item.id, item]));
  const localCheckIns = new Map(input.recoveryCheckIns.map((item) => [item.id, item]));
  const operations: OfflineSyncQueueOperation[] = [];

  for (const limitation of input.userLimitations) {
    const pendingKey = `userLimitations:${limitation.id}`;
    if (pendingKeys.has(pendingKey)) continue;
    const previous = limitationMetadata.get(limitation.id) ?? null;
    if (
      previous &&
      !previous.deletedAt &&
      snapshotsEqual(limitation, previous.snapshot)
    ) {
      continue;
    }
    operations.push(
      createUserLimitationQueueOperation({
        action: previous && !previous.deletedAt ? 'update' : 'create',
        limitation,
        userId: input.userId,
        deviceId: input.deviceId,
        baseRevision: previous?.revision ?? 0,
        previous,
        ...(input.now ? { now: input.now } : {}),
      }),
    );
  }

  for (const checkIn of input.recoveryCheckIns) {
    const pendingKey = `recoveryCheckIns:${checkIn.id}`;
    if (pendingKeys.has(pendingKey)) continue;
    const previous = checkInMetadata.get(checkIn.id) ?? null;
    if (
      previous &&
      !previous.deletedAt &&
      snapshotsEqual(checkIn, previous.snapshot)
    ) {
      continue;
    }
    operations.push(
      createRecoveryCheckInQueueOperation({
        action: previous && !previous.deletedAt ? 'update' : 'create',
        checkIn,
        userId: input.userId,
        deviceId: input.deviceId,
        baseRevision: previous?.revision ?? 0,
        previous,
        ...(input.now ? { now: input.now } : {}),
      }),
    );
  }

  for (const previous of limitationMetadata.values()) {
    if (
      previous.deletedAt ||
      localLimitations.has(previous.id) ||
      pendingKeys.has(`userLimitations:${previous.id}`)
    ) {
      continue;
    }
    operations.push(
      createUserLimitationQueueOperation({
        action: 'delete',
        limitation: previous.snapshot as UserLimitation,
        userId: input.userId,
        deviceId: input.deviceId,
        baseRevision: previous.revision,
        previous,
        ...(input.now ? { now: input.now } : {}),
      }),
    );
  }

  for (const previous of checkInMetadata.values()) {
    if (
      previous.deletedAt ||
      localCheckIns.has(previous.id) ||
      pendingKeys.has(`recoveryCheckIns:${previous.id}`)
    ) {
      continue;
    }
    operations.push(
      createRecoveryCheckInQueueOperation({
        action: 'delete',
        checkIn: previous.snapshot as RecoveryCheckIn,
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
