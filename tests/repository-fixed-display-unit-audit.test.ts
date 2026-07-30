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
const displayUnitPattern = /\b(?:kg|lb|cm|kcal|kJ)\b/i;
const exactCanonicalUnitPattern = /^(?:kg|lb|cm|in|kcal|kJ)$/;

const collectPresentationFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return collectPresentationFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });

const lineNumberAt = (source: string, index: number) =>
  source.slice(0, index).split('\n').length;

const quotedLiteralPatterns = [
  /"([^"\\\n]*(?:\\.[^"\\\n]*)*)"/g,
  /'([^'\\\n]*(?:\\.[^'\\\n]*)*)'/g,
  /`([^`\\\n]*(?:\\.[^`\\\n]*)*)`/g,
];

describe('repository fixed display-unit audit', () => {
  it('keeps user-facing units behind selected-unit presentation boundaries', () => {
    const violations = presentationRoots.flatMap((root) =>
      collectPresentationFiles(resolve(projectRoot, root)).flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        const quotedViolations = quotedLiteralPatterns.flatMap((pattern) => {
          pattern.lastIndex = 0;
          return [...source.matchAll(pattern)].flatMap((match) => {
            const literal = match[1] ?? '';
            if (
              !displayUnitPattern.test(literal) ||
              exactCanonicalUnitPattern.test(literal)
            ) {
              return [];
            }
            return [
              `${relative(projectRoot, path)}:${lineNumberAt(source, match.index ?? 0)} quoted unit: ${literal}`,
            ];
          });
        });

        const jsxTextViolations = [...source.matchAll(/>([^<>{}\n]{1,200})</g)].flatMap(
          (match) => {
            const text = (match[1] ?? '').trim();
            return displayUnitPattern.test(text)
              ? [
                  `${relative(projectRoot, path)}:${lineNumberAt(source, match.index ?? 0)} JSX unit: ${text}`,
                ]
              : [];
          },
        );

        return [...quotedViolations, ...jsxTextViolations];
      }),
    );

    expect(violations).toEqual([]);
  });
});
