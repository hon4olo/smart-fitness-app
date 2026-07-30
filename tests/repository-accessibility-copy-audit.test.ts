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

const quotedAccessibilityPatterns = [
  /accessibility(?:Label|Hint)\s*=\s*(["'])([^"'\n]+)\1/g,
  /accessibility(?:Label|Hint)\s*=\s*\{\s*(["'])([^"'\n]+)\1\s*\}/g,
];
const templateAccessibilityPatterns = [
  /accessibility(?:Label|Hint)\s*=\s*`([^`\n]+)`/g,
  /accessibility(?:Label|Hint)\s*=\s*\{\s*`([^`\n]+)`\s*\}/g,
];

const hasStaticWords = (literal: string) =>
  /[A-Za-zА-Яа-я]/.test(literal.replace(/\$\{[^}]*\}/g, ''));

describe('repository accessibility copy audit', () => {
  it('keeps accessibility labels and hints behind localization boundaries', () => {
    const violations = presentationRoots.flatMap((root) =>
      collectPresentationFiles(resolve(projectRoot, root)).flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        const quotedViolations = quotedAccessibilityPatterns.flatMap((pattern) => {
          pattern.lastIndex = 0;
          return [...source.matchAll(pattern)].map(
            (match) =>
              `${relative(projectRoot, path)}:${lineNumberAt(source, match.index ?? 0)} static accessibility copy: ${match[2]}`,
          );
        });
        const templateViolations = templateAccessibilityPatterns.flatMap((pattern) => {
          pattern.lastIndex = 0;
          return [...source.matchAll(pattern)].flatMap((match) => {
            const literal = match[1] ?? '';
            return hasStaticWords(literal)
              ? [
                  `${relative(projectRoot, path)}:${lineNumberAt(source, match.index ?? 0)} static template accessibility copy: ${literal}`,
                ]
              : [];
          });
        });

        return [...quotedViolations, ...templateViolations];
      }),
    );

    expect(violations).toEqual([]);
  });
});
