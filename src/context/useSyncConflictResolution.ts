import { useCallback, useMemo } from 'react';

import { getMobileApiBaseUrl } from '@/api';
import { createApiClient } from '@/api/client';
import type { AuthService } from '@/auth';
import {
  createSyncConflictResolutionClient,
  type SyncConflictResolutionCandidate,
  type SyncConflictResolutionChoice,
  type SyncConflictResolutionWorkflowOutcome,
} from '@/cloud';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  createAsyncStorageAdapter,
  createSyncConflictResolutionIntentStore,
  createSyncConflictStore,
  getDefaultSyncCursorStore,
} from '@/storage';

import {
  createSyncConflictResolutionController,
  type SyncConflictResolutionController,
  type SyncConflictResolutionControllerReviewItem,
} from './SyncConflictResolutionController';
import { useWeightSync } from './SyncContext';

export type SyncConflictResolutionReviewItem =
  SyncConflictResolutionControllerReviewItem;

export type AuthenticatedSyncConflictResolution = {
  listCandidates(): Promise<SyncConflictResolutionCandidate[]>;
  listReviewItems(): Promise<SyncConflictResolutionReviewItem[]>;
  resolve(
    candidate: SyncConflictResolutionCandidate,
    choice: SyncConflictResolutionChoice,
  ): Promise<SyncConflictResolutionWorkflowOutcome>;
  continueResolution(
    item: SyncConflictResolutionReviewItem,
  ): Promise<SyncConflictResolutionWorkflowOutcome>;
};

const authenticationRequiredOutcome = (): SyncConflictResolutionWorkflowOutcome => ({
  status: 'authentication_required',
  intent: null,
  submission: {
    status: 'authentication_required',
    intent: null,
  },
});

export function useSyncConflictResolution(): AuthenticatedSyncConflictResolution {
  const { refresh, session } = useAuthSession();
  const { syncNow } = useWeightSync();
  const apiClient = useMemo(
    () => createApiClient({ baseUrl: getMobileApiBaseUrl() }),
    [],
  );
  const authService = useMemo<
    Pick<AuthService, 'getAccessToken' | 'getCurrentSession' | 'refresh'>
  >(
    () => ({
      getAccessToken: async () => session?.tokens.accessToken ?? null,
      getCurrentSession: async () => session,
      refresh,
    }),
    [refresh, session],
  );
  const client = useMemo(
    () => createSyncConflictResolutionClient({ apiClient, authService }),
    [apiClient, authService],
  );
  const stores = useMemo(() => {
    const storage = createAsyncStorageAdapter();
    return {
      conflictStore: createSyncConflictStore(storage),
      cursorStore: getDefaultSyncCursorStore(),
      intentStore: createSyncConflictResolutionIntentStore(storage),
    };
  }, []);
  const controller = useMemo<SyncConflictResolutionController>(
    () =>
      createSyncConflictResolutionController({
        client,
        conflictStore: stores.conflictStore,
        cursorStore: stores.cursorStore,
        intentStore: stores.intentStore,
        synchronize: syncNow,
      }),
    [client, stores, syncNow],
  );

  const listCandidates = useCallback(async () => {
    const userId = session?.user.id;
    return userId ? controller.listCandidates(userId) : [];
  }, [controller, session?.user.id]);

  const listReviewItems = useCallback(async () => {
    const userId = session?.user.id;
    return userId ? controller.listReviewItems(userId) : [];
  }, [controller, session?.user.id]);

  const resolve = useCallback(
    async (
      candidate: SyncConflictResolutionCandidate,
      choice: SyncConflictResolutionChoice,
    ) => {
      const userId = session?.user.id;
      if (!userId) return authenticationRequiredOutcome();
      return controller.resolve(userId, candidate, choice);
    },
    [controller, session?.user.id],
  );

  const continueResolution = useCallback(
    async (item: SyncConflictResolutionReviewItem) => {
      const userId = session?.user.id;
      if (!userId) return authenticationRequiredOutcome();
      return controller.resume(userId, item.conflictId);
    },
    [controller, session?.user.id],
  );

  return useMemo(
    () => ({
      continueResolution,
      listCandidates,
      listReviewItems,
      resolve,
    }),
    [continueResolution, listCandidates, listReviewItems, resolve],
  );
}
