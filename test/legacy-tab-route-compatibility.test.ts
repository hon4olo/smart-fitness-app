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

describe('legacy tab route compatibility', () => {
  test.each([
    ['labs', '/(tabs)/progress'],
    ['track', '/(tabs)/workouts'],
    ['eat', '/(tabs)/nutrition'],
  ])('%s remains a compatibility redirect to %s', (legacyRoute, canonicalRoute) => {
    const source = readSource(`src/app/(tabs)/${legacyRoute}.tsx`);

    expect(source).toContain("import { Redirect } from 'expo-router'");
    expect(source).toContain(`<Redirect href="${canonicalRoute}" />`);
    expect(source).not.toContain("export { default } from './");
  });

  test('Home uses canonical tab routes instead of legacy aliases', () => {
    const source = readSource('src/app/(tabs)/index.tsx');

    expect(source).toContain("'/(tabs)/workouts'");
    expect(source).toContain("router.push('/(tabs)/nutrition')");
    expect(source).not.toContain("'/track'");
    expect(source).not.toContain("'/eat'");
    expect(source).not.toContain("'/labs'");
  });
});
