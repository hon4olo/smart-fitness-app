import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { execFileSync } = require('node:child_process') as {
  execFileSync(
    file: string,
    args: string[],
    options: {
      cwd: string;
      encoding: string;
      env: Record<string, string | undefined>;
      stdio?: ['ignore', 'pipe', 'pipe'];
    },
  ): string;
};
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs') as {
  mkdtempSync(prefix: string): string;
  rmSync(path: string, options: { recursive: boolean; force: boolean }): void;
  writeFileSync(path: string, value: string, encoding: string): void;
};
const { tmpdir } = require('node:os') as { tmpdir(): string };
const { resolve } = require('node:path') as {
  resolve(...parts: string[]): string;
};

const projectRoot = resolve(__dirname, '..');
const validator = resolve(
  projectRoot,
  'scripts/validate-release-expo-config.mjs',
);
const mobileSha = 'a'.repeat(40);
const resetHostname = 'release-gate.invalid';

const validConfig = () => ({
  version: '1.0.3',
  scheme: 'smartfitnessapp',
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    requestHeaders: { 'expo-channel-name': 'production' },
  },
  extra: {
    buildProvenance: { schemaVersion: 1, sourceCommit: mobileSha },
  },
  ios: {
    bundleIdentifier: 'com.dzahard28.smartfitnessapp',
    associatedDomains: [`applinks:${resetHostname}`],
  },
  android: {
    package: 'com.dzahard28.smartfitnessapp',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: [
          {
            scheme: 'https',
            host: resetHostname,
            pathPrefix: '/auth/reset-password',
          },
        ],
      },
    ],
  },
});

const runValidator = (config: Record<string, unknown>) => {
  const directory = mkdtempSync(resolve(tmpdir(), 'smart-fitness-release-'));
  const configPath = resolve(directory, 'expo-config.json');
  writeFileSync(configPath, JSON.stringify(config), 'utf8');
  try {
    return execFileSync(process.execPath, [validator, configPath], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        EXPECTED_MOBILE_SHA: mobileSha,
        EXPECTED_RESET_HOSTNAME: resetHostname,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

describe('release Expo configuration validator', () => {
  it('emits bounded exact-SHA release evidence for the approved identifiers', () => {
    const evidence = JSON.parse(runValidator(validConfig()));

    expect(evidence).toEqual({
      schemaVersion: 1,
      mobileSha,
      appVersion: '1.0.3',
      androidPackage: 'com.dzahard28.smartfitnessapp',
      iosBundleIdentifier: 'com.dzahard28.smartfitnessapp',
      runtimePolicy: 'appVersion',
      updateChannel: 'production',
      passwordResetUrl:
        'https://release-gate.invalid/auth/reset-password',
    });
  });

  it('fails closed when provenance, package, or verified reset routing drifts', () => {
    for (const invalid of [
      { ...validConfig(), extra: { buildProvenance: { schemaVersion: 1, sourceCommit: 'main' } } },
      { ...validConfig(), android: { ...validConfig().android, package: 'com.example.other' } },
      { ...validConfig(), ios: { ...validConfig().ios, associatedDomains: [] } },
      { ...validConfig(), android: { ...validConfig().android, intentFilters: [] } },
    ]) {
      expect(() => runValidator(invalid)).toThrow();
    }
  });
});
