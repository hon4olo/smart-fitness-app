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

describe('AppContext public boundaries', () => {
  test('defines focused action and infrastructure contexts', () => {
    const source = readSource('src/context/appContext/AppContextCore.ts');

    expect(source).toContain('AppActionsContext');
    expect(source).toContain('AppInfrastructureContext');
    expect(source).toContain('useAppActions');
    expect(source).toContain('useAppInfrastructure');
  });

  test('memoizes and provides focused values while retaining compatibility context', () => {
    const source = readSource('src/context/AppContext.tsx');

    expect(source).toContain('useMemo<AppActions>');
    expect(source).toContain('useMemo<AppInfrastructure>');
    expect(source).toContain('<AppActionsContext.Provider value={actions}>');
    expect(source).toContain(
      '<AppInfrastructureContext.Provider value={infrastructure}>',
    );
    expect(source).toContain('<AppContext.Provider value={value}>');
  });

  test.each([
    ['src/app/auth/register.tsx', 'useAppActions'],
    ['src/app/weight-entry.tsx', 'useAppActions'],
    ['src/features/settings/DataRecoveryCard.tsx', 'useAppInfrastructure'],
  ])('%s no longer subscribes to the global context', (path, focusedHook) => {
    const source = readSource(path);

    expect(source).toContain(focusedHook);
    expect(source).not.toContain('useAppContext');
  });
});
