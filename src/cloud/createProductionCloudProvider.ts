import { isApiError, type ApiClient } from '@/api/client';
import type { AuthService } from '@/auth';
import { getDefaultSyncCursorStore, type SyncCursorStore } from '@/storage';

import type { CloudProvider, CloudPullResult, CloudPushResult } from './CloudProvider';
import type { ConflictRecord, SyncBatch, SyncOperation, SyncState } from './CloudSyncTypes';
import { toRemoteSyncOperation } from './RemoteSyncEntityAdapters';

export type ProductionCloudProvider = CloudProvider & {
  status(): Promise<SyncState>;
};

export type CreateProductionCloudProviderOptions = {
  apiClient: ApiClient;
  authService: Pick<AuthService, 'getAccessToken' | 'refresh' | 'getCurrentSession'>;
  cursorStore?: Pick<SyncCursorStore, 'get'>;
  now?: () => string;
};

type SyncEnvelope = {
  revision?: number;
  serverRevision?: number;
  serverTimestamp?: string;
  pendingConflicts?: number;
  lastSuccessfulSync?: string | null;
  status?: SyncState['status'];
  pendingOperations?: number;
  conflictCount?: number;
};

type SyncPushResponse = SyncEnvelope & {
  appliedOperations?: unknown[];
  conflicts?: unknown[];
  duplicateIdempotencyKeys?: string[];
};

type SyncPullResponse = SyncEnvelope & {
  changedEntities?: unknown[];
  deletedEntities?: unknown[];
  conflicts?: unknown[];
  metadata?: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const withServerRetry = async <T>(operation: () => Promise<T>, attempts = 2): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const retryable =
        isApiError(error) &&
        typeof error.status === 'number' &&
        error.status >= 500 &&
        error.status < 600;

      if (!retryable || attempt === attempts - 1) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed');
};

const requestWithAuth = async <T>(
  apiClient: ApiClient,
  authService: CreateProductionCloudProviderOptions['authService'],
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> => {
  const perform = async (token: string) =>
    apiClient.request<T, unknown>({
      method,
      path,
      body,
      headers: { authorization: `Bearer ${token}` },
      retry: false,
    });

  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('authentication required');
  }

  try {
    return await withServerRetry(() => perform(token));
  } catch (error) {
    if (!isApiError(error) || error.status !== 401) {
      throw error;
    }

    const refreshed = await authService.refresh();
    const nextToken = refreshed?.tokens.accessToken ?? (await authService.getAccessToken());
    if (!nextToken) {
      throw new Error('authentication required');
    }

    return withServerRetry(() => perform(nextToken));
  }
};

const resolveIdentity = async (
  authService: CreateProductionCloudProviderOptions['authService'],
): Promise<{ userId: string; deviceId: string }> => {
  const session = await authService.getCurrentSession();
  if (!session?.user.id || !session.device.id) {
    throw new Error('authentication required');
  }

  return { userId: session.user.id, deviceId: session.device.id };
};

const toSyncState = (response: SyncEnvelope, fallback: SyncState['status']): SyncState => ({
  status: response.status ?? fallback,
  pendingOperations: response.pendingOperations ?? 0,
  conflictCount: response.conflictCount ?? response.pendingConflicts ?? 0,
  lastSyncedAt: response.lastSuccessfulSync ?? response.serverTimestamp,
});

const normalizeOperations = (
  values: unknown[] | undefined,
  fallbackRevision: number,
  fallbackCreatedAt: string,
): SyncOperation[] =>
  (values ?? [])
    .filter(isRecord)
    .map((record) => toRemoteSyncOperation(record, fallbackRevision, fallbackCreatedAt))
    .filter((operation): operation is SyncOperation => Boolean(operation));

const toPushResult = (response: SyncPushResponse, timestamp: string): CloudPushResult => {
  const revision = response.revision ?? 0;
  const appliedOperations = normalizeOperations(
    (response.appliedOperations ?? []).filter(
      (operation) => isRecord(operation) && operation.status === 'applied',
    ),
    revision,
    response.serverTimestamp ?? timestamp,
  );

  return {
    status: response.status ?? (response.conflicts?.length ? 'conflict' : 'idle'),
    pendingOperations: response.pendingOperations ?? 0,
    conflictCount: response.conflictCount ?? response.conflicts?.length ?? 0,
    lastSyncedAt: response.serverTimestamp,
    ...(response.revision === undefined ? {} : { revision: response.revision }),
    ...(response.serverTimestamp ? { serverTimestamp: response.serverTimestamp } : {}),
    ...(appliedOperations.length ? { appliedOperations } : {}),
    ...(Array.isArray(response.conflicts)
      ? { conflicts: response.conflicts as ConflictRecord[] }
      : {}),
    ...(Array.isArray(response.duplicateIdempotencyKeys)
      ? {
          duplicateIdempotencyKeys: response.duplicateIdempotencyKeys.filter(
            (key): key is string => typeof key === 'string',
          ),
        }
      : {}),
  };
};

const toPullResult = (response: SyncPullResponse, timestamp: string): CloudPullResult => {
  const changed = (response.changedEntities ?? []).filter(isRecord);
  const deleted = (response.deletedEntities ?? []).filter(isRecord);
  const serverRevision = response.serverRevision ?? response.revision ?? 0;
  const changedCandidates = changed.filter((record) => record.operationType !== 'delete');
  const changedOperations = normalizeOperations(
    changedCandidates,
    serverRevision,
    timestamp,
  );
  const deletedOperations = normalizeOperations(
    deleted.map((record) => ({ ...record, operationType: 'delete' })),
    serverRevision,
    timestamp,
  );
  const unsupportedEntityCount =
    changedCandidates.length + deleted.length - changedOperations.length - deletedOperations.length;

  return {
    id: `pull-${response.serverTimestamp ?? timestamp}`,
    operations: [...changedOperations, ...deletedOperations],
    createdAt: response.serverTimestamp ?? timestamp,
    status: response.status ?? 'idle',
    pendingOperations: response.pendingOperations ?? 0,
    conflictCount: response.conflictCount ?? response.conflicts?.length ?? 0,
    lastSyncedAt: response.serverTimestamp,
    revision: serverRevision,
    serverRevision,
    ...(response.serverTimestamp ? { serverTimestamp: response.serverTimestamp } : {}),
    ...(changed.length ? { changedEntities: changed } : {}),
    ...(deleted.length ? { deletedEntities: deleted } : {}),
    ...(Array.isArray(response.conflicts)
      ? { conflicts: response.conflicts as ConflictRecord[] }
      : {}),
    metadata: {
      ...(response.metadata ?? {}),
      unsupportedEntityCount,
    },
  };
};

const canPushOperationForUser = (operation: SyncOperation, userId: string): boolean =>
  !operation.metadata?.userId || operation.metadata.userId === userId;

export const createProductionCloudProvider = ({
  apiClient,
  authService,
  cursorStore = getDefaultSyncCursorStore(),
  now = () => new Date().toISOString(),
}: CreateProductionCloudProviderOptions): ProductionCloudProvider => {
  const getClientRevision = async (userId: string): Promise<number> =>
    (await cursorStore.get(userId))?.serverRevision ?? 0;

  const status = async (): Promise<SyncState> => {
    try {
      const response = await requestWithAuth<SyncEnvelope>(
        apiClient,
        authService,
        'GET',
        '/v1/sync/status',
      );
      return toSyncState(response, 'idle');
    } catch (error) {
      const needsAuthentication =
        (isApiError(error) && error.status === 401) ||
        (error instanceof Error && error.message === 'authentication required');

      return {
        status: needsAuthentication ? 'needsAuthentication' : 'error',
        pendingOperations: 0,
        conflictCount: 0,
      };
    }
  };

  return {
    status,
    healthCheck: status,
    async pushOperations(batch: SyncBatch) {
      const identity = await resolveIdentity(authService);
      const operations = batch.operations.filter((operation) =>
        canPushOperationForUser(operation, identity.userId),
      );

      if (operations.length === 0) {
        return {
          status: 'idle',
          pendingOperations: batch.operations.length,
          conflictCount: 0,
          lastSyncedAt: now(),
        };
      }

      const response = await requestWithAuth<SyncPushResponse>(
        apiClient,
        authService,
        'POST',
        '/v1/sync/push',
        {
          deviceId: identity.deviceId,
          clientRevision: await getClientRevision(identity.userId),
          operations: operations.map((operation) => ({
            entityType: operation.entity,
            entityId: operation.entityId ?? operation.id,
            operationType: operation.action === 'merge' ? 'upsert' : operation.action,
            baseRevision: operation.revision?.number ?? 0,
            idempotencyKey: operation.metadata?.requestId ?? operation.id,
            ...(operation.payload === undefined ? {} : { payload: operation.payload }),
          })),
        },
      );
      return toPushResult(response, now());
    },
    async pullChanges() {
      const identity = await resolveIdentity(authService);
      const response = await requestWithAuth<SyncPullResponse>(
        apiClient,
        authService,
        'POST',
        '/v1/sync/pull',
        {
          deviceId: identity.deviceId,
          clientRevision: await getClientRevision(identity.userId),
        },
      );
      return toPullResult(response, now());
    },
    async getSnapshot() {
      const timestamp = now();
      return {
        id: `snapshot-${timestamp}`,
        revision: { id: 'local', number: 0, createdAt: timestamp },
        state: {},
        createdAt: timestamp,
      };
    },
    async uploadSnapshot() {
      return { status: 'idle', pendingOperations: 0, conflictCount: 0, lastSyncedAt: now() };
    },
    async resolveConflict() {
      return { status: 'conflict', pendingOperations: 0, conflictCount: 1, lastSyncedAt: now() };
    },
  };
};
