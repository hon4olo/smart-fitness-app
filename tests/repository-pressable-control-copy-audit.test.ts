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
const pressableBlockPattern = /<Pressable\b[\s\S]{0,4000}?<\/Pressable>/g;
const staticTextPattern = /<Text\b[^>]*>\s*([^<>{}\n][^<>{}]*?)\s*<\/Text>/g;
const allowedTechnicalTokens = new Set(['RPE']);
const numericUnitTokenPattern = /^\d+(?:[.,]\d+)?\s*(?:g|kg|lb|ml|cm|in|kcal|kJ)$/i;

const collectPresentationFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return collectPresentationFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });

const lineNumberAt = (source: string, index: number) =>
  source.slice(0, index).split('\n').length;

const normalizeLiteral = (value: string): string => value.replace(/\s+/g, ' ').trim();

const hasLanguageWords = (value: string): boolean => {
  const normalized = normalizeLiteral(value);
  if (
    !normalized ||
    normalized.length === 1 ||
    allowedTechnicalTokens.has(normalized) ||
    numericUnitTokenPattern.test(normalized)
  ) {
    return false;
  }
  return /[A-Za-zА-Яа-я]{2,}/.test(normalized);
};

describe('repository Pressable control-copy audit', () => {
  it('keeps static Pressable text behind localization boundaries', () => {
    const violations = presentationRoots.flatMap((root) =>
      collectPresentationFiles(resolve(projectRoot, root)).flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        pressableBlockPattern.lastIndex = 0;

        return [...source.matchAll(pressableBlockPattern)].flatMap((blockMatch) => {
          const block = blockMatch[0] ?? '';
          const blockIndex = blockMatch.index ?? 0;
          staticTextPattern.lastIndex = 0;

          return [...block.matchAll(staticTextPattern)].flatMap((textMatch) => {
            const literal = normalizeLiteral(textMatch[1] ?? '');
            if (!hasLanguageWords(literal)) return [];
            const index = blockIndex + (textMatch.index ?? 0);
            return [
              `${relative(projectRoot, path)}:${lineNumberAt(source, index)} static Pressable text: ${literal}`,
            ];
          });
        });
      }),
    );

    expect(violations).toEqual([]);
  });
});
