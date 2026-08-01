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

describe('Auth and onboarding focused state', () => {
  test('auth startup composes Profile and Infrastructure state', () => {
    const source = readSource('src/app/auth/index.tsx');

    expect(source).toContain('useProfileState');
    expect(source).toContain('useAppInfrastructure');
    expect(source).not.toContain('useAppContext');
  });

  test('onboarding keeps reads, actions, and mutation status in focused boundaries', () => {
    const source = readSource('src/features/onboarding/OnboardingClientScreen.tsx');

    expect(source).toContain('useProfileState');
    expect(source).toContain('useAppActions');
    expect(source).toContain('useAppInfrastructure');
    expect(source).not.toContain('useAppContext');
  });
});
