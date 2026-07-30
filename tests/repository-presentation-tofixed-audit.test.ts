import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync, readdirSync, statSync } = require('fs') as {
  readFileSync(path: string, encoding: string): string;
  readdirSync(path: string): string[];
  statSync(path: string): { isDirectory(): boolean };
};
const { join, relative, resolve } = require('path') as {
  join(...parts: string[]): string;
  relative(from: string, to: string): string;
  resolve(...parts: string[]): string;
};

const projectRoot = resolve(__dirname, '..');
const presentationRoots = ['src/app', 'src/components', 'src/features'];

const collectPresentationFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return collectPresentationFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });

const lineNumberAt = (source: string, index: number) =>
  source.slice(0, index).split('\n').length;

describe('repository presentation toFixed audit', () => {
  it('keeps display rounding behind central number and unit formatters', () => {
    const violations = presentationRoots.flatMap((root) =>
      collectPresentationFiles(resolve(projectRoot, root)).flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        return [...source.matchAll(/\.toFixed\s*\(/g)].map(
          (match) =>
            `${relative(projectRoot, path)}:${lineNumberAt(source, match.index ?? 0)} ${match[0]}`,
        );
      }),
    );

    expect(violations).toEqual([]);
  });
});
