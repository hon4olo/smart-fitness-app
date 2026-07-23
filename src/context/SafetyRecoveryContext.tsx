import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import {
  createRecoveryCheckInQueueOperation,
  createUserLimitationQueueOperation,
} from '@/cloud/SafetyRecoverySync';
import { useAppContext } from '@/context/AppContext';
import { useWeightSync } from '@/context/SyncContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  normalizeRecoveryCheckIn,
  normalizeUserLimitation,
  upsertRecoveryCheckIn,
  upsertUserLimitation,
} from '@/lib/safetyRecovery';
import {
  createAsyncStorageAdapter,
  createAsyncStorageOperationQueueStore,
  createSafetyRecoverySyncMetadataStore,
} from '@/storage';
import type {
  AppContextType,
  AppState,
  RecoveryCheckIn,
  UserLimitation,
} from '@/types';

type SafetyRecoveryContextValue = {
  saveUserLimitation(limitation: UserLimitation): Promise<UserLimitation>;
  deleteUserLimitation(limitationId: string): Promise<void>;
  saveRecoveryCheckIn(checkIn: RecoveryCheckIn): Promise<RecoveryCheckIn>;
  deleteRecoveryCheckIn(checkInId: string): Promise<void>;
};

const SafetyRecoveryContext = createContext<SafetyRecoveryContextValue | null>(null);

const toAppState = (
  app: AppContextType,
  patch: Partial<Pick<AppState, 'userLimitations' | 'recoveryCheckIns'>>,
): AppState => ({
  workouts: app.workouts,
  trainingPrograms: app.trainingPrograms,
  exercises: app.exercises,
  workoutSessions: app.workoutSessions,
  foodEntries: app.foodEntries,
  mealTemplates: app.mealTemplates,
  nutrition: app.nutrition,
  nutritionTargets: app.nutritionTargets,
  weightHistory: app.weightHistory,
  bodyMeasurements: app.bodyMeasurements,
  userLimitations: patch.userLimitations ?? app.userLimitations,
  recoveryCheckIns: patch.recoveryCheckIns ?? app.recoveryCheckIns,
  profile: app.profile,
  onboardingCompleted: app.onboardingCompleted,
});

export function SafetyRecoveryProvider({ children }: PropsWithChildren) {
  const app = useAppContext();
  const { session } = useAuthSession();
  const { syncNow } = useWeightSync();
  const latestAppRef = useRef(app);
  const storage = useMemo(() => createAsyncStorageAdapter(), []);
  const queueStore = useMemo(
    () => createAsyncStorageOperationQueueStore(storage),
    [storage],
  );
  const metadataStore = useMemo(
    () => createSafetyRecoverySyncMetadataStore(storage),
    [storage],
  );

  useEffect(() => {
    latestAppRef.current = app;
  }, [app]);

  const requireSession = useCallback(() => {
    if (!session?.user.id || !session.device.id) {
      throw new Error('Sign in is required to save Safety & Recovery records.');
    }
    return session;
  }, [session]);

  const saveUserLimitation = useCallback(
    async (input: UserLimitation): Promise<UserLimitation> => {
      const activeSession = requireSession();
      const currentApp = latestAppRef.current;
      const existing = currentApp.userLimitations.find((item) => item.id === input.id);
      const now = new Date().toISOString();
      const limitation = normalizeUserLimitation(
        {
          ...input,
          createdAt: existing?.createdAt ?? input.createdAt ?? now,
          updatedAt: now,
        },
        now,
      );
      if (!limitation) throw new Error('The limitation form contains invalid values.');

      const metadata = await metadataStore.get('userLimitations', limitation.id);
      const action = existing || (metadata && !metadata.deletedAt) ? 'update' : 'create';
      await queueStore.enqueue(
        createUserLimitationQueueOperation({
          action,
          limitation,
          deviceId: activeSession.device.id,
          actorId: activeSession.user.id,
          baseRevision: metadata?.revision ?? 0,
          previous: metadata,
          now,
        }),
      );

      const latestApp = latestAppRef.current;
      latestApp.replaceState(
        toAppState(latestApp, {
          userLimitations: upsertUserLimitation(
            latestApp.userLimitations,
            limitation,
          ),
        }),
      );
      void syncNow();
      return limitation;
    },
    [metadataStore, queueStore, requireSession, syncNow],
  );

  const deleteUserLimitation = useCallback(
    async (limitationId: string): Promise<void> => {
      const activeSession = requireSession();
      const currentApp = latestAppRef.current;
      const limitation = currentApp.userLimitations.find(
        (item) => item.id === limitationId,
      );
      if (!limitation) return;

      const metadata = await metadataStore.get('userLimitations', limitation.id);
      await queueStore.enqueue(
        createUserLimitationQueueOperation({
          action: 'delete',
          limitation,
          deviceId: activeSession.device.id,
          actorId: activeSession.user.id,
          baseRevision: metadata?.revision ?? 0,
          previous: metadata,
        }),
      );

      const latestApp = latestAppRef.current;
      latestApp.replaceState(
        toAppState(latestApp, {
          userLimitations: latestApp.userLimitations.filter(
            (item) => item.id !== limitation.id,
          ),
        }),
      );
      void syncNow();
    },
    [metadataStore, queueStore, requireSession, syncNow],
  );

  const saveRecoveryCheckIn = useCallback(
    async (input: RecoveryCheckIn): Promise<RecoveryCheckIn> => {
      const activeSession = requireSession();
      const currentApp = latestAppRef.current;
      const existing = currentApp.recoveryCheckIns.find((item) => item.id === input.id);
      const now = new Date().toISOString();
      const checkIn = normalizeRecoveryCheckIn(
        {
          ...input,
          createdAt: existing?.createdAt ?? input.createdAt ?? now,
          updatedAt: now,
        },
        now,
      );
      if (!checkIn) {
        throw new Error('Add at least one valid recovery signal before saving.');
      }

      const metadata = await metadataStore.get('recoveryCheckIns', checkIn.id);
      const action = existing || (metadata && !metadata.deletedAt) ? 'update' : 'create';
      await queueStore.enqueue(
        createRecoveryCheckInQueueOperation({
          action,
          checkIn,
          deviceId: activeSession.device.id,
          actorId: activeSession.user.id,
          baseRevision: metadata?.revision ?? 0,
          previous: metadata,
          now,
        }),
      );

      const latestApp = latestAppRef.current;
      latestApp.replaceState(
        toAppState(latestApp, {
          recoveryCheckIns: upsertRecoveryCheckIn(
            latestApp.recoveryCheckIns,
            checkIn,
          ),
        }),
      );
      void syncNow();
      return checkIn;
    },
    [metadataStore, queueStore, requireSession, syncNow],
  );

  const deleteRecoveryCheckIn = useCallback(
    async (checkInId: string): Promise<void> => {
      const activeSession = requireSession();
      const currentApp = latestAppRef.current;
      const checkIn = currentApp.recoveryCheckIns.find((item) => item.id === checkInId);
      if (!checkIn) return;

      const metadata = await metadataStore.get('recoveryCheckIns', checkIn.id);
      await queueStore.enqueue(
        createRecoveryCheckInQueueOperation({
          action: 'delete',
          checkIn,
          deviceId: activeSession.device.id,
          actorId: activeSession.user.id,
          baseRevision: metadata?.revision ?? 0,
          previous: metadata,
        }),
      );

      const latestApp = latestAppRef.current;
      latestApp.replaceState(
        toAppState(latestApp, {
          recoveryCheckIns: latestApp.recoveryCheckIns.filter(
            (item) => item.id !== checkIn.id,
          ),
        }),
      );
      void syncNow();
    },
    [metadataStore, queueStore, requireSession, syncNow],
  );

  const value = useMemo<SafetyRecoveryContextValue>(
    () => ({
      saveUserLimitation,
      deleteUserLimitation,
      saveRecoveryCheckIn,
      deleteRecoveryCheckIn,
    }),
    [
      deleteRecoveryCheckIn,
      deleteUserLimitation,
      saveRecoveryCheckIn,
      saveUserLimitation,
    ],
  );

  return (
    <SafetyRecoveryContext.Provider value={value}>
      {children}
    </SafetyRecoveryContext.Provider>
  );
}

export const useSafetyRecoveryRecords = (): SafetyRecoveryContextValue => {
  const context = useContext(SafetyRecoveryContext);
  if (!context) {
    throw new Error('useSafetyRecoveryRecords must be used inside SafetyRecoveryProvider');
  }
  return context;
};
