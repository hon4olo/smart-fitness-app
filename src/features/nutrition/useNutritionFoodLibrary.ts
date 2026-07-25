import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { createNutritionLibraryQueueOperation, subscribeNutritionLibrarySync } from '@/cloud/NutritionLibrarySync';
import { useAuthSession } from '@/hooks/useAuthSession';
import { createAsyncStorageAdapter, createAsyncStorageOperationQueueStore } from '@/storage';

import type { DraftItem } from './addFoodModel';
import {
  getActiveNutritionLibraryFoods,
  getNutritionFoodLibraryStorageKey,
  parseNutritionFoodLibrary,
  serializeNutritionFoodLibrary,
  tombstoneNutritionLibraryFood,
  upsertNutritionLibraryFood,
  type NutritionLibraryFood,
} from './nutritionFoodLibrary';

const LOAD_ERROR = 'Could not load your food library.';
const SAVE_ERROR = 'Could not save your food library.';

export function useNutritionFoodLibrary() {
  const { ready: authReady, session, user } = useAuthSession();
  const ownerId = authReady ? user?.id ?? null : undefined;
  const storageKey = useMemo(
    () => (ownerId === undefined ? null : getNutritionFoodLibraryStorageKey(ownerId)),
    [ownerId],
  );
  const queueStore = useMemo(
    () => createAsyncStorageOperationQueueStore(createAsyncStorageAdapter()),
    [],
  );
  const [records, setRecords] = useState<NutritionLibraryFood[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    if (!storageKey) return;
    const raw = await AsyncStorage.getItem(storageKey);
    setRecords(parseNutritionFoodLibrary(raw));
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      setRecords([]);
      setHydrated(false);
      setError(null);
      return;
    }

    let active = true;
    setRecords([]);
    setHydrated(false);
    setError(null);

    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!active) return;
        setRecords(parseNutritionFoodLibrary(raw));
        setHydrated(true);
      })
      .catch(() => {
        if (!active) return;
        setRecords([]);
        setHydrated(true);
        setError(LOAD_ERROR);
      });

    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!ownerId) return;
    return subscribeNutritionLibrarySync((updatedOwnerId) => {
      if (updatedOwnerId === ownerId) void loadRecords().catch(() => setError(LOAD_ERROR));
    });
  }, [loadRecords, ownerId]);

  const persist = useCallback(
    (updater: (current: NutritionLibraryFood[]) => NutritionLibraryFood[]) => {
      if (!storageKey || !hydrated) return;
      setRecords((current) => {
        const next = updater(current);
        const changed = next.filter((record) => {
          const previous = current.find((item) => item.libraryId === record.libraryId);
          return !previous || previous.revision !== record.revision;
        });
        void AsyncStorage.setItem(storageKey, serializeNutritionFoodLibrary(next))
          .then(async () => {
            if (!ownerId || !session?.device.id) return;
            for (const item of changed) {
              await queueStore.enqueue(
                createNutritionLibraryQueueOperation({
                  item,
                  userId: ownerId,
                  deviceId: session.device.id,
                }),
              );
            }
          })
          .catch(() => {
            setError(SAVE_ERROR);
          });
        return next;
      });
    },
    [hydrated, ownerId, queueStore, session?.device.id, storageKey],
  );

  const saveCustomFood = useCallback(
    (draft: DraftItem) =>
      persist((current) =>
        upsertNutritionLibraryFood(current, draft, 'custom', new Date().toISOString()),
      ),
    [persist],
  );

  const toggleProviderFavorite = useCallback(
    (draft: DraftItem) => {
      persist((current) => {
        const libraryId = draft.externalId ? `${draft.source}:${draft.externalId}` : '';
        const activeFoods = getActiveNutritionLibraryFoods(current);
        return libraryId && activeFoods.some((item) => item.libraryId === libraryId)
          ? tombstoneNutritionLibraryFood(current, libraryId, new Date().toISOString())
          : upsertNutritionLibraryFood(
              current,
              draft,
              'provider-favorite',
              new Date().toISOString(),
            );
      });
    },
    [persist],
  );

  const removeFood = useCallback(
    (libraryId: string) =>
      persist((current) =>
        tombstoneNutritionLibraryFood(current, libraryId, new Date().toISOString()),
      ),
    [persist],
  );

  const foods = useMemo(() => getActiveNutritionLibraryFoods(records), [records]);

  return {
    customFoods: foods.filter((food) => food.kind === 'custom'),
    error,
    foods,
    hydrated,
    providerFavorites: foods.filter((food) => food.kind === 'provider-favorite'),
    removeFood,
    saveCustomFood,
    syncRecords: records,
    toggleProviderFavorite,
  };
}
