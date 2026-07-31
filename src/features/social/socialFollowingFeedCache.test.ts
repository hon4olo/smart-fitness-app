import { describe, expect, it } from 'vitest';

import type { SocialWorkoutPostDto } from '@/api/social';
import type { StorageAdapter } from '@/storage';

import {
  createSocialFollowingFeedCacheStore,
  getSocialFollowingFeedCacheStorageKey,
  SOCIAL_FOLLOWING_FEED_CACHE_MAX_AGE_MS,
  SOCIAL_FOLLOWING_FEED_CACHE_MAX_BYTES,
  SOCIAL_FOLLOWING_FEED_CACHE_MAX_ITEMS,
} from './socialFollowingFeedCache';

const createMemoryStorage = (): StorageAdapter & {
  values: Map<string, string>;
} => {
  const values = new Map<string, string>();
  return {
    values,
    async read(key) {
      return values.get(key) ?? null;
    },
    async write(key, value) {
      values.set(key, value);
    },
    async remove(key) {
      values.delete(key);
    },
  };
};

const postId = (index: number): string =>
  `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;

const buildPost = (
  index: number,
  options: { large?: boolean } = {},
): SocialWorkoutPostDto => ({
  schemaVersion: 1,
  id: postId(index),
  author: {
    schemaVersion: 1,
    username: `athlete_${index}`,
    displayName: `Athlete ${index}`,
    bio: null,
    avatarUrl: null,
    visibility: 'public',
    createdAt: '2026-07-31T10:00:00.000Z',
    updatedAt: '2026-07-31T10:00:00.000Z',
  },
  caption: `Workout ${index}`,
  workout: {
    schemaVersion: 1,
    title: `Workout ${index}`,
    exercises: options.large
      ? Array.from({ length: 100 }, (_, exerciseIndex) => ({
          name: `${exerciseIndex}-${'x'.repeat(190)}`,
          sets: Array.from({ length: 10 }, (_, setIndex) => ({
            weight: 100 + setIndex,
            reps: 10,
            rpe: 8,
          })),
        }))
      : [{ name: 'Squat', sets: [{ weight: 100, reps: 5, rpe: 8 }] }],
  },
  createdAt: `2026-07-31T10:${(index % 60)
    .toString()
    .padStart(2, '0')}:00.000Z`,
});

describe('Social following feed cache', () => {
  it('stores only the bounded first page and isolates accounts', async () => {
    const storage = createMemoryStorage();
    const store = createSocialFollowingFeedCacheStore(storage);
    const now = Date.parse('2026-07-31T12:00:00.000Z');

    await store.save(
      'account-a',
      Array.from({ length: 25 }, (_, index) => buildPost(index + 1)),
      now,
    );

    const cached = await store.load('account-a', now);
    expect(cached?.items).toHaveLength(SOCIAL_FOLLOWING_FEED_CACHE_MAX_ITEMS);
    expect(cached?.items[0]?.id).toBe(postId(1));
    expect(cached?.items.at(-1)?.id).toBe(postId(20));
    expect(await store.load('account-b', now)).toBeNull();
    expect(storage.values.has(getSocialFollowingFeedCacheStorageKey('account-a'))).toBe(
      true,
    );
  });

  it('expires cache fail-closed and removes the stale envelope', async () => {
    const storage = createMemoryStorage();
    const store = createSocialFollowingFeedCacheStore(storage);
    const now = Date.parse('2026-07-31T12:00:00.000Z');
    const key = getSocialFollowingFeedCacheStorageKey('account-a');

    await store.save('account-a', [buildPost(1)], now);
    expect(
      await store.load(
        'account-a',
        now + SOCIAL_FOLLOWING_FEED_CACHE_MAX_AGE_MS,
      ),
    ).not.toBeNull();
    expect(
      await store.load(
        'account-a',
        now + SOCIAL_FOLLOWING_FEED_CACHE_MAX_AGE_MS + 1,
      ),
    ).toBeNull();
    expect(storage.values.has(key)).toBe(false);
  });

  it('rejects malformed, cross-account, duplicate, and unknown-field data', async () => {
    const storage = createMemoryStorage();
    const store = createSocialFollowingFeedCacheStore(storage);
    const now = Date.parse('2026-07-31T12:00:00.000Z');
    const key = getSocialFollowingFeedCacheStorageKey('account-a');

    const writeAndReject = async (value: unknown) => {
      storage.values.set(key, JSON.stringify(value));
      expect(await store.load('account-a', now)).toBeNull();
      expect(storage.values.has(key)).toBe(false);
    };

    await writeAndReject({
      schemaVersion: 1,
      accountId: 'account-b',
      cachedAt: new Date(now).toISOString(),
      items: [buildPost(1)],
    });
    await writeAndReject({
      schemaVersion: 1,
      accountId: 'account-a',
      cachedAt: new Date(now).toISOString(),
      items: [buildPost(1), buildPost(1)],
    });
    await writeAndReject({
      schemaVersion: 1,
      accountId: 'account-a',
      cachedAt: new Date(now).toISOString(),
      items: [{ ...buildPost(1), privateField: 'not allowed' }],
    });
  });

  it('trims oversized pages to the byte ceiling while retaining valid posts', async () => {
    const storage = createMemoryStorage();
    const store = createSocialFollowingFeedCacheStore(storage);
    const now = Date.parse('2026-07-31T12:00:00.000Z');
    const key = getSocialFollowingFeedCacheStorageKey('account-large');

    await store.save(
      'account-large',
      Array.from({ length: 20 }, (_, index) =>
        buildPost(index + 1, { large: true }),
      ),
      now,
    );

    const raw = storage.values.get(key);
    expect(raw).toBeDefined();
    expect(new TextEncoder().encode(raw).byteLength).toBeLessThanOrEqual(
      SOCIAL_FOLLOWING_FEED_CACHE_MAX_BYTES,
    );
    const cached = await store.load('account-large', now);
    expect(cached?.items.length).toBeGreaterThan(0);
    expect(cached?.items.length).toBeLessThan(20);
  });

  it('treats storage failures as non-critical and removes empty feeds', async () => {
    const storage: StorageAdapter = {
      async read() {
        throw new Error('read failed');
      },
      async write() {
        throw new Error('write failed');
      },
      async remove() {
        throw new Error('remove failed');
      },
    };
    const store = createSocialFollowingFeedCacheStore(storage);

    await expect(store.load('account-a')).resolves.toBeNull();
    await expect(store.save('account-a', [buildPost(1)])).resolves.toBeUndefined();
    await expect(store.remove('account-a')).resolves.toBeUndefined();
  });
});
