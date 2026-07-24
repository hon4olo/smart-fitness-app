import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import type { AppRepository } from '@/repositories';
import type { AppMutationOutboxRecoveryStore } from '@/storage';
import type { AppState } from '@/types';

import { AppMutationQueue, type AppMutationTask } from './AppMutationQueue';
import { recoverAppMutationOutbox } from './AppMutationOutboxRecovery';

export type EnqueueAppStateMutation = (input: {
  label: string;
  nextState: AppState;
  outbox?: () => Promise<void>;
}) => Promise<void>;

export type ScheduleAppStateMutation = (input: {
  label: string;
  nextState: AppState;
  outbox?: () => Promise<void>;
}) => void;

export function useAppMutationQueue({
  outboxRecoveryStore,
  queueStore,
  repository,
}: {
  outboxRecoveryStore: AppMutationOutboxRecoveryStore;
  queueStore: Pick<OfflineSyncQueueStore, 'enqueue'>;
  repository: AppRepository;
}) {
  const queue = useMemo(() => new AppMutationQueue(), []);
  const snapshot = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getSnapshot);

  useEffect(() => {
    void queue
      .enqueue({
        label: 'Recover cloud queue',
        steps: [
          {
            stage: 'outbox',
            run: () =>
              recoverAppMutationOutbox({
                queueStore,
                recoveryStore: outboxRecoveryStore,
              }).then(() => undefined),
          },
        ],
      })
      .catch(() => undefined);
  }, [outboxRecoveryStore, queue, queueStore]);

  const enqueueStateMutation = useCallback<EnqueueAppStateMutation>(
    ({ label, nextState, outbox }) => {
      const steps: AppMutationTask['steps'] = [
        {
          stage: 'local_persistence',
          run: () => repository.saveState(nextState),
        },
      ];
      if (outbox) {
        steps.push({ stage: 'outbox', run: outbox });
      }
      return queue.enqueue({ label, steps });
    },
    [queue, repository],
  );

  const scheduleStateMutation = useCallback<ScheduleAppStateMutation>(
    (input) => {
      void enqueueStateMutation(input).catch(() => undefined);
    },
    [enqueueStateMutation],
  );

  const retryFailedMutation = useCallback(() => {
    void queue.retryFailure().catch(() => undefined);
  }, [queue]);

  return {
    enqueueStateMutation,
    scheduleStateMutation,
    pendingMutationCount: snapshot.pendingCount,
    mutationFailure: snapshot.failure,
    dismissMutationFailure: queue.dismissFailure,
    retryFailedMutation,
  };
}
