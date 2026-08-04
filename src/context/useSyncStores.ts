import { useMemo } from 'react';

import {
  createAsyncStorageAdapter,
  createBodyMeasurementSyncMetadataStore,
  createCustomExerciseSyncMetadataStore,
  createFitnessProfileSyncMetadataStore,
  createFoodEntrySyncMetadataStore,
  createMealTemplateSyncMetadataStore,
  createNutritionTargetSyncMetadataStore,
  createSafetyRecoverySyncMetadataStore,
  createSyncConflictResolutionIntentStore,
  createSyncConflictStore,
  createTrainingProgramSyncMetadataStore,
  createWorkoutSessionSyncMetadataStore,
  createWorkoutTemplateSyncMetadataStore,
  getDefaultSyncCursorStore,
} from '@/storage';

export function useSyncStores() {
  const cursorStore = useMemo(() => getDefaultSyncCursorStore(), []);
  const syncStorage = useMemo(() => createAsyncStorageAdapter(), []);
  const conflictStore = useMemo(() => createSyncConflictStore(syncStorage), [syncStorage]);
  const conflictResolutionIntentStore = useMemo(
    () => createSyncConflictResolutionIntentStore(syncStorage),
    [syncStorage],
  );
  const bodyMeasurementMetadataStore = useMemo(
    () => createBodyMeasurementSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const workoutSessionMetadataStore = useMemo(
    () => createWorkoutSessionSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const workoutTemplateMetadataStore = useMemo(
    () => createWorkoutTemplateSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const trainingProgramMetadataStore = useMemo(
    () => createTrainingProgramSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const customExerciseMetadataStore = useMemo(
    () => createCustomExerciseSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const foodEntryMetadataStore = useMemo(
    () => createFoodEntrySyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const mealTemplateMetadataStore = useMemo(
    () => createMealTemplateSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const nutritionTargetMetadataStore = useMemo(
    () => createNutritionTargetSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const fitnessProfileMetadataStore = useMemo(
    () => createFitnessProfileSyncMetadataStore(syncStorage),
    [syncStorage],
  );
  const safetyRecoveryMetadataStore = useMemo(
    () => createSafetyRecoverySyncMetadataStore(syncStorage),
    [syncStorage],
  );

  return {
    bodyMeasurementMetadataStore,
    conflictResolutionIntentStore,
    conflictStore,
    cursorStore,
    customExerciseMetadataStore,
    fitnessProfileMetadataStore,
    foodEntryMetadataStore,
    mealTemplateMetadataStore,
    nutritionTargetMetadataStore,
    safetyRecoveryMetadataStore,
    trainingProgramMetadataStore,
    workoutSessionMetadataStore,
    workoutTemplateMetadataStore,
  };
}
