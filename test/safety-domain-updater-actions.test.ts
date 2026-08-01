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

describe('typed Safety and Recovery updater actions', () => {
  test('exposes bounded updater actions through AppActions', () => {
    const types = readSource('src/types/appContext.ts');
    const provider = readSource('src/context/AppContext.tsx');

    for (const action of [
      'upsertRecoveryCheckIn',
      'upsertUserLimitation',
      'deleteUserLimitation',
    ]) {
      expect(types).toContain(action);
      expect(provider).toContain(action);
    }
  });

  test('keeps validation and ordered persistence inside the provider boundary', () => {
    const provider = readSource('src/context/AppContext.tsx');

    expect(provider).toContain('normalizeRecoveryCheckIn');
    expect(provider).toContain('normalizeUserLimitation');
    expect(provider).toContain('upsertRecoveryCheckInInState');
    expect(provider).toContain('upsertUserLimitationInState');
    expect(provider).toContain('deleteUserLimitationFromState');
    expect(provider).toContain("scheduleStateMutation({ label: 'Apply synchronized data', nextState })");
  });

  test.each([
    [
      'src/features/coach/screens/RecoveryCheckInScreen.tsx',
      ['upsertRecoveryCheckIn'],
    ],
    [
      'src/features/coach/screens/UserLimitationScreen.tsx',
      ['upsertUserLimitation', 'deleteUserLimitation'],
    ],
  ])('%s no longer reconstructs or replaces full AppState', (path, actions) => {
    const source = readSource(path);

    expect(source).toContain('useAppActions');
    expect(source).toContain('useAppInfrastructure');
    expect(source).not.toContain('const toAppState');
    expect(source).not.toContain('replaceState');
    expect(source).not.toContain("from '@/context/appContext/safetyRecoveryActions'");
    expect(source).not.toContain('AppContextType');
    expect(source).not.toContain('AppState');
    for (const action of actions) {
      expect(source).toContain(action);
    }
  });
});
