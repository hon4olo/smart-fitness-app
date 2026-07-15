import { isApiError } from '@/api/client';
import type { ApiClient } from '@/api/client';
import type { AuthService } from '@/auth';

import type { CloudProvider, CloudPullResult, CloudPushResult } from './CloudProvider';
import type { ConflictRecord, SyncBatch, SyncOperation, SyncState } from './CloudSyncTypes';

export type ProductionCloudProvider = CloudProvider & {
  status(): Promise<SyncState>;
};

export type CreateProductionCloudProviderOptions = {
  apiClient: ApiClient;
  authService: Pick<AuthService, 'getAccessToken' | 'refresh' | 'getCurrentSession'>;
  now?: () => string;
};

type SyncResponseEnvelope = {
  revision?: number;
  serverRevision?: number;
  serverTimestamp?: string;
  pendingConflicts?: number;
  lastSuccessfulSync?: string | null;
  status?: SyncState['status'];
  pendingOperations?: number;
  conflictCount?: number;
};

type SyncPushResponse = SyncResponseEnvelope & {
  appliedOperations?: unknown[];
  conflicts?: unknown[];
  duplicateIdempotencyKeys?: string[];
};

type SyncPullResponse = SyncResponseEnvelope & {
  changedEntities?: unknown[];
  deletedEntities?: unknown[];
  conflicts?: unknown[];
  metadata?: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');

const buildAuthHeader = (token: string): Record<string, string> => ({ authorization: `Bearer ${token}` });

const normalizeSyncState = (envelope: SyncResponseEnvelope | undefined, fallback: SyncState['status']): SyncState => ({
  status: envelope?.status ?? fallback,
  pendingOperations: envelope?.pendingOperations ?? 0,
  conflictCount: envelope?.conflictCount ?? envelope?.pendingConflicts ?? 0,
  lastSyncedAt: envelope?.lastSuccessfulSync ?? envelope?.serverTimestamp,
});

const withRetry = async <T>(operation: () => Promise<T>, attempts = 2): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const statusCode = isApiError(error) && typeof error.status === 'number' ? error.status : undefined;
      if (statusCode === undefined || statusCode < 500 || statusCode >= 600) {
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
  const perform = async (token: string | null): Promise<T> => {
    if (!token) {
      throw new Error('authentication required');
    }

    return apiClient.request<T, unknown>({
      method,
      path,
      body,
      headers: buildAuthHeader(token),
      retry: false,
    });
  };

  const initialToken = await authService.getAccessToken();
  if (!initialToken) {
    throw new Error('authentication required');
  }

  try {
    return await withRetry(() => perform(initialToken));
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      const refreshed = await authService.refresh();
      const nextToken = refreshed?.tokens.accessToken ?? (await authService.getAccessToken());
      if (!nextToken) {
        throw new Error('authentication required');
      }

      return withRetry(() => perform(nextToken));
    }

    throw error;
  }
};

const resolveDeviceId = async (authService: CreateProductionCloudProviderOptions['authService']): Promise<string> => {
  const session = await authService.getCurrentSession();
  if (!session?.device.id) {
    throw new Error('authentication required');
  }

  return session.device.id;
};

const toRemoteOperation = (record: Record<string, unknown>, fallbackEntityId: string, fallbackRevision = 0): SyncOperation | null => {
  const entityId = typeof record.id === 'string' ? record.id : fallbackEntityId;
  if (!entityId) {
    return null;
  }

  return {
    id: `remote:${entityId}:${typeof record.revision === 'number' ? record.revision : fallbackRevision}`,
    entity: 'weightHistory',
    entityId,
    action: record.deletedAt ? 'delete' : 'upsert',
    payload: record,
    revision: {
      id: `rev-${typeof record.revision === 'number' ? record.revision : fallbackRevision}`,
      number: typeof record.revision === 'number' ? record.revision : fallbackRevision,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
      source: 'remote',
    },
    metadata: {
      entityName: 'weightHistory',
      source: 'remote',
      deviceId: typeof record.deviceId === 'string' ? record.deviceId : undefined,
      userId: typeof record.userId === 'string' ? record.userId : undefined,
    },
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
  };
};

const toCloudPushResult = (response: SyncPushResponse): CloudPushResult => ({
  status: response.status ?? (response.conflicts?.length ? 'conflict' : 'idle'),
  pendingOperations: response.pendingOperations ?? 0,
  conflictCount: response.conflictCount ?? response.conflicts?.length ?? 0,
  lastSyncedAt: response.serverTimestamp,
  ...(response.revision !== undefined ? { revision: response.revision } : {}),
  ...(response.serverTimestamp ? { serverTimestamp: response.serverTimestamp } : {}),
  ...(Array.isArray(response.appliedOperations) ? { appliedOperations: response.appliedOperations as SyncOperation[] } : {}),
  ...(Array.isArray(response.conflicts) ? { conflicts: response.conflicts as ConflictRecord[] } : {}),
  ...(isStringArray(response.duplicateIdempotencyKeys) ? { duplicateIdempotencyKeys: response.duplicateIdempotencyKeys } : {}),
});

const toCloudPullResult = (response: SyncPullResponse, now: string): CloudPullResult => {
  const changedRecords = (Array.isArray(response.changedEntities) ? response.changedEntities.filter(isRecord) : []) as Array<Record<string, unknown>>;
  const deletedRecords = (Array.isArray(response.deletedEntities) ? response.deletedEntities.filter(isRecord) : []) as Array<Record<string, unknown>>;
  const changedOperations = changedRecords
    .filter(isRecord)
    .map((record) => toRemoteOperation(record, typeof record.entityId === 'string' ? record.entityId : '', typeof record.revision === 'number' ? record.revision : 0))
    .filter((operation): operation is SyncOperation => Boolean(operation));
  const deletedOperations = deletedRecords
    .filter(isRecord)
    .map((record) => {
      const entityId = typeof record.id === 'string'
        ? record.id
        : typeof record.entityId === 'string'
          ? record.entityId
          : '';
      return toRemoteOperation(
        {
          id: entityId,
          deletedAt: typeof record.appliedAt === 'string' ? record.appliedAt : now,
          revision: typeof record.revision === 'number' ? record.revision : 0,
          createdAt: typeof record.appliedAt === 'string' ? record.appliedAt : now,
        },
        entityId,
        typeof record.revision === 'number' ? record.revision : 0,
      );
    })
    .filter((operation): operation is SyncOperation => Boolean(operation));

  return {
    id: `pull-${response.serverTimestamp ?? now}`,
    operations: [...changedOperations, ...deletedOperations],
    createdAt: response.serverTimestamp ?? now,
    status: response.status ?? 'idle',
    pendingOperations: response.pendingOperations ?? 0,
    conflictCount: response.conflictCount ?? response.conflicts?.length ?? 0,
    lastSyncedAt: response.serverTimestamp,
    ...(response.revision !== undefined ? { revision: response.revision } : {}),
    ...(response.serverTimestamp ? { serverTimestamp: response.serverTimestamp } : {}),
    ...(changedRecords.length ? { changedEntities: changedRecords } : {}),
    ...(deletedRecords.length ? { deletedEntities: deletedRecords } : {}),
    ...(Array.isArray(response.conflicts) ? { conflicts: response.conflicts as ConflictRecord[] } : {}),
    ...(response.metadata ? { metadata: response.metadata } : {}),
  };
};

export const createProductionCloudProvider = ({ apiClient, authService, now = () => new Date().toISOString() }: CreateProductionCloudProviderOptions): ProductionCloudProvider => {
  const status = async (): Promise<SyncState> => {
    try {
      const response = await requestWithAuth<SyncResponseEnvelope>(apiClient, authService, 'GET', '/v1/sync/status');
      return normalizeSyncState(response, 'idle');
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        return { status: 'needsAuthentication', pendingOperations: 0, conflictCount: 0, lastSyncedAt: undefined };
      }

      return { status: 'error', pendingOperations: 0, conflictCount: 0, lastSyncedAt: undefined };
    }
  };

  const pushOperations = async (batch: SyncBatch): Promise<CloudPushResult> => {
    const deviceId = await resolveDeviceId(authService);
    const response = await requestWithAuth<SyncPushResponse>(apiClient, authService, 'POST', '/v1/sync/push', {
      deviceId,
      clientRevision: batch.revision?.number ?? 0,
      operations: batch.operations.map((operation) => ({
        entityType: operation.entity,
        entityId: operation.entityId ?? operation.id,
        operationType: operation.action === 'merge' ? 'upsert' : operation.action,
        baseRevision: operation.revision?.number ?? 0,
        idempotencyKey: operation.id,
        ...(operation.payload === undefined ? {} : { payload: operation.payload }),
      })),
    });

    return toCloudPushResult(response);
  };

  const pullChanges = async (): Promise<CloudPullResult> => {
    const deviceId = await resolveDeviceId(authService);
    const response = await requestWithAuth<SyncPullResponse>(apiClient, authService, 'POST', '/v1/sync/pull', {
      deviceId,
      clientRevision: 0,
    });

    return toCloudPullResult(response, now());
  };

  return {
    status,
    healthCheck: status,
    pushOperations,
    pullChanges,
    getSnapshot: async () => ({ id: `snapshot-${now()}`, revision: { id: 'local', number: 0, createdAt: now() }, state: {}, createdAt: now() }),
    uploadSnapshot: async () => ({ status: 'idle', pendingOperations: 0, conflictCount: 0, lastSyncedAt: now() }),
    resolveConflict: async () => ({ status: 'conflict', pendingOperations: 0, conflictCount: 1, lastSyncedAt: now() }),
  };
};
