import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('Profile state boundary', () => {
  test('contains only profile and onboarding completion state', () => {
    const source = readSource('src/context/ProfileStateContext.tsx');

    expect(source).toContain("Pick<AppState, 'onboardingCompleted' | 'profile'>");
    for (const unrelatedField of [
      'weightHistory',
      'workoutSessions',
      'foodEntries',
      'recoveryCheckIns',
      'userLimitations',
    ]) {
      expect(source).not.toContain(`'${unrelatedField}'`);
    }
  });

  test('memoizes the focused value from only the two Profile identities', () => {
    const source = readSource('src/context/ProfileStateContext.tsx');

    expect(source).toContain('useMemo<ProfileDataState>');
    expect(source).toContain('[onboardingCompleted, profile]');
  });

  test('mounts the provider inside AppProvider', () => {
    const source = readSource('src/app/_layout.tsx');
    const appProviderIndex = source.indexOf('<AppProvider>');
    const profileProviderIndex = source.indexOf('<ProfileStateProvider>');

    expect(appProviderIndex).toBeGreaterThanOrEqual(0);
    expect(profileProviderIndex).toBeGreaterThan(appProviderIndex);
  });
});
