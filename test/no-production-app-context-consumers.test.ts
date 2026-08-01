import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync, readdirSync, statSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
  readdirSync: (path: string) => string[];
  statSync: (path: string) => { isDirectory(): boolean };
};
const { extname, resolve, sep } = require('path') as {
  extname: (path: string) => string;
  resolve: (...parts: string[]) => string;
  sep: string;
};

const projectRoot = resolve(__dirname, '..');
const productionRoot = resolve(projectRoot, 'src');
const internalContextPrefix = `${resolve(productionRoot, 'context')}${sep}`;

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) return collectSourceFiles(path);
    return ['.ts', '.tsx'].includes(extname(path)) ? [path] : [];
  });

describe('production compatibility context inventory', () => {
  test('contains no useAppContext consumers outside the internal provider implementation', () => {
    const offenders = collectSourceFiles(productionRoot)
      .filter((path) => !path.startsWith(internalContextPrefix))
      .filter((path) => readFileSync(path, 'utf8').includes('useAppContext'));

    expect(offenders).toEqual([]);
  });
});
