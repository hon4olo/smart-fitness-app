import { describe, expect, it } from 'vitest';

import { getLocalAccountDataStorageKeys } from '@/auth/accountDataCleanup';
import { getNutritionFavoritesStorageKey } from '@/features/nutrition/nutritionFavorites';
import { getNutritionFoodLibraryStorageKey } from '@/features/nutrition/nutritionFoodLibrary';
import { getSocialFollowingFeedCacheStorageKey } from '@/features/social/socialFollowingFeedCache';
import * as storageExports from '@/storage';

import {
  ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS,
  MOBILE_ACCOUNT_DATA_SURFACES,
} from './mobileAccountDataInventory';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('node:fs') as {
  readFileSync(path: string, encoding: string): string;
};
const { resolve } = require('node:path') as {
  resolve(...parts: string[]): string;
};

const storageIndexSource = readFileSync(
  resolve(__dirname, '..', 'storage', 'index.ts'),
  'utf8',
);

const exportedStorageKeyNames = Array.from(
  new Set(
    Array.from(
      storageIndexSource.matchAll(/\b([A-Z][A-Z0-9_]*_STORAGE_KEY)\b/gu),
      (match) => match[1] as string,
    ),
  ),
).sort();

const exportedStorageKeyValues = exportedStorageKeyNames.map((name) => {
  const value = (storageExports as Record<string, unknown>)[name];
  if (typeof value !== 'string') {
    throw new Error(`Storage export ${name} is not a string key.`);
  }
  return value;
});

describe('mobile account data inventory', () => {
  it('classifies every persistent key exported by the storage boundary', () => {
    expect(exportedStorageKeyNames.length).toBeGreaterThan(0);
    for (const key of exportedStorageKeyValues) {
      expect(ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS, key).toContain(key);
    }
  });

  it('covers every account-scoped static key in the documented surfaces', () => {
    const inventoriedKeys = new Set(
      MOBILE_ACCOUNT_DATA_SURFACES.flatMap((surface) => surface.storageKeys),
    );
    for (const key of ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS) {
      expect(inventoriedKeys.has(key), key).toBe(true);
    }
  });

  it('uses the inventory as the complete local account cleanup boundary', () => {
    const userId = 'privacy-user';
    const expected = new Set([
      ...ACCOUNT_SCOPED_ASYNC_STORAGE_KEYS,
      getNutritionFavoritesStorageKey(userId),
      getNutritionFoodLibraryStorageKey(userId),
      getSocialFollowingFeedCacheStorageKey(userId),
    ]);
    const actual = getLocalAccountDataStorageKeys(userId);

    expect(new Set(actual)).toEqual(expected);
    expect(actual).toHaveLength(expected.size);
    expect(actual).toContain(
      storageExports.SYNC_CONFLICT_RESOLUTION_INTENT_STORAGE_KEY,
    );
    expect(actual).toContain(storageExports.LOCAL_STATE_DIAGNOSTICS_STORAGE_KEY);
  });

  it('requires explicit purpose, deletion and user-control metadata', () => {
    const ids = new Set<string>();
    for (const surface of MOBILE_ACCOUNT_DATA_SURFACES) {
      expect(ids.has(surface.id), surface.id).toBe(false);
      ids.add(surface.id);
      expect(surface.category.trim()).not.toBe('');
      expect(surface.contains.trim()).not.toBe('');
      expect(surface.purpose.trim()).not.toBe('');
      expect(surface.userControl.trim()).not.toBe('');
    }
  });
});
