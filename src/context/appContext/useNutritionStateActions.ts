import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import type { AppRepository } from '@/repositories';
import type {
  AppState,
  FoodEntry,
  MealTemplate,
  NutritionTargets,
} from '@/types';

import {
  addFoodEntriesToState,
  addFoodEntryToState,
  deleteFoodEntryFromState,
  normalizeFoodEntry,
  updateFoodEntryInState,
} from './nutritionActions';

type NutritionStateActionsOptions = {
  repository: AppRepository;
  setState: Dispatch<SetStateAction<AppState>>;
};

export function useNutritionStateActions({
  repository,
  setState,
}: NutritionStateActionsOptions) {
  const addFoodEntry = useCallback(
    (entry: FoodEntry) => {
      setState((currentState) => {
        const foodEntry = normalizeFoodEntry(entry, new Date().toISOString());
        const nextState = addFoodEntryToState(currentState, foodEntry);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository, setState],
  );

  const addFoodEntries = useCallback(
    (entries: FoodEntry[]) => {
      setState((currentState) => {
        const normalizedEntries = entries.map((entry) =>
          normalizeFoodEntry(entry, new Date().toISOString()),
        );
        const nextState = addFoodEntriesToState(currentState, normalizedEntries);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository, setState],
  );

  const addMealTemplate = useCallback(
    (template: MealTemplate) => {
      setState((currentState) => {
        const nextState = {
          ...currentState,
          mealTemplates: [
            {
              ...template,
              createdAt: template.createdAt ?? new Date().toISOString(),
              items: template.items.map((item) => ({ ...item })),
            },
            ...currentState.mealTemplates,
          ],
        };
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository, setState],
  );

  const updateFoodEntry = useCallback(
    (entryId: string, updatedEntry: FoodEntry) => {
      setState((currentState) => {
        const oldEntry = currentState.foodEntries.find((entry) => entry.id === entryId);
        if (!oldEntry) return currentState;

        const foodEntry = normalizeFoodEntry(
          {
            ...updatedEntry,
            id: entryId,
            mealType: updatedEntry.mealType ?? oldEntry.mealType,
            source: updatedEntry.source ?? oldEntry.source,
          },
          oldEntry.createdAt,
        );
        const nextState = updateFoodEntryInState(currentState, entryId, oldEntry, foodEntry);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository, setState],
  );

  const deleteFoodEntry = useCallback(
    (entryId: string) => {
      setState((currentState) => {
        const entry = currentState.foodEntries.find((item) => item.id === entryId);
        if (!entry) return currentState;
        const nextState = deleteFoodEntryFromState(currentState, entry);
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository, setState],
  );

  const deleteMealTemplate = useCallback(
    (templateId: string) => {
      setState((currentState) => {
        const nextState = {
          ...currentState,
          mealTemplates: currentState.mealTemplates.filter(
            (template) => template.id !== templateId,
          ),
        };
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository, setState],
  );

  const updateNutritionTargets = useCallback(
    (targets: NutritionTargets) => {
      setState((currentState) => {
        const nextState = { ...currentState, nutritionTargets: targets };
        void repository.saveState(nextState);
        return nextState;
      });
    },
    [repository, setState],
  );

  return {
    addFoodEntries,
    addFoodEntry,
    addMealTemplate,
    deleteFoodEntry,
    deleteMealTemplate,
    updateFoodEntry,
    updateNutritionTargets,
  };
}
