import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

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
import type { ScheduleAppStateMutation } from './useAppMutationQueue';

type NutritionStateActionsOptions = {
  scheduleStateMutation: ScheduleAppStateMutation;
  setState: Dispatch<SetStateAction<AppState>>;
};

export function useNutritionStateActions({
  scheduleStateMutation,
  setState,
}: NutritionStateActionsOptions) {
  const addFoodEntry = useCallback(
    (entry: FoodEntry) => {
      setState((currentState) => {
        const foodEntry = normalizeFoodEntry(entry, new Date().toISOString());
        const nextState = addFoodEntryToState(currentState, foodEntry);
        scheduleStateMutation({ label: 'Save food entry', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const addFoodEntries = useCallback(
    (entries: FoodEntry[]) => {
      setState((currentState) => {
        const normalizedEntries = entries.map((entry) =>
          normalizeFoodEntry(entry, new Date().toISOString()),
        );
        const nextState = addFoodEntriesToState(currentState, normalizedEntries);
        scheduleStateMutation({ label: 'Save food entries', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
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
        scheduleStateMutation({ label: 'Save meal template', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
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
        scheduleStateMutation({ label: 'Update food entry', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const deleteFoodEntry = useCallback(
    (entryId: string) => {
      setState((currentState) => {
        const entry = currentState.foodEntries.find((item) => item.id === entryId);
        if (!entry) return currentState;
        const nextState = deleteFoodEntryFromState(currentState, entry);
        scheduleStateMutation({ label: 'Delete food entry', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
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
        scheduleStateMutation({ label: 'Delete meal template', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
  );

  const updateNutritionTargets = useCallback(
    (targets: NutritionTargets) => {
      setState((currentState) => {
        const nextState = { ...currentState, nutritionTargets: targets };
        scheduleStateMutation({ label: 'Save nutrition targets', nextState });
        return nextState;
      });
    },
    [scheduleStateMutation, setState],
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
