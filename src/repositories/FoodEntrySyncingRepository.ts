import type { AuthService } from '@/auth';
import type { OfflineSyncQueueStore } from '@/cloud/CloudQueueStore';
import {
  createFoodEntryQueueOperation,
  isFoodEntryOutboxSuppressed,
  normalizeFoodEntryForSync,
} from '@/cloud/FoodEntrySync';
import { defaultState } from '@/data/defaults';
import type { FoodEntrySyncMetadataStore } from '@/storage/FoodEntrySyncMetadataStore';
import type { AppState, FoodEntry } from '@/types';

import type { AppRepository } from './AppRepository';

type FoodEntrySyncingRepositoryOptions = {
  authService: Pick<AuthService, 'getCurrentSession'>;
  queueStore: OfflineSyncQueueStore;
  metadataStore: FoodEntrySyncMetadataStore;
};

type FoodEntryChange = {
  action: 'create' | 'update' | 'delete';
  entry: FoodEntry;
};

const indexEntries = (entries: FoodEntry[]): Map<string, FoodEntry> =>
  new Map(
    entries
      .map(normalizeFoodEntryForSync)
      .map((entry) => [entry.id, entry] as const),
  );

const sameEntry = (left: FoodEntry, right: FoodEntry): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

export const diffFoodEntries = (
  previousEntries: FoodEntry[],
  nextEntries: FoodEntry[],
): FoodEntryChange[] => {
  const previous = indexEntries(previousEntries);
  const next = indexEntries(nextEntries);
  const changes: FoodEntryChange[] = [];

  for (const [id, entry] of next) {
    const existing = previous.get(id);
    if (!existing) {
      changes.push({ action: 'create', entry });
    } else if (!sameEntry(existing, entry)) {
      changes.push({ action: 'update', entry });
    }
  }

  for (const [id, entry] of previous) {
    if (!next.has(id)) {
      changes.push({ action: 'delete', entry });
    }
  }

  return changes;
};

export const createFoodEntrySyncingRepository = (
  baseRepository: AppRepository,
  { authService, metadataStore, queueStore }: FoodEntrySyncingRepositoryOptions,
): AppRepository => {
  let previousState: AppState = defaultState;

  const enqueueChanges = async (changes: FoodEntryChange[]): Promise<void> => {
    if (changes.length === 0) {
      return;
    }

    const session = await authService.getCurrentSession();
    for (const change of changes) {
      const metadata = await metadataStore.get(change.entry.id);
      await queueStore.enqueue(
        createFoodEntryQueueOperation({
          action: change.action,
          entry: change.entry,
          deviceId: session?.device.id ?? 'local-device',
          actorId: session?.user.id,
          baseRevision: metadata?.revision ?? 0,
          previous: metadata,
        }),
      );
    }
  };

  return {
    async loadState() {
      const state = await baseRepository.loadState();
      previousState = state ?? defaultState;
      return state;
    },
    async saveState(state) {
      const suppressOutbox = isFoodEntryOutboxSuppressed();
      const prior = previousState;
      previousState = state;
      await baseRepository.saveState(state);

      if (suppressOutbox) {
        return;
      }

      try {
        await enqueueChanges(diffFoodEntries(prior.foodEntries, state.foodEntries));
      } catch (error) {
        console.warn('Failed to enqueue food entry sync operations', error);
      }
    },
    async clearState() {
      previousState = defaultState;
      await baseRepository.clearState();
    },
  };
};