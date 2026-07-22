import { useCallback, useMemo } from 'react';

import { createWorkoutSessionQueueOperation } from '@/cloud/WorkoutSessionSync';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  createAsyncStorageAdapter,
  createAsyncStorageOperationQueueStore,
  createWorkoutSessionSyncMetadataStore,
} from '@/storage';
import type { WorkoutSession } from '@/types';

export const useWorkoutSessionSyncQueue = () => {
  const { session } = useAuthSession();
  const storage = useMemo(() => createAsyncStorageAdapter(), []);
  const queueStore = useMemo(
    () => createAsyncStorageOperationQueueStore(storage),
    [storage],
  );
  const metadataStore = useMemo(
    () => createWorkoutSessionSyncMetadataStore(storage),
    [storage],
  );

  return useCallback(
    async (
      action: 'create' | 'update' | 'delete',
      workoutSession: WorkoutSession,
    ) => {
      const metadata = await metadataStore.get(workoutSession.id);
      const operation = createWorkoutSessionQueueOperation({
        action,
        session: workoutSession,
        deviceId: session?.device.id ?? '00000000-0000-4000-8000-000000000000',
        baseRevision: metadata?.revision ?? 0,
        actorId: session?.user.id,
        previous: metadata,
      });

      await queueStore.enqueue(operation);
    },
    [metadataStore, queueStore, session?.device.id, session?.user.id],
  );
};
