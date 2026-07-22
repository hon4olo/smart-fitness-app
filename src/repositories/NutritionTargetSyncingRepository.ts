import type { AuthService } from '@/auth';
import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import {
  areNutritionTargetsEqual,
  createNutritionTargetQueueOperation,
  getNutritionTargetEntityId,
  isNutritionTargetOutboxSuppressed,
} from '@/cloud/NutritionTargetSync';
import { defaultState } from '@/data/defaults';
import type { NutritionTargetSyncMetadataStore } from '@/storage/NutritionTargetSyncMetadataStore';
import type { AppState } from '@/types';

import type { AppRepository } from './AppRepository';

type Options = {
  authService: Pick<AuthService, 'getCurrentSession'>;
  queueStore: OfflineSyncQueueStore;
  metadataStore: NutritionTargetSyncMetadataStore;
};

export const createNutritionTargetSyncingRepository = (
  baseRepository: AppRepository,
  { authService, metadataStore, queueStore }: Options,
): AppRepository => {
  let previousState: AppState = defaultState;

  return {
    async loadState() {
      const state = await baseRepository.loadState();
      previousState = state ?? defaultState;
      return state;
    },
    async saveState(state) {
      const suppressOutbox = isNutritionTargetOutboxSuppressed();
      const prior = previousState;
      previousState = state;
      await baseRepository.saveState(state);

      if (suppressOutbox) {
        return;
      }

      try {
        const session = await authService.getCurrentSession();
        if (!session?.user.id || !session.device.id) {
          return;
        }

        const entityId = getNutritionTargetEntityId(session.user.id);
        const metadata = await metadataStore.get(entityId);
        const changed = !areNutritionTargetsEqual(
          prior.nutritionTargets,
          state.nutritionTargets,
        );
        if (metadata && !changed) {
          return;
        }

        await queueStore.enqueue(
          createNutritionTargetQueueOperation({
            action: metadata ? 'update' : 'create',
            targets: state.nutritionTargets,
            userId: session.user.id,
            deviceId: session.device.id,
            baseRevision: metadata?.revision ?? 0,
            previous: metadata,
          }),
        );
      } catch (error) {
        console.warn('Failed to enqueue nutrition target sync operation', error);
      }
    },
    async clearState() {
      previousState = defaultState;
      await baseRepository.clearState();
    },
  };
};