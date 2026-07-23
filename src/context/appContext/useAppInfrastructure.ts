import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo } from 'react';

import { getMobileApiBaseUrl } from '@/api';
import { createApiClient } from '@/api/client';
import { createMigratingTokenManager } from '@/auth';
import { createSyncCoordinator, type SyncCoordinator } from '@/cloud';
import { createProductionCloudProvider } from '@/cloud/createProductionCloudProvider';
import { createRepositoryFactory } from '@/repositories';
import { createAsyncStorageAdapter } from '@/storage';
import { createAsyncStorageOperationQueueStore } from '@/storage/AsyncStorageOperationQueueStore';
import { createSecureTokenStorageAdapter } from '@/storage/SecureTokenStorageAdapter';
import { createWeightSyncMetadataStore } from '@/storage/WeightSyncMetadataStore';
import type { AppState } from '@/types';

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
  const repositoryProvider = useMemo(
    () => createRepositoryFactory(storageAdapter, { tokenManager }),
    [storageAdapter, tokenManager],
  );
  const repository = useMemo(() => repositoryProvider.getRepository(), [repositoryProvider]);
  const authService = useMemo(() => repositoryProvider.getAuthService(), [repositoryProvider]);
  const queueStore = useMemo(
    () => createAsyncStorageOperationQueueStore(storageAdapter),
    [storageAdapter],
  );
  const weightSyncMetadataStore = useMemo(
    () => createWeightSyncMetadataStore(storageAdapter),
    [storageAdapter],
  );
  const apiClient = useMemo(() => createApiClient({ baseUrl: getMobileApiBaseUrl() }), []);
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
      const storedState = await repository.loadState();
      if (storedState && !cancelled) setState(storedState);
      if (!cancelled) setIsRestoringState(false);
    };

    void restoreState();
    return () => {
      cancelled = true;
    };
  }, [repository, setIsRestoringState, setState]);

  return {
    authService,
    queueStore,
    repository,
    syncCoordinator,
    weightSyncMetadataStore,
  };
}
