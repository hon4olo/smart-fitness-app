import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from 'react';
import { AppState as ReactNativeAppState } from 'react-native';

import { useAuthSession } from '@/hooks/useAuthSession';
import type { AppState } from '@/types';
import type { SyncCoordinator } from '@/cloud';
import {
  applyRemoteWeightHistoryChanges,
  filterWeightHistoryQueueOperations,
  isWeightHistoryQueueOperation,
} from '@/cloud/WeightHistorySync';
import {
  applyRemoteWorkoutSessionChanges,
  isWorkoutSessionQueueOperation,
} from '@/cloud/WorkoutSessionSync';
import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import type { WeightSyncMetadataStore } from '@/storage/WeightSyncMetadataStore';
import {
  createAsyncStorageAdapter,
  createWorkoutSessionSyncMetadataStore,
  getDefaultSyncCursorStore,
} from '@/storage';

export type WeightSyncStatus =
  | 'local-only'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'conflict'
  | 'error';

export type WeightSyncContextValue = {
  status: WeightSyncStatus;
  lastSyncAt: string | null;
  pendingOperations: number;
  conflictCount: number;
  error: string | null;
  syncNow(): Promise<void>;
};

type SyncProviderProps = PropsWithChildren<{
  state: AppState;
  replaceState(nextState: AppState): void;
  queueStore: OfflineSyncQueueStore;
  metadataStore: WeightSyncMetadataStore;
  syncCoordinator: SyncCoordinator;
}>;

type RemoteChangedEntity = {
  payload?: Record<string, unknown> | null;
  entityId?: string | null;
  entityType: string;
  revision?: number;
  operationType?: string;
  appliedAt?: string | null;
};

type RemoteDeletedEntity = {
  id?: string;
  entityId?: string;
  entityType: string;
  revision?: number;
  appliedAt?: string | null;
};

const WeightSyncContext = createContext<WeightSyncContextValue | null>(null);

const resolveStatus = (
  phase: string,
  hasConflicts: boolean,
  sessionActive: boolean,
): WeightSyncStatus => {
  if (!sessionActive) {
    return 'local-only';
  }

  if (phase === 'NeedsAuthentication') {
    return 'local-only';
  }

  if (phase === 'Offline') {
    return 'offline';
  }

  if (phase === 'Failed') {
    return 'error';
  }

  if (hasConflicts || phase === 'Conflict') {
    return 'conflict';
  }

  if (
    phase === 'Uploading' ||
    phase === 'Downloading' ||
    phase === 'Preparing' ||
    phase === 'Resolving'
  ) {
    return 'syncing';
  }

  return 'synced';
};

const saveWeightMetadataRecords = async (
  metadataStore: WeightSyncMetadataStore,
  records: Awaited<ReturnType<WeightSyncMetadataStore['load']>>,
) => {
  await metadataStore.clear();
  for (const record of records.values()) {
    await metadataStore.set(record);
  }
};

const resolvePulledRevision = (pullResult: {
  serverRevision?: number;
  revision?: number | { number: number };
}): number | null => {
  if (
    typeof pullResult.serverRevision === 'number' &&
    Number.isFinite(pullResult.serverRevision)
  ) {
    return Math.max(0, Math.floor(pullResult.serverRevision));
  }

  if (typeof pullResult.revision === 'number' && Number.isFinite(pullResult.revision)) {
    return Math.max(0, Math.floor(pullResult.revision));
  }

  if (
    typeof pullResult.revision === 'object' &&
    pullResult.revision !== null &&
    typeof pullResult.revision.number === 'number' &&
    Number.isFinite(pullResult.revision.number)
  ) {
    return Math.max(0, Math.floor(pullResult.revision.number));
  }

  return null;
};

const hasUnsupportedRemoteEntities = (pullResult: {
  operations: Array<{ entity: string }>;
  metadata?: Record<string, unknown>;
}): boolean => {
  const unsupportedEntityCount = pullResult.metadata?.unsupportedEntityCount;
  return (
    (typeof unsupportedEntityCount === 'number' && unsupportedEntityCount > 0) ||
    pullResult.operations.some(
      (operation) =>
        operation.entity !== 'weightHistory' && operation.entity !== 'workoutSessions',
    )
  );
};

const isSupportedQueueOperation = (
  operation: Parameters<typeof isWeightHistoryQueueOperation>[0],
): boolean =>
  isWeightHistoryQueueOperation(operation) || isWorkoutSessionQueueOperation(operation);

export function SyncProvider({
  children,
  metadataStore,
  queueStore,
  replaceState,
  state,
  syncCoordinator,
}: SyncProviderProps) {
  const { ready, session, isAuthenticated } = useAuthSession();
  const [status, setStatus] = useState<WeightSyncStatus>('local-only');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const syncingRef = useRef(false);
  const latestStateRef = useRef(state);
  const cursorStore = useMemo(() => getDefaultSyncCursorStore(), []);
  const syncStorage = useMemo(() => createAsyncStorageAdapter(), []);
  const workoutSessionMetadataStore = useMemo(
    () => createWorkoutSessionSyncMetadataStore(syncStorage),
    [syncStorage],
  );

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  const refreshQueueStats = useCallback(async () => {
    const pending = await queueStore.getPending();
    setPendingOperations(pending.filter(isSupportedQueueOperation).length);
  }, [queueStore]);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    setStatus(isAuthenticated ? 'syncing' : 'local-only');
    setError(null);

    try {
      if (!session || !isAuthenticated) {
        setStatus('local-only');
        await refreshQueueStats();
        return;
      }

      const result = await syncCoordinator.syncNow();
      const pushResult = result.push?.result;
      const pullResult = result.pull?.result;
      const nextConflictCount =
        (pushResult?.conflicts?.length ?? 0) +
        (pullResult?.conflicts?.length ?? 0) +
        result.conflicts.records.length;
      setConflictCount(nextConflictCount);

      if (pushResult?.appliedOperations?.length) {
        const appliedKeys = new Set(
          pushResult.appliedOperations.map((appliedOperation) => appliedOperation.id),
        );
        const queuedOperations = (await queueStore.loadOperations()) as Array<{
          opId: string;
          idempotencyKey: string;
        }>;
        for (const queuedOperation of queuedOperations) {
          if (appliedKeys.has(queuedOperation.idempotencyKey)) {
            await queueStore.acknowledge(queuedOperation.opId);
          }
        }
        await queueStore.removeAcknowledged();
      }

      if (pullResult) {
        const syncedAt = pullResult.serverTimestamp ?? new Date().toISOString();
        const changedEntities = (pullResult.changedEntities ?? []) as RemoteChangedEntity[];
        const nonDeletedChangedEntities = changedEntities.filter(
          (entity) => entity.operationType !== 'delete',
        );
        const deletedEntities = (pullResult.deletedEntities ?? []) as RemoteDeletedEntity[];

        const weightChanges = applyRemoteWeightHistoryChanges(
          latestStateRef.current,
          nonDeletedChangedEntities,
          deletedEntities,
          await metadataStore.load(),
          syncedAt,
        );
        const workoutSessionChanges = applyRemoteWorkoutSessionChanges(
          weightChanges.nextState,
          nonDeletedChangedEntities,
          deletedEntities,
          await workoutSessionMetadataStore.load(),
          syncedAt,
        );

        replaceState(workoutSessionChanges.nextState);
        await saveWeightMetadataRecords(
          metadataStore,
          new Map(weightChanges.metadata.map((record) => [record.id, record])),
        );
        await workoutSessionMetadataStore.clear();
        for (const record of workoutSessionChanges.metadata) {
          await workoutSessionMetadataStore.set(record);
        }

        const handledOperationCount =
          weightChanges.appliedRecordIds.length +
          weightChanges.deletedRecordIds.length +
          workoutSessionChanges.appliedRecordIds.length +
          workoutSessionChanges.deletedRecordIds.length;
        const pulledRevision = resolvePulledRevision(pullResult);
        if (
          pulledRevision !== null &&
          nextConflictCount === 0 &&
          !hasUnsupportedRemoteEntities(pullResult) &&
          handledOperationCount === pullResult.operations.length
        ) {
          await cursorStore.set({
            userId: session.user.id,
            deviceId: session.device.id,
            serverRevision: pulledRevision,
            lastSyncedAt: syncedAt,
          });
        }
      }

      const afterPending = await queueStore.getPending();
      setPendingOperations(afterPending.filter(isSupportedQueueOperation).length);
      setLastSyncAt(
        pushResult?.serverTimestamp ??
          pullResult?.serverTimestamp ??
          new Date().toISOString(),
      );
      setStatus(resolveStatus(result.status.phase, nextConflictCount > 0, true));
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : 'Sync failed';
      setError(message);
      setStatus(message.toLowerCase().includes('auth') ? 'local-only' : 'offline');
    } finally {
      syncingRef.current = false;
    }
  }, [
    cursorStore,
    isAuthenticated,
    metadataStore,
    queueStore,
    refreshQueueStats,
    replaceState,
    session,
    syncCoordinator,
    workoutSessionMetadataStore,
  ]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    queueMicrotask(() => {
      void refreshQueueStats();
    });

    if (session) {
      void syncNow();
    } else {
      setStatus('local-only');
    }
  }, [ready, refreshQueueStats, session, syncNow]);

  useEffect(() => {
    const subscription = ReactNativeAppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && session) {
        void syncNow();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [session, syncNow]);

  const value = useMemo<WeightSyncContextValue>(
    () => ({
      status,
      lastSyncAt,
      pendingOperations,
      conflictCount,
      error,
      syncNow,
    }),
    [conflictCount, error, lastSyncAt, pendingOperations, status, syncNow],
  );

  return (
    <WeightSyncContext.Provider value={value}>{children}</WeightSyncContext.Provider>
  );
}

export const useWeightSync = (): WeightSyncContextValue => {
  const context = useContext(WeightSyncContext);
  if (!context) {
    throw new Error('useWeightSync must be used inside SyncProvider');
  }

  return context;
};
