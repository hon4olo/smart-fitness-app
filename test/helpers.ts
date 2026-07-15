import { vi } from 'vitest';

import type { StorageAdapter } from '@/storage';

export const createMemoryStorage = (seed: Record<string, string> = {}) => {
  const map = new Map<string, string>(Object.entries(seed));

  const storage: StorageAdapter & { dump(): Record<string, string> } = {
    read: vi.fn(async (key: string) => map.get(key) ?? null),
    write: vi.fn(async (key: string, value: string) => {
      map.set(key, value);
    }),
    remove: vi.fn(async (key: string) => {
      map.delete(key);
    }),
    dump: () => Object.fromEntries(map.entries()),
  };

  return storage;
};

export const createJwt = (payload: Record<string, unknown>) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (value: unknown) => {
    const json = JSON.stringify(value);
    return btoa(json).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  return `${encode(header)}.${encode(payload)}.signature`;
};
