import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo } from 'react';

import { getMobileApiBaseUrl } from '@/api';
import { createApiClient } from '@/api/client';
import {
  AUTH_SESSION_STORAGE_KEY,
  clearAccountDeletionReceiptIdentity,
  clearLocalAccountData,
  completeLocalAccountCleanup,
  createMigratingTokenManager,
  resumePendingLocalAccountCleanup,
} from '@/auth';
import { createCapabilityService } from '@/capabilities';
import { createSyncCoordinator, type SyncCoordinator } from '@/cloud';
import { createProductionCloudProvider } from '@/cloud/createProductionCloudProvider';
import { defaultState as defaultAppState } from '@/data/defaults';
import { createRepositoryFactory } from '@/repositories';
import { createAsyncStorageAdapter } from '@/storage';
import { createAsyncStorageOperationQueueStore } from '@/storage/AsyncStorageOperationQueueStore';
import { createSecureTokenStorageAdapter } from '@/storage/SecureTokenStorageAdapter';
import { createWeightSyncMetadataStore } from '@/storage/WeightSyncMetadataStore';
import type { AppState } from '@/types';

import { measureAppStateRestore } from './AppPersistenceMetrics';

export function useAppInfrastructure(
  setState: Dispatch<SetStateAction<AppState>>,
  setIsRestoringState: Dispatch<SetStateAction<boolean>>,
) {
  const storageAdapter = useMemo(() => createAsyncStorageAdapter(), []);
  const secureTokenStorage = useMemo(() => createSecureTokenStorageAdapter(), []);
  const tokenManager = useMemo(
    () =>
      createMigratingTokenManager({
        legacyStorage: storageAdapter,
        secureStorage: secureTokenStorage,
      }),
    [secureTokenStorage, storageAdapter],
  );
  const onAccountDeleted = useCallback(
    async (userId: string) => {
      setState(defaultAppState);
      setIsRestoringState(false);
      await clearLocalAccountData(storageAdapter, userId, secureTokenStorage);
    },
    [secureTokenStorage, setIsRestoringState, setState, storageAdapter],
  );
  const repositoryProvider = useMemo(
    () =>
      createRepositoryFactory(storageAdapter, {
        tokenManager,
        accountCleanupMarkerStorage: secureTokenStorage,
        onAccountDeleted,
      }),
    [onAccountDeleted, secureTokenStorage, storageAdapter, tokenManager],
  );
  const repository = useMemo(
    () => repositoryProvider.getRepository(),
    [repositoryProvider],
  );
  const authService = useMemo(
    () => repositoryProvider.getAuthService(),
    [repositoryProvider],
  );
  const queueStore = useMemo(
    () => createAsyncStorageOperationQueueStore(storageAdapter),
    [storageAdapter],
  );
  const weightSyncMetadataStore = useMemo(
    () => createWeightSyncMetadataStore(storageAdapter),
    [storageAdapter],
  );
  const apiClient = useMemo(
    () => createApiClient({ baseUrl: getMobileApiBaseUrl() }),
    [],
  );
  const capabilityService = useMemo(
    () => createCapabilityService(apiClient),
    [apiClient],
  );
  const cloudProvider = useMemo(
    () => createProductionCloudProvider({ apiClient, authService }),
    [apiClient, authService],
  );
  const syncCoordinator = useMemo<SyncCoordinator>(
    () => createSyncCoordinator({ queueStore, provider: cloudProvider }),
    [cloudProvider, queueStore],
  );

  useEffect(() => {
    let cancelled = false;

    const restoreState = async () => {
      try {
        const cleanupResumed = await resumePendingLocalAccountCleanup(
          storageAdapter,
          secureTokenStorage,
        );
        if (cleanupResumed) {
          const authCleanupResults = await Promise.allSettled([
            tokenManager.clearTokens(),
            storageAdapter.remove(AUTH_SESSION_STORAGE_KEY),
          ]);
          if (
            authCleanupResults.some((result) => result.status === 'rejected')
          ) {
            throw new Error('Pending account auth cleanup failed');
          }
          await completeLocalAccountCleanup(secureTokenStorage);
          await clearAccountDeletionReceiptIdentity(secureTokenStorage);
        }

        const storedState = await measureAppStateRestore({
          load: () => repository.loadState(),
        });
        if (storedState && !cancelled) setState(storedState);
      } catch {
        if (!cancelled) setState(defaultAppState);
      } finally {
        if (!cancelled) setIsRestoringState(false);
      }
    };

    void restoreState();
    return () => {
      cancelled = true;
    };
  }, [
    repository,
    secureTokenStorage,
    setIsRestoringState,
    setState,
    storageAdapter,
    tokenManager,
  ]);

  return {
    authService,
    capabilityService,
    queueStore,
    repository,
    syncCoordinator,
    weightSyncMetadataStore,
  };
}
