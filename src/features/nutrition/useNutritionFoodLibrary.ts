import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthSession } from '@/hooks/useAuthSession';

import type { DraftItem } from './addFoodModel';
import {
  getNutritionFoodLibraryStorageKey,
  parseNutritionFoodLibrary,
  removeNutritionLibraryFood,
  serializeNutritionFoodLibrary,
  upsertNutritionLibraryFood,
  type NutritionLibraryFood,
} from './nutritionFoodLibrary';

const LOAD_ERROR = 'Could not load your food library.';
const SAVE_ERROR = 'Could not save your food library.';

export function useNutritionFoodLibrary() {
  const { ready: authReady, user } = useAuthSession();
  const ownerId = authReady ? user?.id ?? null : undefined;
  const storageKey = useMemo(
    () => (ownerId === undefined ? null : getNutritionFoodLibraryStorageKey(ownerId)),
    [ownerId],
  );
  const [foods, setFoods] = useState<NutritionLibraryFood[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setFoods([]);
      setHydrated(false);
      setError(null);
      return;
    }

    let active = true;
    setFoods([]);
    setHydrated(false);
    setError(null);

    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!active) return;
        setFoods(parseNutritionFoodLibrary(raw));
        setHydrated(true);
      })
      .catch(() => {
        if (!active) return;
        setFoods([]);
        setHydrated(true);
        setError(LOAD_ERROR);
      });

    return () => {
      active = false;
    };
  }, [storageKey]);

  const persist = useCallback(
    (updater: (current: NutritionLibraryFood[]) => NutritionLibraryFood[]) => {
      if (!storageKey || !hydrated) return;
      setFoods((current) => {
        const next = updater(current);
        void AsyncStorage.setItem(storageKey, serializeNutritionFoodLibrary(next)).catch(() => {
          setError(SAVE_ERROR);
        });
        return next;
      });
    },
    [hydrated, storageKey],
  );

  const saveCustomFood = useCallback(
    (draft: DraftItem) => persist((current) => upsertNutritionLibraryFood(current, draft, 'custom', new Date().toISOString())),
    [persist],
  );

  const toggleProviderFavorite = useCallback(
    (draft: DraftItem) => {
      persist((current) => {
        const libraryId = draft.externalId ? `${draft.source}:${draft.externalId}` : '';
        return libraryId && current.some((item) => item.libraryId === libraryId)
          ? removeNutritionLibraryFood(current, libraryId)
          : upsertNutritionLibraryFood(current, draft, 'provider-favorite', new Date().toISOString());
      });
    },
    [persist],
  );

  const removeFood = useCallback(
    (libraryId: string) => persist((current) => removeNutritionLibraryFood(current, libraryId)),
    [persist],
  );

  return {
    customFoods: foods.filter((food) => food.kind === 'custom'),
    error,
    foods,
    hydrated,
    providerFavorites: foods.filter((food) => food.kind === 'provider-favorite'),
    removeFood,
    saveCustomFood,
    toggleProviderFavorite,
  };
}
