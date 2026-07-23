import type { StorageAdapter } from './StorageAdapter';

/**
 * Non-native fallback used by web and test runtimes.
 *
 * Tokens intentionally remain process-local instead of silently falling back to
 * ordinary browser or AsyncStorage persistence. Native builds resolve the
 * `.native.ts` implementation backed by Expo SecureStore.
 */
export const createSecureTokenStorageAdapter = (): StorageAdapter => {
  const values = new Map<string, string>();

  return {
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
