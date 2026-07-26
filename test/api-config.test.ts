import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PRODUCTION_API_BASE_URL, getMobileApiBaseUrl } from '@/api';

describe('mobile api config', () => {
  beforeEach(() => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', '');
    vi.stubEnv('EXPO_PUBLIC_FOOD_API_BASE_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to the production api base url when no environment value is configured', () => {
    expect(getMobileApiBaseUrl()).toBe(PRODUCTION_API_BASE_URL);
  });

  it('uses a valid EXPO_PUBLIC_API_BASE_URL', () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'https://staging.peptonio.com');

    expect(getMobileApiBaseUrl()).toBe('https://staging.peptonio.com');
  });

  it('ignores EXPO_PUBLIC_FOOD_API_BASE_URL when the shared API base URL is absent', () => {
    vi.stubEnv('EXPO_PUBLIC_FOOD_API_BASE_URL', 'https://legacy-food.example.com');

    expect(getMobileApiBaseUrl()).toBe(PRODUCTION_API_BASE_URL);
  });

  it('normalizes trailing slashes from EXPO_PUBLIC_API_BASE_URL', () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'https://api.peptonio.com///');

    expect(getMobileApiBaseUrl()).toBe(PRODUCTION_API_BASE_URL);
  });

  it('rejects a non-HTTPS EXPO_PUBLIC_API_BASE_URL', () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'http://api.peptonio.com');

    expect(() => getMobileApiBaseUrl()).toThrow(/HTTPS/);
  });
});
