import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthSession } from '@/hooks/useAuthSession';

import {
  getNutritionFavoritesStorageKey,
  parseNutritionFavoriteIds,
  serializeNutritionFavoriteIds,
  toggleNutritionFavoriteId,
} from './nutritionFavorites';

const FAVORITES_LOAD_ERROR = 'Could not load favorite foods.';
const FAVORITES_SAVE_ERROR = 'Could not save favorite foods.';

export function useNutritionFavoriteFoods() {
  const { ready: authReady, user } = useAuthSession();
  const ownerId = authReady ? user?.id ?? null : undefined;
  const storageKey = useMemo(
    () => (ownerId === undefined ? null : getNutritionFavoritesStorageKey(ownerId)),
    [ownerId],
  );
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setFavoriteIds([]);
      setHydrated(false);
      setError(null);
      return;
    }

    let active = true;
    setFavoriteIds([]);
    setHydrated(false);
    setError(null);

    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!active) return;
        setFavoriteIds(parseNutritionFavoriteIds(raw));
        setHydrated(true);
      })
      .catch(() => {
        if (!active) return;
        setFavoriteIds([]);
        setHydrated(true);
        setError(FAVORITES_LOAD_ERROR);
      });

    return () => {
      active = false;
    };
  }, [storageKey]);

  const toggleFavorite = useCallback(
    (foodId: string) => {
      if (!storageKey || !hydrated) return;

      setFavoriteIds((current) => {
        const next = toggleNutritionFavoriteId(current, foodId);
        void AsyncStorage.setItem(storageKey, serializeNutritionFavoriteIds(next)).catch(() => {
          setError(FAVORITES_SAVE_ERROR);
        });
        return next;
      });
    },
    [hydrated, storageKey],
  );

  return {
    error,
    favoriteIds,
    hydrated,
    toggleFavorite,
  };
}