import type { ExpoConfig } from 'expo/config';
import { describe, expect, it } from 'vitest';

import {
  PASSWORD_RESET_APP_LINK_ENV,
  PASSWORD_RESET_ROUTE_PATH,
  parsePasswordResetAppLink,
  withPasswordResetAppLink,
} from '../../app.config';

const baseConfig = (): ExpoConfig => ({
  name: 'smart-fitness-app',
  slug: 'smart-fitness-app',
  ios: {
    bundleIdentifier: 'com.dzahard28.smartfitnessapp',
    associatedDomains: ['applinks:existing.smartfitness.test'],
  },
  android: {
    package: 'com.dzahard28.smartfitnessapp',
    intentFilters: [
      {
        action: 'VIEW',
        category: ['BROWSABLE', 'DEFAULT'],
        data: [{ scheme: 'smartfitnessapp' }],
      },
    ],
  },
});

describe('password reset app-link configuration', () => {
  it('preserves the safe disabled default when no build value is present', () => {
    const config = baseConfig();

    expect(withPasswordResetAppLink(config, undefined)).toBe(config);
    expect(parsePasswordResetAppLink('   ')).toBeNull();
  });

  it('accepts only the exact trusted HTTPS reset route', () => {
    expect(
      parsePasswordResetAppLink(
        'https://links.smartfitness.test/auth/reset-password',
      ),
    ).toEqual({
      baseUrl: 'https://links.smartfitness.test/auth/reset-password',
      hostname: 'links.smartfitness.test',
      path: PASSWORD_RESET_ROUTE_PATH,
    });
  });

  it.each([
    'http://links.smartfitness.test/auth/reset-password',
    'https://localhost/auth/reset-password',
    'https://127.0.0.1/auth/reset-password',
    'https://links.smartfitness.test:8443/auth/reset-password',
    'https://user@links.smartfitness.test/auth/reset-password',
    'https://links.smartfitness.test/',
    'https://links.smartfitness.test/auth/reset-password/',
    'https://links.smartfitness.test/auth/reset-password?token=preset',
    'https://links.smartfitness.test/auth/reset-password#fragment',
  ])('rejects unsafe or broad configuration without reflecting it: %s', (value) => {
    expect(() => parsePasswordResetAppLink(value)).toThrow(
      `${PASSWORD_RESET_APP_LINK_ENV} must be an exact HTTPS reset route on a DNS hostname`,
    );
  });

  it('adds narrowly scoped iOS and Android native link configuration', () => {
    const configured = withPasswordResetAppLink(
      baseConfig(),
      'https://links.smartfitness.test/auth/reset-password',
    );

    expect(configured.ios?.associatedDomains).toEqual([
      'applinks:existing.smartfitness.test',
      'applinks:links.smartfitness.test',
    ]);
    expect(configured.android?.intentFilters).toEqual([
      {
        action: 'VIEW',
        category: ['BROWSABLE', 'DEFAULT'],
        data: [{ scheme: 'smartfitnessapp' }],
      },
      {
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: [
          {
            scheme: 'https',
            host: 'links.smartfitness.test',
            pathPrefix: PASSWORD_RESET_ROUTE_PATH,
          },
        ],
      },
    ]);
  });

  it('is idempotent for repeated dynamic-config evaluation', () => {
    const first = withPasswordResetAppLink(
      baseConfig(),
      'https://links.smartfitness.test/auth/reset-password',
    );
    const second = withPasswordResetAppLink(
      first,
      'https://links.smartfitness.test/auth/reset-password',
    );

    expect(second).toEqual(first);
  });
});
