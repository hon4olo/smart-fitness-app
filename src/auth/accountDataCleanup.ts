import { getNutritionFavoritesStorageKey } from '@/features/nutrition/nutritionFavorites';
import { getNutritionFoodLibraryStorageKey } from '@/features/nutrition/nutritionFoodLibrary';
import { APP_STATE_STORAGE_KEY } from '@/repositories/LocalAppRepository';
import {
  APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY,
  BODY_MEASUREMENT_SYNC_METADATA_STORAGE_KEY,
  CUSTOM_EXERCISE_SYNC_METADATA_STORAGE_KEY,
  FITNESS_PROFILE_SYNC_METADATA_STORAGE_KEY,
  FOOD_ENTRY_SYNC_METADATA_STORAGE_KEY,
  MEAL_TEMPLATE_SYNC_METADATA_STORAGE_KEY,
  NUTRITION_TARGET_SYNC_METADATA_STORAGE_KEY,
  OFFLINE_SYNC_QUEUE_STORAGE_KEY,
  SAFETY_RECOVERY_REVIEW_STORAGE_KEY,
  SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY,
  SYNC_CONFLICT_STORAGE_KEY,
  SYNC_CURSOR_STORAGE_KEY,
  TRAINING_PROGRAM_SYNC_METADATA_STORAGE_KEY,
  WEIGHT_SYNC_METADATA_STORAGE_KEY,
  WORKOUT_SAFETY_ACKNOWLEDGEMENT_STORAGE_KEY,
  WORKOUT_SESSION_SYNC_METADATA_STORAGE_KEY,
  WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY,
  type StorageAdapter,
} from '@/storage';

const STATIC_ACCOUNT_DATA_KEYS = [
  APP_STATE_STORAGE_KEY,
  APP_MUTATION_OUTBOX_RECOVERY_STORAGE_KEY,
  BODY_MEASUREMENT_SYNC_METADATA_STORAGE_KEY,
  CUSTOM_EXERCISE_SYNC_METADATA_STORAGE_KEY,
  FITNESS_PROFILE_SYNC_METADATA_STORAGE_KEY,
  FOOD_ENTRY_SYNC_METADATA_STORAGE_KEY,
  MEAL_TEMPLATE_SYNC_METADATA_STORAGE_KEY,
  NUTRITION_TARGET_SYNC_METADATA_STORAGE_KEY,
  OFFLINE_SYNC_QUEUE_STORAGE_KEY,
  SAFETY_RECOVERY_REVIEW_STORAGE_KEY,
  SAFETY_RECOVERY_SYNC_METADATA_STORAGE_KEY,
  SYNC_CONFLICT_STORAGE_KEY,
  SYNC_CURSOR_STORAGE_KEY,
  TRAINING_PROGRAM_SYNC_METADATA_STORAGE_KEY,
  WEIGHT_SYNC_METADATA_STORAGE_KEY,
  WORKOUT_SAFETY_ACKNOWLEDGEMENT_STORAGE_KEY,
  WORKOUT_SESSION_SYNC_METADATA_STORAGE_KEY,
  WORKOUT_TEMPLATE_SYNC_METADATA_STORAGE_KEY,
] as const;

export const getLocalAccountDataStorageKeys = (userId: string): string[] =>
  Array.from(
    new Set([
      ...STATIC_ACCOUNT_DATA_KEYS,
      getNutritionFavoritesStorageKey(userId),
      getNutritionFoodLibraryStorageKey(userId),
    ]),
  );

export class AccountDataCleanupError extends Error {
  readonly failedKeys: string[];

  constructor(failedKeys: string[]) {
    super('The account was deleted, but some local data could not be cleared.');
    this.name = 'AccountDataCleanupError';
    this.failedKeys = failedKeys;
  }
}

export const clearLocalAccountData = async (
  storage: StorageAdapter,
  userId: string,
): Promise<void> => {
  const keys = getLocalAccountDataStorageKeys(userId);
  const results = await Promise.allSettled(keys.map((key) => storage.remove(key)));
  const failedKeys = results.flatMap((result, index) =>
    result.status === 'rejected' ? [keys[index] as string] : [],
  );

  if (failedKeys.length > 0) {
    throw new AccountDataCleanupError(failedKeys);
  }
};
