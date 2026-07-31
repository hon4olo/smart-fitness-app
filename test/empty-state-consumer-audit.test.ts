import { describe, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync, readdirSync, statSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
  readdirSync: (path: string) => string[];
  statSync: (path: string) => { isDirectory(): boolean };
};
const { relative, resolve } = require('path') as {
  relative: (from: string, to: string) => string;
  resolve: (...parts: string[]) => string;
};

const projectRoot = resolve(__dirname, '..');
const sourceRoot = resolve(projectRoot, 'src');
const symbols = [
  'EmptyNutritionState',
  'NutritionEmptyState',
  'EmptyWorkoutState',
  'EmptyProgressState',
] as const;

const collectFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });

describe('temporary empty-state consumer audit', () => {
  test('prints every wrapper consumer before consolidation', () => {
    const matches = collectFiles(sourceRoot)
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        const usedSymbols = symbols.filter((symbol) => source.includes(symbol));
        return usedSymbols.length > 0
          ? [{ path: relative(projectRoot, path), symbols: usedSymbols }]
          : [];
      });

    throw new Error(`EMPTY_STATE_CONSUMERS=${JSON.stringify(matches)}`);
  });
});
