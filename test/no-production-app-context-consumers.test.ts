import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync, readdirSync, statSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
  readdirSync: (path: string) => string[];
  statSync: (path: string) => { isDirectory(): boolean };
};
const { extname, resolve } = require('path') as {
  extname: (path: string) => string;
  resolve: (...parts: string[]) => string;
};

const projectRoot = resolve(__dirname, '..');
const productionRoot = resolve(projectRoot, 'src');
const excludedCompatibilityFiles = new Set([
  resolve(productionRoot, 'context/AppContext.tsx'),
  resolve(productionRoot, 'context/appContext/AppContextCore.ts'),
]);

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) return collectSourceFiles(path);
    return ['.ts', '.tsx'].includes(extname(path)) ? [path] : [];
  });

describe('production compatibility context inventory', () => {
  test('contains no useAppContext consumers outside the internal provider implementation', () => {
    const offenders = collectSourceFiles(productionRoot)
      .filter((path) => !excludedCompatibilityFiles.has(path))
      .filter((path) => readFileSync(path, 'utf8').includes('useAppContext'));

    expect(offenders).toEqual([]);
  });
});
