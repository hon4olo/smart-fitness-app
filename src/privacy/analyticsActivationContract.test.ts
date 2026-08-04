import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_ACTIVATION_CONTRACT_SCHEMA_VERSION,
  ANALYTICS_ACTIVATION_PREREQUISITES,
  ANALYTICS_FORBIDDEN_DATA_CLASSES,
  ANALYTICS_SURFACES,
  evaluateAnalyticsActivation,
} from './analyticsActivationContract';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('node:fs') as {
  readFileSync(path: string, encoding: string): string;
};
const { resolve } = require('node:path') as {
  resolve(...parts: string[]): string;
};

const repositoryRoot = resolve(__dirname, '..', '..');
const readRepositoryFile = (path: string): string =>
  readFileSync(resolve(repositoryRoot, path), 'utf8');

const packageJson = JSON.parse(readRepositoryFile('package.json')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const dependencyNames = Object.keys({
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
}).map((name) => name.toLowerCase());
const packageLockSource = readRepositoryFile('package-lock.json').toLowerCase();
const expoConfigSource = `${readRepositoryFile('app.json')}\n${readRepositoryFile('app.config.ts')}`.toLowerCase();

const DISALLOWED_ANALYTICS_SDK_MARKERS = [
  '@amplitude/analytics-react-native',
  '@datadog/mobile-react-native',
  '@react-native-firebase/analytics',
  '@segment/analytics-react-native',
  '@sentry/react-native',
  '@snowplow/react-native-tracker',
  'appcenter-analytics',
  'expo-firebase-analytics',
  'mixpanel-react-native',
  'posthog-react-native',
  'react-native-adjust',
  'react-native-appsflyer',
  'react-native-fbsdk-next',
] as const;

describe('analytics activation contract', () => {
  it('fails closed with every prerequisite still blocked', () => {
    const evaluation = evaluateAnalyticsActivation();

    expect(evaluation).toEqual({
      schemaVersion: ANALYTICS_ACTIVATION_CONTRACT_SCHEMA_VERSION,
      allowed: false,
      blockerIds: ANALYTICS_ACTIVATION_PREREQUISITES.map(({ id }) => id),
    });
    expect(evaluation.blockerIds.length).toBeGreaterThan(0);
    expect(
      ANALYTICS_ACTIVATION_PREREQUISITES.every(
        ({ status }) => status === 'blocked',
      ),
    ).toBe(true);
  });

  it('requires unique, explicit prerequisite metadata', () => {
    const ids = new Set<string>();
    for (const prerequisite of ANALYTICS_ACTIVATION_PREREQUISITES) {
      expect(ids.has(prerequisite.id), prerequisite.id).toBe(false);
      ids.add(prerequisite.id);
      expect(prerequisite.requirement.trim()).not.toBe('');
    }
  });

  it('keeps every analytics-adjacent surface disabled with zero collection', () => {
    const ids = new Set<string>();
    for (const surface of ANALYTICS_SURFACES) {
      expect(ids.has(surface.id), surface.id).toBe(false);
      ids.add(surface.id);
      expect(surface).toMatchObject({
        state: 'disabled',
        provider: null,
        collection: 'none',
        upload: 'none',
        retention: 'zero',
        userChoice: 'policy_review_required',
      });
      expect(surface.purpose.trim()).not.toBe('');
    }
  });

  it('explicitly forbids secret, identity, raw fitness and free-text classes', () => {
    expect(ANALYTICS_FORBIDDEN_DATA_CLASSES).toEqual(
      expect.arrayContaining([
        'access_or_refresh_tokens',
        'passwords_or_password_hashes',
        'account_deletion_status_secrets',
        'email_or_direct_contact_details',
        'raw_health_fitness_or_recovery_values',
        'raw_workout_or_nutrition_payloads',
        'nutrition_free_text_or_search_text',
        'private_media_object_keys_or_provider_payloads',
        'hidden_model_reasoning',
        'unbounded_free_text',
      ]),
    );
  });

  it('blocks known analytics, crash, attribution and advertising SDKs', () => {
    for (const marker of DISALLOWED_ANALYTICS_SDK_MARKERS) {
      expect(dependencyNames, marker).not.toContain(marker);
      expect(packageLockSource, marker).not.toContain(marker);
      expect(expoConfigSource, marker).not.toContain(marker);
    }
  });
});
