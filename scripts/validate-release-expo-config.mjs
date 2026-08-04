import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const EXPECTED_APP_IDENTIFIER = 'com.dzahard28.smartfitnessapp';
export const EXPECTED_APP_SCHEME = 'smartfitnessapp';
export const EXPECTED_UPDATE_CHANNEL = 'production';
export const EXPECTED_RESET_PATH = '/auth/reset-password';
export const RELEASE_EVIDENCE_SCHEMA_VERSION = 1;

const EXACT_GIT_SHA_PATTERN = /^[0-9a-f]{40}$/iu;

const requireString = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
};

const requireExactSha = (value, label) => {
  const normalized = requireString(value, label).toLowerCase();
  if (!EXACT_GIT_SHA_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a full 40-character commit SHA`);
  }
  return normalized;
};

const intentFilterData = (filter) => {
  if (!filter || typeof filter !== 'object') return [];
  const data = filter.data;
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

const hasPasswordResetIntentFilter = (config, hostname) =>
  (config.android?.intentFilters ?? []).some(
    (filter) =>
      filter?.action === 'VIEW' &&
      filter.autoVerify === true &&
      filter.category?.includes('BROWSABLE') === true &&
      filter.category.includes('DEFAULT') &&
      intentFilterData(filter).some(
        (entry) =>
          entry?.scheme === 'https' &&
          entry.host === hostname &&
          entry.pathPrefix === EXPECTED_RESET_PATH,
      ),
  );

export const validateReleaseExpoConfig = (
  config,
  {
    expectedMobileSha,
    expectedResetHostname,
  },
) => {
  const mobileSha = requireExactSha(
    expectedMobileSha,
    'expected mobile source SHA',
  );
  const resetHostname = requireString(
    expectedResetHostname,
    'expected password-reset hostname',
  ).toLowerCase();
  const sourceCommit = requireExactSha(
    config?.extra?.buildProvenance?.sourceCommit,
    'Expo build provenance source commit',
  );

  if (sourceCommit !== mobileSha) {
    throw new Error(
      `Expo build provenance mismatch: expected=${mobileSha} actual=${sourceCommit}`,
    );
  }
  if (config?.extra?.buildProvenance?.schemaVersion !== 1) {
    throw new Error('Expo build provenance schema version must be 1');
  }
  if (config?.android?.package !== EXPECTED_APP_IDENTIFIER) {
    throw new Error('Android package identifier mismatch');
  }
  if (config?.ios?.bundleIdentifier !== EXPECTED_APP_IDENTIFIER) {
    throw new Error('iOS bundle identifier mismatch');
  }
  if (config?.scheme !== EXPECTED_APP_SCHEME) {
    throw new Error('Application URL scheme mismatch');
  }
  if (config?.runtimeVersion?.policy !== 'appVersion') {
    throw new Error('Runtime version policy must remain appVersion');
  }
  if (
    config?.updates?.requestHeaders?.['expo-channel-name'] !==
    EXPECTED_UPDATE_CHANNEL
  ) {
    throw new Error('Expo update channel must remain production');
  }
  if (
    config?.ios?.associatedDomains?.includes(
      `applinks:${resetHostname}`,
    ) !== true
  ) {
    throw new Error('iOS password-reset associated domain is missing');
  }
  if (!hasPasswordResetIntentFilter(config, resetHostname)) {
    throw new Error('Android password-reset app-link filter is missing');
  }

  return {
    schemaVersion: RELEASE_EVIDENCE_SCHEMA_VERSION,
    mobileSha,
    appVersion: requireString(config.version, 'app version'),
    androidPackage: config.android.package,
    iosBundleIdentifier: config.ios.bundleIdentifier,
    runtimePolicy: config.runtimeVersion.policy,
    updateChannel: config.updates.requestHeaders['expo-channel-name'],
    passwordResetUrl: `https://${resetHostname}${EXPECTED_RESET_PATH}`,
  };
};

const run = async () => {
  const configPath = process.argv[2];
  if (!configPath) {
    throw new Error('Usage: validate-release-expo-config.mjs <expo-config.json>');
  }
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const evidence = validateReleaseExpoConfig(config, {
    expectedMobileSha: process.env.EXPECTED_MOBILE_SHA,
    expectedResetHostname: process.env.EXPECTED_RESET_HOSTNAME,
  });
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
