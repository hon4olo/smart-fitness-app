import {
  parseSocialWorkoutPostDto,
  type SocialWorkoutPostDto,
} from '@/api/social';
import {
  createAsyncStorageAdapter,
  type StorageAdapter,
  utf8ByteLength,
} from '@/storage';

export const SOCIAL_FOLLOWING_FEED_CACHE_SCHEMA_VERSION = 1 as const;
export const SOCIAL_FOLLOWING_FEED_CACHE_MAX_ITEMS = 20;
export const SOCIAL_FOLLOWING_FEED_CACHE_MAX_BYTES = 512 * 1024;
export const SOCIAL_FOLLOWING_FEED_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

const STORAGE_PREFIX = 'smart-fitness:social-following-feed-cache:v1';
const MAX_ACCOUNT_ID_LENGTH = 128;
const MAX_FUTURE_CLOCK_SKEW_MS = 60_000;

type StoredSocialFollowingFeedCache = {
  schemaVersion: typeof SOCIAL_FOLLOWING_FEED_CACHE_SCHEMA_VERSION;
  accountId: string;
  cachedAt: string;
  items: SocialWorkoutPostDto[];
};

export type SocialFollowingFeedCacheSnapshot = {
  cachedAt: string;
  items: SocialWorkoutPostDto[];
};

export type SocialFollowingFeedCacheStore = {
  load(
    accountId: string,
    nowMs?: number,
  ): Promise<SocialFollowingFeedCacheSnapshot | null>;
  save(
    accountId: string,
    items: SocialWorkoutPostDto[],
    nowMs?: number,
  ): Promise<void>;
  remove(accountId: string): Promise<void>;
};

const normalizeAccountId = (value: string): string | null => {
  const accountId = value.trim();
  return accountId.length >= 1 && accountId.length <= MAX_ACCOUNT_ID_LENGTH
    ? accountId
    : null;
};

export const getSocialFollowingFeedCacheStorageKey = (
  accountId: string,
): string => {
  const normalized = normalizeAccountId(accountId);
  if (!normalized) throw new Error('Invalid Social following feed cache account');
  return `${STORAGE_PREFIX}:${encodeURIComponent(normalized)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value);
  return (
    actual.length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
};

const parseStoredCache = (
  raw: string,
  accountId: string,
  nowMs: number,
): SocialFollowingFeedCacheSnapshot | null => {
  if (utf8ByteLength(raw) > SOCIAL_FOLLOWING_FEED_CACHE_MAX_BYTES) return null;

  try {
    const value = JSON.parse(raw) as unknown;
    if (
      !isRecord(value) ||
      !hasExactKeys(value, ['schemaVersion', 'accountId', 'cachedAt', 'items']) ||
      value.schemaVersion !== SOCIAL_FOLLOWING_FEED_CACHE_SCHEMA_VERSION ||
      value.accountId !== accountId ||
      typeof value.cachedAt !== 'string' ||
      !Array.isArray(value.items) ||
      value.items.length < 1 ||
      value.items.length > SOCIAL_FOLLOWING_FEED_CACHE_MAX_ITEMS
    ) {
      return null;
    }

    const cachedAtMs = Date.parse(value.cachedAt);
    if (
      Number.isNaN(cachedAtMs) ||
      cachedAtMs > nowMs + MAX_FUTURE_CLOCK_SKEW_MS ||
      nowMs - cachedAtMs > SOCIAL_FOLLOWING_FEED_CACHE_MAX_AGE_MS
    ) {
      return null;
    }

    const items = value.items.map((item) => parseSocialWorkoutPostDto(item));
    if (new Set(items.map((item) => item.id)).size !== items.length) return null;
    return { cachedAt: new Date(cachedAtMs).toISOString(), items };
  } catch {
    return null;
  }
};

const serializeBoundedCache = (
  accountId: string,
  items: SocialWorkoutPostDto[],
  nowMs: number,
): string | null => {
  const parsedItems = items
    .slice(0, SOCIAL_FOLLOWING_FEED_CACHE_MAX_ITEMS)
    .map((item) => parseSocialWorkoutPostDto(item));
  const uniqueItems = parsedItems.filter(
    (item, index) => parsedItems.findIndex((candidate) => candidate.id === item.id) === index,
  );
  const cachedAt = new Date(nowMs).toISOString();

  while (uniqueItems.length > 0) {
    const raw = JSON.stringify({
      schemaVersion: SOCIAL_FOLLOWING_FEED_CACHE_SCHEMA_VERSION,
      accountId,
      cachedAt,
      items: uniqueItems,
    } satisfies StoredSocialFollowingFeedCache);
    if (utf8ByteLength(raw) <= SOCIAL_FOLLOWING_FEED_CACHE_MAX_BYTES) return raw;
    uniqueItems.pop();
  }
  return null;
};

export const createSocialFollowingFeedCacheStore = (
  storage: StorageAdapter,
): SocialFollowingFeedCacheStore => ({
  async load(accountId, nowMs = Date.now()) {
    const normalized = normalizeAccountId(accountId);
    if (!normalized) return null;
    const key = getSocialFollowingFeedCacheStorageKey(normalized);
    try {
      const raw = await storage.read(key);
      if (!raw) return null;
      const parsed = parseStoredCache(raw, normalized, nowMs);
      if (!parsed) await storage.remove(key).catch(() => undefined);
      return parsed;
    } catch {
      return null;
    }
  },

  async save(accountId, items, nowMs = Date.now()) {
    const normalized = normalizeAccountId(accountId);
    if (!normalized) return;
    const key = getSocialFollowingFeedCacheStorageKey(normalized);
    try {
      const raw = serializeBoundedCache(normalized, items, nowMs);
      if (!raw) {
        await storage.remove(key);
        return;
      }
      await storage.write(key, raw);
    } catch {
      // A responsiveness cache is non-critical and must never break the feed.
    }
  },

  async remove(accountId) {
    const normalized = normalizeAccountId(accountId);
    if (!normalized) return;
    await storage
      .remove(getSocialFollowingFeedCacheStorageKey(normalized))
      .catch(() => undefined);
  },
});

let defaultStore: SocialFollowingFeedCacheStore | null = null;

export const getDefaultSocialFollowingFeedCacheStore = () => {
  defaultStore ??= createSocialFollowingFeedCacheStore(
    createAsyncStorageAdapter(),
  );
  return defaultStore;
};
