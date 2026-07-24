import { useEffect, useState } from 'react';

import {
  autocompleteFoods,
  isFoodApiConfigured,
  searchFoods,
  type FoodItem,
} from '@/api/foods';

import type { PickerMode } from './addFoodModel';

export type FoodProviderSearchStatus = 'idle' | 'debouncing' | 'loading' | 'empty' | 'error';

export function useFoodProviderSearch(mode: PickerMode, query: string) {
  const [backendFoodResults, setBackendFoodResults] = useState<FoodItem[]>([]);
  const [backendFoodSearchStatus, setBackendFoodSearchStatus] =
    useState<FoodProviderSearchStatus>('idle');
  const [foodSuggestions, setFoodSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (mode !== 'food' || !isFoodApiConfigured() || trimmedQuery.length < 2) {
      setBackendFoodResults([]);
      setFoodSuggestions([]);
      setBackendFoodSearchStatus('idle');
      return;
    }

    let active = true;
    setBackendFoodSearchStatus('debouncing');

    const timeout = setTimeout(async () => {
      if (!active) return;
      setBackendFoodSearchStatus('loading');

      const [foodsResult, suggestionsResult] = await Promise.allSettled([
        searchFoods(trimmedQuery),
        autocompleteFoods(trimmedQuery),
      ]);
      if (!active) return;

      if (foodsResult.status === 'fulfilled') {
        const foods = foodsResult.value.slice(0, 8);
        setBackendFoodResults(foods);
        setBackendFoodSearchStatus(foods.length > 0 ? 'idle' : 'empty');
      } else {
        setBackendFoodResults([]);
        setBackendFoodSearchStatus('error');
      }

      if (suggestionsResult.status === 'fulfilled') {
        setFoodSuggestions(
          suggestionsResult.value
            .filter((suggestion) => suggestion.toLowerCase() !== trimmedQuery.toLowerCase())
            .slice(0, 5),
        );
      } else {
        setFoodSuggestions([]);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [mode, query]);

  return {
    backendFoodResults,
    backendFoodSearchStatus,
    foodSuggestions,
    setFoodSuggestions,
  };
}
