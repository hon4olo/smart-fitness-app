import { useEffect, useState } from 'react';

import {
  autocompleteFoods,
  isFoodApiConfigured,
  searchFoods,
  type FoodItem,
} from '@/api/foods';

import type { PickerMode } from './addFoodModel';

export type FoodProviderSearchStatus = 'idle' | 'loading' | 'error';

export function useFoodProviderSearch(mode: PickerMode, query: string) {
  const [backendFoodResults, setBackendFoodResults] = useState<FoodItem[]>([]);
  const [backendFoodSearchStatus, setBackendFoodSearchStatus] =
    useState<FoodProviderSearchStatus>('idle');
  const [foodSuggestions, setFoodSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (mode !== 'food' || !isFoodApiConfigured() || trimmedQuery.length < 2) {
      setBackendFoodResults([]);
      setBackendFoodSearchStatus('idle');
      return;
    }

    let active = true;
    setBackendFoodSearchStatus('loading');

    searchFoods(trimmedQuery)
      .then((foods) => {
        if (!active) return;
        setBackendFoodResults(foods.slice(0, 8));
        setBackendFoodSearchStatus('idle');
      })
      .catch(() => {
        if (!active) return;
        setBackendFoodResults([]);
        setBackendFoodSearchStatus('error');
      });

    return () => {
      active = false;
    };
  }, [mode, query]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (mode !== 'food' || !isFoodApiConfigured() || trimmedQuery.length < 2) {
      setFoodSuggestions([]);
      return;
    }

    let active = true;
    const timeout = setTimeout(() => {
      autocompleteFoods(trimmedQuery)
        .then((suggestions) => {
          if (!active) return;
          setFoodSuggestions(
            suggestions
              .filter(
                (suggestion) => suggestion.toLowerCase() !== trimmedQuery.toLowerCase(),
              )
              .slice(0, 5),
          );
        })
        .catch(() => {
          if (active) setFoodSuggestions([]);
        });
    }, 250);

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
