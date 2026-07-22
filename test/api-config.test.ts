import { afterEach, describe, expect, it, vi } from 'vitest';

import { PRODUCTION_API_BASE_URL, getMobileApiBaseUrl, normalizeMobileApiBaseUrl } from '@/api';

describe('mobile api config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to the production api base url', () => {
    expect(getMobileApiBaseUrl()).toBe(PRODUCTION_API_BASE_URL);
  });

  it('uses configured https urls without trailing slashes', () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'https://peptonio.com/');

    expect(getMobileApiBaseUrl()).toBe('https://peptonio.com');
    expect(normalizeMobileApiBaseUrl('https://peptonio.com///')).toBe('https://peptonio.com');
  });

  it('rejects non-https base urls', () => {
    expect(() => normalizeMobileApiBaseUrl('http://peptonio.com')).toThrow(/HTTPS/);
  });
});
