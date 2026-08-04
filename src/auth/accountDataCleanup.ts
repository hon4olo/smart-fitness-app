import { getNutritionFavoritesStorageKey } from '@/features/nutrition/nutritionFavorites';
import { getNutritionFoodLibraryStorageKey } from '@/features/nutrition/nutritionFoodLibrary';
import { getSocialFollowingFeedCacheStorageKey } from '@/features/social/socialFollowingFeedCache';
import { ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS } from '@/privacy/mobileAccountDataStorageKeys';
import type { StorageAdapter } from '@/storage';

// This marker is stored in Expo SecureStore on native builds. SecureStore keys may
// contain only alphanumeric characters, `.`, `-`, and `_`.
export const PENDING_ACCOUNT_CLEANUP_STORAGE_KEY =
  'smart_fitness_pending_account_cleanup';

const STATIC_ACCOUNT_DATA_KEYS = ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS;

type PendingAccountCleanup = {
  userId: string;
  requestedAt: string;
};

export const getLocalAccountDataStorageKeys = (userId: string): string[] =>
  Array.from(
    new Set([
      ...STATIC_ACCOUNT_DATA_KEYS,
      getNutritionFavoritesStorageKey(userId),
      getNutritionFoodLibraryStorageKey(userId),
      getSocialFollowingFeedCacheStorageKey(userId),
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

const parsePendingCleanup = (raw: string | null): PendingAccountCleanup | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingAccountCleanup>;
    return typeof parsed.userId === 'string' && parsed.userId.trim()
      ? {
          userId: parsed.userId.trim(),
          requestedAt:
            typeof parsed.requestedAt === 'string'
              ? parsed.requestedAt
              : new Date(0).toISOString(),
        }
      : null;
  } catch {
    return null;
  }
};

const removeAccountDataKeys = async (
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

export const clearLocalAccountData = async (
  storage: StorageAdapter,
  userId: string,
  markerStorage: StorageAdapter = storage,
): Promise<void> => {
  let markerWritten = false;
  try {
    await markerStorage.write(
      PENDING_ACCOUNT_CLEANUP_STORAGE_KEY,
      JSON.stringify({ userId, requestedAt: new Date().toISOString() }),
    );
    markerWritten = true;
  } catch {
    // Continue deleting the actual account data even if the recovery marker cannot be written.
  }

  try {
    await removeAccountDataKeys(storage, userId);
  } catch (error) {
    if (markerWritten) throw error;
    if (error instanceof AccountDataCleanupError) {
      throw new AccountDataCleanupError([
        PENDING_ACCOUNT_CLEANUP_STORAGE_KEY,
        ...error.failedKeys,
      ]);
    }
    throw error;
  }
};

export const completeLocalAccountCleanup = async (
  markerStorage: StorageAdapter,
): Promise<void> => {
  await markerStorage.remove(PENDING_ACCOUNT_CLEANUP_STORAGE_KEY);
};

export const resumePendingLocalAccountCleanup = async (
  storage: StorageAdapter,
  markerStorage: StorageAdapter = storage,
): Promise<boolean> => {
  const raw = await markerStorage.read(PENDING_ACCOUNT_CLEANUP_STORAGE_KEY);
  if (!raw) return false;

  const pending = parsePendingCleanup(raw);
  if (!pending) {
    await markerStorage.remove(PENDING_ACCOUNT_CLEANUP_STORAGE_KEY);
    return false;
  }

  await removeAccountDataKeys(storage, pending.userId);
  return true;
};
