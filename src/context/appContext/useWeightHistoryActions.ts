import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import type { AuthService } from '@/auth';
import { createWeightHistoryQueueOperation } from '@/cloud/WeightHistorySync';
import type { AppRepository } from '@/repositories';
import type { createAsyncStorageOperationQueueStore } from '@/storage/AsyncStorageOperationQueueStore';
import type { createWeightSyncMetadataStore } from '@/storage/WeightSyncMetadataStore';
import type { AppState, WeightEntry } from '@/types';

import {
  addWeightEntryToState,
  deleteWeightEntryFromState,
  updateWeightEntryInState,
} from './progressActions';

type WeightHistoryActionsOptions = {
  authService: AuthService;
  queueStore: ReturnType<typeof createAsyncStorageOperationQueueStore>;
  repository: AppRepository;
  setState: Dispatch<SetStateAction<AppState>>;
  weightSyncMetadataStore: ReturnType<typeof createWeightSyncMetadataStore>;
};

export function useWeightHistoryActions({
  authService,
  queueStore,
  repository,
  setState,
  weightSyncMetadataStore,
}: WeightHistoryActionsOptions) {
  const queueWeightHistoryOperation = useCallback(
    async (action: 'create' | 'update' | 'delete', entry: WeightEntry) => {
      const session = await authService.getCurrentSession();
      const metadata = await weightSyncMetadataStore.get(entry.id);
      const operation = createWeightHistoryQueueOperation({
        action,
        entry,
        deviceId: session?.device.id ?? 'local-device',
        baseRevision: metadata?.revision ?? 0,
        actorId: session?.user.id,
        previous: metadata,
      });
      await queueStore.enqueue(operation);
    },
    [authService, queueStore, weightSyncMetadataStore],
  );

  const addWeightEntry = useCallback(
    (entry: WeightEntry) => {
      setState((currentState) => {
        const nextState = addWeightEntryToState(currentState, entry);
        void repository.saveState(nextState);
        void queueWeightHistoryOperation('create', entry);
        return nextState;
      });
    },
    [queueWeightHistoryOperation, repository, setState],
  );

  const updateWeightEntry = useCallback(
    (entryId: string, entry: WeightEntry) => {
      setState((currentState) => {
        const nextState = updateWeightEntryInState(currentState, entryId, entry);
        if (nextState === currentState) return currentState;
        void repository.saveState(nextState);
        void queueWeightHistoryOperation('update', entry);
        return nextState;
      });
    },
    [queueWeightHistoryOperation, repository, setState],
  );

  const deleteWeightEntry = useCallback(
    (entryId: string) => {
      setState((currentState) => {
        const entry = currentState.weightHistory.find((item) => item.id === entryId);
        const nextState = deleteWeightEntryFromState(currentState, entryId);
        void repository.saveState(nextState);
        if (entry) void queueWeightHistoryOperation('delete', entry);
        return nextState;
      });
    },
    [queueWeightHistoryOperation, repository, setState],
  );

  return {
    addWeightEntry,
    deleteWeightEntry,
    queueWeightHistoryOperation,
    updateWeightEntry,
  };
}
