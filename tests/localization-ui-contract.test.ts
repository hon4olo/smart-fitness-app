import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

const FIRST_SLICE_FILES = [
  'src/app/settings/index.tsx',
  'src/app/sync-backup.tsx',
  'src/app/account/sessions.tsx',
  'src/components/auth/AuthFormScreen.tsx',
  'src/components/auth/AuthGateCard.tsx',
  'src/components/auth/ChangePasswordModal.tsx',
  'src/components/auth/DeleteAccountModal.tsx',
  'src/components/profile/ProfileActionsCard.tsx',
  'src/components/profile/ProfileRuntimeInfoCard.tsx',
  'src/components/profile/ProfileSyncStatusCard.tsx',
  'src/context/appContext/AppMutationFailureNotice.tsx',
  'src/features/settings/DataRecoveryCard.tsx',
  'src/features/settings/PersonalDetailsSettingsCard.tsx',
  'src/features/settings/PrivacyAboutCards.tsx',
  'src/features/settings/SupportDiagnosticsCard.tsx',
  'src/features/settings/SyncConflictReviewCard.tsx',
  'src/features/settings/SyncSettingsCard.tsx',
  'src/features/settings/dataRecoveryCopy.ts',
  'src/features/settings/syncConflictCopy.ts',
  'src/features/settings/syncStatusCopy.ts',
] as const;

const extractMessageKeys = (source: string, start: string) => {
  const objectSource = source.split(start, 2)[1]?.split('} as const;', 1)[0] ?? '';
  return [...objectSource.matchAll(/^\s*'([^']+)'\s*:/gm)].map((match) => match[1]);
};

describe('localized Settings and account UI contract', () => {
  it('keeps source catalogs free of duplicate keys', () => {
    const keys = [
      ...extractMessageKeys(
        readSource('src/localization/messages.ts'),
        'const enCoreMessages = {',
      ),
      ...extractMessageKeys(
        readSource('src/localization/settingsMessages.ts'),
        'export const enSettingsMessages = {',
      ),
      ...extractMessageKeys(
        readSource('src/localization/progressMessages.ts'),
        'export const enProgressMessages = {',
      ),
      ...extractMessageKeys(
        readSource('src/localization/homeOnboardingMessages.ts'),
        'export const enHomeOnboardingMessages = {',
      ),
    ];

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('does not branch on locale inside the completed first slice', () => {
    for (const path of FIRST_SLICE_FILES) {
      const source = readSource(path);
      expect(source, path).not.toMatch(/locale\s*===\s*['"](?:ru|en)['"]/);
      expect(source, path).not.toMatch(/locale\.startsWith\(\s*['"]ru/);
    }
  });

  it('does not reintroduce local bilingual dictionaries in Settings', () => {
    for (const path of FIRST_SLICE_FILES.filter((path) => path.includes('/settings/'))) {
      const source = readSource(path);
      expect(source, path).not.toContain('copyByLanguage');
      expect(source, path).not.toMatch(/const\s+COPY\s*=/);
      expect(source, path).not.toContain('Record<SupportedLocale');
    }
  });

  it('routes high-risk UI props and alerts through translation keys', () => {
    for (const path of FIRST_SLICE_FILES) {
      const source = readSource(path);
      expect(source, path).not.toMatch(
        /\b(?:label|title|subtitle|helperText|accessibilityLabel|accessibilityHint)\s*=\s*['"][A-Za-z]/,
      );
      expect(source, path).not.toMatch(/Alert\.alert\(\s*['"][A-Za-z]/);
    }
  });
});
