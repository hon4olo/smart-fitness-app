import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState as ReactNativeAppState } from 'react-native';

import type { SyncCoordinator } from '@/cloud';
import { planBodyMeasurementSyncOperations } from '@/cloud/BodyMeasurementSyncPlanner';
import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import { planCustomExerciseSyncOperations } from '@/cloud/CustomExerciseSyncPlanner';
import {
  areFitnessProfileSnapshotsEqual,
  createFitnessProfileQueueOperation,
  getFitnessProfileEntityId,
  isFitnessProfileQueueOperation,
  normalizeFitnessProfileForSync,
} from '@/cloud/FitnessProfileSync';
import {
  createNutritionTargetQueueOperation,
  getNutritionTargetEntityId,
  isNutritionTargetQueueOperation,
} from '@/cloud/NutritionTargetSync';
import { planSafetyRecoverySyncOperations } from '@/cloud/SafetyRecoverySyncPlanner';
import { planTrainingProgramSyncOperations } from '@/cloud/TrainingProgramSyncPlanner';
import { planWorkoutTemplateSyncOperations } from '@/cloud/WorkoutTemplateSyncPlanner';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  createAsyncStorageAdapter,
  createBodyMeasurementSyncMetadataStore,
  createCustomExerciseSyncMetadataStore,
  createFitnessProfileSyncMetadataStore,
  createFoodEntrySyncMetadataStore,
  createNutritionTargetSyncMetadataStore,
  createSafetyRecoverySyncMetadataStore,
  createTrainingProgramSyncMetadataStore,
  createWorkoutSessionSyncMetadataStore,
  createWorkoutTemplateSyncMetadataStore,
  getDefaultSyncCursorStore,
} from '@/storage';
import type { WeightSyncMetadataStore } from '@/storage/WeightSyncMetadataStore';
import type { AppState } from '@/types';

import { applySyncPullResult } from './applySyncPullResult';
import {
  countSupportedQueueOperations,
  resolveStatus,
  type SyncPullResult,
  type WeightSyncContextValue,
  type WeightSyncStatus,
} from './syncContextModel';

export type { WeightSyncContextValue, WeightSyncStatus } from './syncContextModel';

type SyncProviderProps = PropsWithChildren<{
  state: AppState;
  isRestoringState?: boolean;
  replaceState(nextState: AppState): void;
  queueStore: OfflineSyncQueueStore;
  metadataStore: WeightSyncMetadataStore;
  syncCoordinator: SyncCoordinator;
}>;

const WeightSyncContext = createContext<WeightSyncContextValue | null>(null);

export function SyncProvider({
  children,
  isRestoringState = false,
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
  const bodyMeasurementMetadataStore = useMemo(
    () => createBodyMeasurementSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const workoutSessionMetadataStore = useMemo(
    () => createWorkoutSessionSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const workoutTemplateMetadataStore = useMemo(
    () => createWorkoutTemplateSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const trainingProgramMetadataStore = useMemo(
    () => createTrainingProgramSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const customExerciseMetadataStore = useMemo(
    () => createCustomExerciseSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const foodEntryMetadataStore = useMemo(
    () => createFoodEntrySyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const nutritionTargetMetadataStore = useMemo(
    () => createNutritionTargetSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const fitnessProfileMetadataStore = useMemo(
    () => createFitnessProfileSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const safetyRecoveryMetadataStore = useMemo(
    () => createSafetyRecoverySyncMetadataStore(syncStorage),
    [syncStorage],
  );

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  const refreshQueueStats = useCallback(async () => {
    const pending = await queueStore.getPending();
    setPendingOperations(countSupportedQueueOperations(pending));
  }, [queueStore]);

  const ensureNutritionTargetBootstrap = useCallback(async () => {
    if (
      !latestStateRef.current.onboardingCompleted ||
      !session?.user.id ||
      !session.device.id
    ) {
      return;
    }
    const entityId = getNutritionTargetEntityId(session.user.id);
    const metadata = await nutritionTargetMetadataStore.get(entityId);
    const pending = await queueStore.getPending();
    if (
      (metadata && !metadata.deletedAt) ||
      pending.some(isNutritionTargetQueueOperation)
    ) {
      return;
    }

    await queueStore.enqueue(
      createNutritionTargetQueueOperation({
        action: 'create',
        targets: latestStateRef.current.nutritionTargets,
        userId: session.user.id,
        deviceId: session.device.id,
        baseRevision: metadata?.revision ?? 0,
        previous: metadata,
      }),
    );
  }, [nutritionTargetMetadataStore, queueStore, session]);

  const ensureFitnessProfileSync = useCallback(async () => {
    if (
      !latestStateRef.current.onboardingCompleted ||
      !session?.user.id ||
      !session.device.id
    ) {
      return;
    }

    const entityId = getFitnessProfileEntityId(session.user.id);
    const metadata = await fitnessProfileMetadataStore.get(entityId);
    const pending = await queueStore.getPending();
    if (pending.some(isFitnessProfileQueueOperation)) return;

    const snapshot = normalizeFitnessProfileForSync(latestStateRef.current.profile);
    if (
      metadata &&
      !metadata.deletedAt &&
      areFitnessProfileSnapshotsEqual(snapshot, metadata.snapshot)
    ) {
      return;
    }

    await queueStore.enqueue(
      createFitnessProfileQueueOperation({
        action: metadata && !metadata.deletedAt ? 'update' : 'create',
        profile: latestStateRef.current.profile,
        userId: session.user.id,
        deviceId: session.device.id,
        baseRevision: metadata?.revision ?? 0,
        previous: metadata,
      }),
    );
  }, [fitnessProfileMetadataStore, queueStore, session]);

  const ensureBodyMeasurementSync = useCallback(async () => {
    if (!session?.user.id || !session.device.id) return;
    const operations = planBodyMeasurementSyncOperations({
      measurements: latestStateRef.current.bodyMeasurements,
      metadata: await bodyMeasurementMetadataStore.load(),
      pendingOperations: await queueStore.getPending(),
      userId: session.user.id,
      deviceId: session.device.id,
    });
    for (const operation of operations) await queueStore.enqueue(operation);
  }, [bodyMeasurementMetadataStore, queueStore, session]);

  const ensureCustomExerciseSync = useCallback(async () => {
    if (!session?.user.id || !session.device.id) return;
    const operations = planCustomExerciseSyncOperations({
      exercises: latestStateRef.current.exercises,
      metadata: await customExerciseMetadataStore.load(),
      pendingOperations: await queueStore.getPending(),
      userId: session.user.id,
      deviceId: session.device.id,
    });
    for (const operation of operations) await queueStore.enqueue(operation);
  }, [customExerciseMetadataStore, queueStore, session]);

  const ensureWorkoutTemplateSync = useCallback(async () => {
    if (!session?.user.id || !session.device.id) return;

    const operations = planWorkoutTemplateSyncOperations({
      workouts: latestStateRef.current.workouts,
      metadata: await workoutTemplateMetadataStore.load(),
      pendingOperations: await queueStore.getPending(),
      userId: session.user.id,
      deviceId: session.device.id,
    });
    for (const operation of operations) {
      await queueStore.enqueue(operation);
    }
  }, [queueStore, session, workoutTemplateMetadataStore]);

  const ensureTrainingProgramSync = useCallback(async () => {
    if (!session?.user.id || !session.device.id) return;

    const operations = planTrainingProgramSyncOperations({
      programs: latestStateRef.current.trainingPrograms,
      metadata: await trainingProgramMetadataStore.load(),
      pendingOperations: await queueStore.getPending(),
      userId: session.user.id,
      deviceId: session.device.id,
    });
    for (const operation of operations) {
      await queueStore.enqueue(operation);
    }
  }, [queueStore, session, trainingProgramMetadataStore]);

  const ensureSafetyRecoverySync = useCallback(async () => {
    if (!session?.user.id || !session.device.id) return;

    const operations = planSafetyRecoverySyncOperations({
      userLimitations: latestStateRef.current.userLimitations,
      recoveryCheckIns: latestStateRef.current.recoveryCheckIns,
      metadata: await safetyRecoveryMetadataStore.load(),
      pendingOperations: await queueStore.getPending(),
      userId: session.user.id,
      deviceId: session.device.id,
    });
    for (const operation of operations) {
      await queueStore.enqueue(operation);
    }
  }, [queueStore, safetyRecoveryMetadataStore, session]);

  const syncNow = useCallback(async () => {
    if (syncingRef.current || isRestoringState) return;

    syncingRef.current = true;
    setStatus(isAuthenticated ? 'syncing' : 'local-only');
    setError(null);

    try {
      if (!session || !isAuthenticated) {
        setStatus('local-only');
        await refreshQueueStats();
        return;
      }

      await ensureNutritionTargetBootstrap();
      await ensureFitnessProfileSync();
      await ensureBodyMeasurementSync();
      await ensureCustomExerciseSync();
      await ensureWorkoutTemplateSync();
      await ensureTrainingProgramSync();
      await ensureSafetyRecoverySync();
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
        await applySyncPullResult({
          bodyMeasurementMetadataStore,
          cursorStore,
          customExerciseMetadataStore,
          fitnessProfileMetadataStore,
          foodEntryMetadataStore,
          metadataStore,
          nextConflictCount,
          nutritionTargetMetadataStore,
          pullResult: pullResult as SyncPullResult,
          replaceState,
          safetyRecoveryMetadataStore,
          session,
          state: latestStateRef.current,
          trainingProgramMetadataStore,
          workoutSessionMetadataStore,
          workoutTemplateMetadataStore,
        });
      }

      const afterPending = await queueStore.getPending();
      setPendingOperations(countSupportedQueueOperations(afterPending));
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
    bodyMeasurementMetadataStore,
    cursorStore,
    customExerciseMetadataStore,
    ensureBodyMeasurementSync,
    ensureCustomExerciseSync,
    ensureFitnessProfileSync,
    ensureNutritionTargetBootstrap,
    ensureSafetyRecoverySync,
    ensureTrainingProgramSync,
    ensureWorkoutTemplateSync,
    fitnessProfileMetadataStore,
    foodEntryMetadataStore,
    isAuthenticated,
    isRestoringState,
    metadataStore,
    nutritionTargetMetadataStore,
    queueStore,
    refreshQueueStats,
    replaceState,
    safetyRecoveryMetadataStore,
    session,
    syncCoordinator,
    trainingProgramMetadataStore,
    workoutSessionMetadataStore,
    workoutTemplateMetadataStore,
  ]);

  useEffect(() => {
    if (!ready || isRestoringState) return;

    queueMicrotask(() => {
      void refreshQueueStats();
    });

    if (session) {
      void syncNow();
    } else {
      setStatus('local-only');
    }
  }, [isRestoringState, ready, refreshQueueStats, session, syncNow]);

  useEffect(() => {
    const subscription = ReactNativeAppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && session && !isRestoringState) {
        void syncNow();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isRestoringState, session, syncNow]);

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
