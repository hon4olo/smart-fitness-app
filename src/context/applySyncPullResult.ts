import { applyRemoteBodyMeasurementChanges } from '@/cloud/BodyMeasurementRemoteSync';
import { applyRemoteCustomExerciseChanges } from '@/cloud/CustomExerciseRemoteSync';
import {
  applyRemoteFitnessProfileChanges,
  runWithoutFitnessProfileOutbox,
} from '@/cloud/FitnessProfileSync';
import {
  applyRemoteFoodEntryChanges,
  runWithoutFoodEntryOutbox,
} from '@/cloud/FoodEntrySync';
import { applyRemoteMealTemplateChanges } from '@/cloud/MealTemplateRemoteSync';
import {
  applyRemoteNutritionTargetChanges,
  runWithoutNutritionTargetOutbox,
} from '@/cloud/NutritionTargetSync';
import { applyRemoteSafetyRecoveryChanges } from '@/cloud/SafetyRecoverySync';
import { applyRemoteTrainingProgramChanges } from '@/cloud/TrainingProgramRemoteSync';
import { applyRemoteWeightHistoryChanges } from '@/cloud/WeightHistorySync';
import { applyRemoteWorkoutSessionChanges } from '@/cloud/WorkoutSessionSync';
import { applyRemoteWorkoutTemplateChanges } from '@/cloud/WorkoutTemplateSync';
import type {
  createBodyMeasurementSyncMetadataStore,
  createCustomExerciseSyncMetadataStore,
  createFitnessProfileSyncMetadataStore,
  createFoodEntrySyncMetadataStore,
  createMealTemplateSyncMetadataStore,
  createNutritionTargetSyncMetadataStore,
  createSafetyRecoverySyncMetadataStore,
  createTrainingProgramSyncMetadataStore,
  createWorkoutSessionSyncMetadataStore,
  createWorkoutTemplateSyncMetadataStore,
  getDefaultSyncCursorStore,
} from '@/storage';
import type { WeightSyncMetadataStore } from '@/storage/WeightSyncMetadataStore';
import type { AppState } from '@/types';

import {
  hasUnsupportedRemoteEntities,
  type RemoteChangedEntity,
  type RemoteDeletedEntity,
  resolvePulledRevision,
  saveWeightMetadataRecords,
  type SyncPullResult,
} from './syncContextModel';

type ApplySyncPullResultOptions = {
  bodyMeasurementMetadataStore: ReturnType<
    typeof createBodyMeasurementSyncMetadataStore
  >;
  cursorStore: ReturnType<typeof getDefaultSyncCursorStore>;
  customExerciseMetadataStore: ReturnType<typeof createCustomExerciseSyncMetadataStore>;
  fitnessProfileMetadataStore: ReturnType<typeof createFitnessProfileSyncMetadataStore>;
  foodEntryMetadataStore: ReturnType<typeof createFoodEntrySyncMetadataStore>;
  mealTemplateMetadataStore: ReturnType<typeof createMealTemplateSyncMetadataStore>;
  metadataStore: WeightSyncMetadataStore;
  nextConflictCount: number;
  nutritionTargetMetadataStore: ReturnType<typeof createNutritionTargetSyncMetadataStore>;
  pullResult: SyncPullResult;
  replaceState(nextState: AppState): void;
  safetyRecoveryMetadataStore: ReturnType<typeof createSafetyRecoverySyncMetadataStore>;
  session: {
    device: { id: string };
    user: { id: string };
  };
  state: AppState;
  trainingProgramMetadataStore: ReturnType<typeof createTrainingProgramSyncMetadataStore>;
  workoutSessionMetadataStore: ReturnType<typeof createWorkoutSessionSyncMetadataStore>;
  workoutTemplateMetadataStore: ReturnType<typeof createWorkoutTemplateSyncMetadataStore>;
};

const replaceMetadataRecords = async <RecordType>(
  store: {
    clear(): Promise<unknown>;
    set(record: RecordType): Promise<unknown>;
  },
  records: RecordType[],
): Promise<void> => {
  await store.clear();
  for (const record of records) {
    await store.set(record);
  }
};

export async function applySyncPullResult({
  bodyMeasurementMetadataStore,
  cursorStore,
  customExerciseMetadataStore,
  fitnessProfileMetadataStore,
  foodEntryMetadataStore,
  mealTemplateMetadataStore,
  metadataStore,
  nextConflictCount,
  nutritionTargetMetadataStore,
  pullResult,
  replaceState,
  safetyRecoveryMetadataStore,
  session,
  state,
  trainingProgramMetadataStore,
  workoutSessionMetadataStore,
  workoutTemplateMetadataStore,
}: ApplySyncPullResultOptions): Promise<void> {
  const syncedAt = pullResult.serverTimestamp ?? new Date().toISOString();
  const changedEntities = (pullResult.changedEntities ?? []) as RemoteChangedEntity[];
  const nonDeletedChangedEntities = changedEntities.filter(
    (entity) => entity.operationType !== 'delete',
  );
  const deletedEntities = (pullResult.deletedEntities ?? []) as RemoteDeletedEntity[];

  const weightChanges = applyRemoteWeightHistoryChanges(
    state,
    nonDeletedChangedEntities,
    deletedEntities,
    await metadataStore.load(),
    syncedAt,
  );
  const bodyMeasurementChanges = applyRemoteBodyMeasurementChanges(
    weightChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    await bodyMeasurementMetadataStore.load(),
    syncedAt,
  );
  const customExerciseChanges = applyRemoteCustomExerciseChanges(
    bodyMeasurementChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    await customExerciseMetadataStore.load(),
    syncedAt,
  );
  const workoutSessionChanges = applyRemoteWorkoutSessionChanges(
    customExerciseChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    await workoutSessionMetadataStore.load(),
    syncedAt,
  );
  const workoutTemplateChanges = applyRemoteWorkoutTemplateChanges(
    workoutSessionChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    await workoutTemplateMetadataStore.load(),
    syncedAt,
  );
  const trainingProgramChanges = applyRemoteTrainingProgramChanges(
    workoutTemplateChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    await trainingProgramMetadataStore.load(),
    syncedAt,
  );
  const safetyRecoveryChanges = applyRemoteSafetyRecoveryChanges(
    trainingProgramChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    await safetyRecoveryMetadataStore.load(),
    syncedAt,
  );
  const foodEntryChanges = applyRemoteFoodEntryChanges(
    safetyRecoveryChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    await foodEntryMetadataStore.load(),
    syncedAt,
  );
  const mealTemplateChanges = applyRemoteMealTemplateChanges(
    foodEntryChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    await mealTemplateMetadataStore.load(),
    syncedAt,
  );
  const nutritionTargetChanges = applyRemoteNutritionTargetChanges(
    mealTemplateChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    await nutritionTargetMetadataStore.load(),
    syncedAt,
  );
  const fitnessProfileChanges = applyRemoteFitnessProfileChanges(
    nutritionTargetChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    await fitnessProfileMetadataStore.load(),
    syncedAt,
  );

  runWithoutFoodEntryOutbox(() =>
    runWithoutNutritionTargetOutbox(() =>
      runWithoutFitnessProfileOutbox(() => replaceState(fitnessProfileChanges.nextState)),
    ),
  );

  await saveWeightMetadataRecords(
    metadataStore,
    new Map(weightChanges.metadata.map((record) => [record.id, record])),
  );
  await replaceMetadataRecords(bodyMeasurementMetadataStore, bodyMeasurementChanges.metadata);
  await replaceMetadataRecords(customExerciseMetadataStore, customExerciseChanges.metadata);
  await replaceMetadataRecords(workoutSessionMetadataStore, workoutSessionChanges.metadata);
  await replaceMetadataRecords(workoutTemplateMetadataStore, workoutTemplateChanges.metadata);
  await replaceMetadataRecords(trainingProgramMetadataStore, trainingProgramChanges.metadata);
  await replaceMetadataRecords(safetyRecoveryMetadataStore, safetyRecoveryChanges.metadata);
  await replaceMetadataRecords(foodEntryMetadataStore, foodEntryChanges.metadata);
  await replaceMetadataRecords(mealTemplateMetadataStore, mealTemplateChanges.metadata);
  await replaceMetadataRecords(nutritionTargetMetadataStore, nutritionTargetChanges.metadata);
  await replaceMetadataRecords(fitnessProfileMetadataStore, fitnessProfileChanges.metadata);

  const handledOperationCount =
    weightChanges.appliedRecordIds.length +
    weightChanges.deletedRecordIds.length +
    bodyMeasurementChanges.appliedRecordIds.length +
    bodyMeasurementChanges.deletedRecordIds.length +
    customExerciseChanges.appliedRecordIds.length +
    customExerciseChanges.deletedRecordIds.length +
    workoutSessionChanges.appliedRecordIds.length +
    workoutSessionChanges.deletedRecordIds.length +
    workoutTemplateChanges.appliedRecordIds.length +
    workoutTemplateChanges.deletedRecordIds.length +
    trainingProgramChanges.appliedRecordIds.length +
    trainingProgramChanges.deletedRecordIds.length +
    safetyRecoveryChanges.appliedRecordIds.length +
    safetyRecoveryChanges.deletedRecordIds.length +
    foodEntryChanges.appliedRecordIds.length +
    foodEntryChanges.deletedRecordIds.length +
    mealTemplateChanges.appliedRecordIds.length +
    mealTemplateChanges.deletedRecordIds.length +
    nutritionTargetChanges.appliedRecordIds.length +
    nutritionTargetChanges.deletedRecordIds.length +
    fitnessProfileChanges.appliedRecordIds.length +
    fitnessProfileChanges.deletedRecordIds.length;
  const pulledRevision = resolvePulledRevision(pullResult);

  if (
    pulledRevision !== null &&
    nextConflictCount === 0 &&
    !hasUnsupportedRemoteEntities(pullResult) &&
    handledOperationCount === pullResult.operations.length
  ) {
    await cursorStore.set({
      userId: session.user.id,
      deviceId: session.device.id,
      serverRevision: pulledRevision,
      lastSyncedAt: syncedAt,
    });
  }
}
