import { afterEach, describe, expect, it } from 'vitest';

import {
  PRODUCTION_API_BASE_URL,
  getMobileApiBaseUrl,
  normalizeMobileApiBaseUrl,
} from './config';

const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const originalFoodApiBaseUrl = process.env.EXPO_PUBLIC_FOOD_API_BASE_URL;

const restoreEnv = (key: 'EXPO_PUBLIC_API_BASE_URL' | 'EXPO_PUBLIC_FOOD_API_BASE_URL', value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

afterEach(() => {
  restoreEnv('EXPO_PUBLIC_API_BASE_URL', originalApiBaseUrl);
  restoreEnv('EXPO_PUBLIC_FOOD_API_BASE_URL', originalFoodApiBaseUrl);
});

describe('mobile API configuration', () => {
  it('uses the production API when no override is configured', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    delete process.env.EXPO_PUBLIC_FOOD_API_BASE_URL;

    expect(getMobileApiBaseUrl()).toBe(PRODUCTION_API_BASE_URL);
  });

  it('prefers the shared API override and removes trailing slashes', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://staging-api.peptonio.com///';
    process.env.EXPO_PUBLIC_FOOD_API_BASE_URL = 'https://legacy.peptonio.com';

    expect(getMobileApiBaseUrl()).toBe('https://staging-api.peptonio.com');
  });

  it('keeps the legacy food override as a temporary fallback', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    process.env.EXPO_PUBLIC_FOOD_API_BASE_URL = 'https://legacy.peptonio.com/';

    expect(getMobileApiBaseUrl()).toBe('https://legacy.peptonio.com');
  });

  it('rejects non-HTTPS API URLs', () => {
    expect(() => normalizeMobileApiBaseUrl('http://localhost:3000')).toThrow(
      'API base URL must use HTTPS',
    );
  });
});
