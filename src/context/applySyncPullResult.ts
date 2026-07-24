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
  bodyMeasurementMetadataStore: ReturnType<typeof createBodyMeasurementSyncMetadataStore>;
  cursorStore: ReturnType<typeof getDefaultSyncCursorStore>;
  customExerciseMetadataStore: ReturnType<typeof createCustomExerciseSyncMetadataStore>;
  fitnessProfileMetadataStore: ReturnType<typeof createFitnessProfileSyncMetadataStore>;
  foodEntryMetadataStore: ReturnType<typeof createFoodEntrySyncMetadataStore>;
  getState(): AppState;
  mealTemplateMetadataStore: ReturnType<typeof createMealTemplateSyncMetadataStore>;
  metadataStore: WeightSyncMetadataStore;
  nextConflictCount: number;
  nutritionTargetMetadataStore: ReturnType<typeof createNutritionTargetSyncMetadataStore>;
  pullResult: SyncPullResult;
  replaceState(nextState: AppState): void;
  safetyRecoveryMetadataStore: ReturnType<typeof createSafetyRecoverySyncMetadataStore>;
  session: { device: { id: string }; user: { id: string } };
  trainingProgramMetadataStore: ReturnType<typeof createTrainingProgramSyncMetadataStore>;
  workoutSessionMetadataStore: ReturnType<typeof createWorkoutSessionSyncMetadataStore>;
  workoutTemplateMetadataStore: ReturnType<typeof createWorkoutTemplateSyncMetadataStore>;
};

const replaceMetadataRecords = async <RecordType>(
  store: { clear(): Promise<unknown>; set(record: RecordType): Promise<unknown> },
  records: RecordType[],
): Promise<void> => {
  await store.clear();
  for (const record of records) await store.set(record);
};

export async function applySyncPullResult({
  bodyMeasurementMetadataStore,
  cursorStore,
  customExerciseMetadataStore,
  fitnessProfileMetadataStore,
  foodEntryMetadataStore,
  getState,
  mealTemplateMetadataStore,
  metadataStore,
  nextConflictCount,
  nutritionTargetMetadataStore,
  pullResult,
  replaceState,
  safetyRecoveryMetadataStore,
  session,
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

  const [
    weightMetadata,
    bodyMeasurementMetadata,
    customExerciseMetadata,
    workoutSessionMetadata,
    workoutTemplateMetadata,
    trainingProgramMetadata,
    safetyRecoveryMetadata,
    foodEntryMetadata,
    mealTemplateMetadata,
    nutritionTargetMetadata,
    fitnessProfileMetadata,
  ] = await Promise.all([
    metadataStore.load(),
    bodyMeasurementMetadataStore.load(),
    customExerciseMetadataStore.load(),
    workoutSessionMetadataStore.load(),
    workoutTemplateMetadataStore.load(),
    trainingProgramMetadataStore.load(),
    safetyRecoveryMetadataStore.load(),
    foodEntryMetadataStore.load(),
    mealTemplateMetadataStore.load(),
    nutritionTargetMetadataStore.load(),
    fitnessProfileMetadataStore.load(),
  ]);

  // Read state only after all asynchronous metadata work. A local mutation that lands while
  // pull metadata is loading is therefore included instead of being replaced by a stale snapshot.
  const currentState = getState();
  const weightChanges = applyRemoteWeightHistoryChanges(
    currentState,
    nonDeletedChangedEntities,
    deletedEntities,
    weightMetadata,
    syncedAt,
  );
  const bodyMeasurementChanges = applyRemoteBodyMeasurementChanges(
    weightChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    bodyMeasurementMetadata,
    syncedAt,
  );
  const customExerciseChanges = applyRemoteCustomExerciseChanges(
    bodyMeasurementChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    customExerciseMetadata,
    syncedAt,
  );
  const workoutSessionChanges = applyRemoteWorkoutSessionChanges(
    customExerciseChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    workoutSessionMetadata,
    syncedAt,
  );
  const workoutTemplateChanges = applyRemoteWorkoutTemplateChanges(
    workoutSessionChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    workoutTemplateMetadata,
    syncedAt,
  );
  const trainingProgramChanges = applyRemoteTrainingProgramChanges(
    workoutTemplateChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    trainingProgramMetadata,
    syncedAt,
  );
  const safetyRecoveryChanges = applyRemoteSafetyRecoveryChanges(
    trainingProgramChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    safetyRecoveryMetadata,
    syncedAt,
  );
  const foodEntryChanges = applyRemoteFoodEntryChanges(
    safetyRecoveryChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    foodEntryMetadata,
    syncedAt,
  );
  const mealTemplateChanges = applyRemoteMealTemplateChanges(
    foodEntryChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    mealTemplateMetadata,
    syncedAt,
  );
  const nutritionTargetChanges = applyRemoteNutritionTargetChanges(
    mealTemplateChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    nutritionTargetMetadata,
    syncedAt,
  );
  const fitnessProfileChanges = applyRemoteFitnessProfileChanges(
    nutritionTargetChanges.nextState,
    nonDeletedChangedEntities,
    deletedEntities,
    session.user.id,
    fitnessProfileMetadata,
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

  const handledOperationCount = [
    weightChanges,
    bodyMeasurementChanges,
    customExerciseChanges,
    workoutSessionChanges,
    workoutTemplateChanges,
    trainingProgramChanges,
    safetyRecoveryChanges,
    foodEntryChanges,
    mealTemplateChanges,
    nutritionTargetChanges,
    fitnessProfileChanges,
  ].reduce(
    (total, changes) =>
      total + changes.appliedRecordIds.length + changes.deletedRecordIds.length,
    0,
  );
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
