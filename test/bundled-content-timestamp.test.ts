import { describe, expect, test } from 'vitest';

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
const bundledTimestamp = '2000-01-01T00:00:00.000Z';

const collectFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });
const sourceFiles = collectFiles(sourceRoot).filter((path) => /\.(ts|tsx|json)$/.test(path));
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('bundled content timestamp semantics', () => {
  test('defines the compatibility timestamp in one semantic module', () => {
    const literalOwners = sourceFiles
      .filter((path) => readFileSync(path, 'utf8').includes(bundledTimestamp))
      .map((path) => relative(projectRoot, path))
      .sort();

    expect(literalOwners).toEqual(['src/data/bundledContent.ts']);
    expect(readSource('src/data/bundledContent.ts')).toContain(
      `BUNDLED_CONTENT_CREATED_AT = '${bundledTimestamp}'`,
    );
  });

  test.each(['src/data/defaults.ts', 'src/data/exercises/index.ts'])(
    '%s uses the bundled-content semantic constant',
    (path) => {
      const source = readSource(path);

      expect(source).toContain('BUNDLED_CONTENT_CREATED_AT');
      expect(source).not.toContain(bundledTimestamp);
    },
  );

  test('removes ambiguous legacy timestamp names from production source', () => {
    const source = sourceFiles.map((path) => readFileSync(path, 'utf8')).join('\n');

    expect(source).not.toContain('DEFAULT_APP_DATA_CREATED_AT');
    expect(source).not.toContain('DEFAULT_EXERCISE_CREATED_AT');
  });
});
