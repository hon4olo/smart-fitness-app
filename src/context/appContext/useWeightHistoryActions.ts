import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useMemo } from 'react';

import type { AuthService } from '@/auth';
import type { OfflineSyncQueueOperation } from '@/cloud/CloudQueueTypes';
import { createWeightHistoryQueueOperation } from '@/cloud/WeightHistorySync';
import { getDefaultAppMutationOutboxRecoveryStore } from '@/storage';
import type { createAsyncStorageOperationQueueStore } from '@/storage/AsyncStorageOperationQueueStore';
import type { createWeightSyncMetadataStore } from '@/storage/WeightSyncMetadataStore';
import type { AppState, WeightEntry } from '@/types';

import { createRecoverableOutboxStep } from './AppMutationOutboxRecovery';
import {
  addWeightEntryToState,
  deleteWeightEntryFromState,
  updateWeightEntryInState,
} from './progressActions';
import type { ScheduleAppStateMutation } from './useAppMutationQueue';

type WeightHistoryAction = 'create' | 'update' | 'delete';

type WeightHistoryActionsOptions = {
  authService: AuthService;
  queueStore: ReturnType<typeof createAsyncStorageOperationQueueStore>;
  scheduleStateMutation: ScheduleAppStateMutation;
  setState: Dispatch<SetStateAction<AppState>>;
  weightSyncMetadataStore: ReturnType<typeof createWeightSyncMetadataStore>;
};

const getRecoveryLabel = (action: WeightHistoryAction): string => {
  if (action === 'create') return 'Save weight entry';
  if (action === 'update') return 'Update weight entry';
  return 'Delete weight entry';
};

export function useWeightHistoryActions({
  authService,
  queueStore,
  scheduleStateMutation,
  setState,
  weightSyncMetadataStore,
}: WeightHistoryActionsOptions) {
  const outboxRecoveryStore = useMemo(getDefaultAppMutationOutboxRecoveryStore, []);
  const buildWeightHistoryOperation = useCallback(
    async (action: WeightHistoryAction, entry: WeightEntry): Promise<OfflineSyncQueueOperation> => {
      const session = await authService.getCurrentSession();
      const metadata = await weightSyncMetadataStore.get(entry.id);
      return createWeightHistoryQueueOperation({
        action,
        entry,
        deviceId: session?.device.id ?? 'local-device',
        baseRevision: metadata?.revision ?? 0,
        actorId: session?.user.id,
        previous: metadata,
      });
    },
    [authService, weightSyncMetadataStore],
  );

  const createWeightHistoryOutboxStep = useCallback(
    (action: WeightHistoryAction, entry: WeightEntry): (() => Promise<void>) =>
      createRecoverableOutboxStep({
        buildOperation: () => buildWeightHistoryOperation(action, entry),
        label: getRecoveryLabel(action),
        queueStore,
        recoveryStore: outboxRecoveryStore,
      }),
    [buildWeightHistoryOperation, outboxRecoveryStore, queueStore],
  );

  const addWeightEntry = useCallback(
    (entry: WeightEntry) => {
      setState((currentState) => {
        const nextState = addWeightEntryToState(currentState, entry);
        scheduleStateMutation({
          label: 'Save weight entry',
          nextState,
          outbox: createWeightHistoryOutboxStep('create', entry),
        });
        return nextState;
      });
    },
    [createWeightHistoryOutboxStep, scheduleStateMutation, setState],
  );

  const updateWeightEntry = useCallback(
    (entryId: string, entry: WeightEntry) => {
      setState((currentState) => {
        const nextState = updateWeightEntryInState(currentState, entryId, entry);
        if (nextState === currentState) return currentState;
        scheduleStateMutation({
          label: 'Update weight entry',
          nextState,
          outbox: createWeightHistoryOutboxStep('update', entry),
        });
        return nextState;
      });
    },
    [createWeightHistoryOutboxStep, scheduleStateMutation, setState],
  );

  const deleteWeightEntry = useCallback(
    (entryId: string) => {
      setState((currentState) => {
        const entry = currentState.weightHistory.find((item) => item.id === entryId);
        const nextState = deleteWeightEntryFromState(currentState, entryId);
        if (nextState === currentState) return currentState;
        scheduleStateMutation({
          label: 'Delete weight entry',
          nextState,
          outbox: entry ? createWeightHistoryOutboxStep('delete', entry) : undefined,
        });
        return nextState;
      });
    },
    [createWeightHistoryOutboxStep, scheduleStateMutation, setState],
  );

  return {
    addWeightEntry,
    createWeightHistoryOutboxStep,
    deleteWeightEntry,
    updateWeightEntry,
  };
}
