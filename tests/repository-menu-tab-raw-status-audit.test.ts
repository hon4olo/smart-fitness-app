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

const staticControlLabelPatterns = [
  {
    name: 'static menu/tab/state label',
    pattern:
      /\b(?:tabBarLabel|tabLabel|menuLabel|segmentLabel|stateLabel)\s*[:=]\s*(["'])([^"'\n]+)\1/g,
  },
  {
    name: 'static navigator title',
    pattern:
      /<(?:Tabs|Stack)\.Screen\b[\s\S]{0,1200}?\boptions\s*=\s*\{\{[\s\S]{0,500}?\btitle\s*:\s*(["'])([^"'\n]+)\1/g,
  },
];

const namedControlArrayPattern =
  /\b(?:menuItems|menuOptions|tabItems|tabs|segments|stateOptions)\s*=\s*\[[\s\S]{0,3000}?\]/g;
const staticNamedControlItemPattern =
  /\b(?:label|title|text)\s*:\s*(["'])([^"'\n]+)\1/g;

const rawPresentationPatterns = [
  {
    name: 'raw status/provider/source text',
    pattern:
      /<Text\b[^>]*>\s*\{\s*(?:[A-Za-z_$][\w$]*\.)?(?:status|provider|source)\s*\}\s*<\/Text>/g,
  },
  {
    name: 'raw String status/provider/source text',
    pattern:
      /<Text\b[^>]*>\s*\{\s*String\(\s*(?:[A-Za-z_$][\w$]*\.)?(?:status|provider|source)\s*\)\s*\}\s*<\/Text>/g,
  },
  {
    name: 'uppercased internal status/code',
    pattern:
      /\{[^}\n]*(?:status|provider|source|severity|kind|code)\s*\.toUpperCase\s*\(\s*\)[^}\n]*\}/gi,
  },
  {
    name: 'raw Error.message fallback',
    pattern:
      /\bset(?:Error|Message|Notice)\s*\(\s*(?:error|cause)\s+instanceof\s+Error\s*\?\s*(?:error|cause)\.message\b/g,
  },
];

describe('repository menu, tab, state-control and raw-status audit', () => {
  it('keeps control labels and internal statuses behind bounded localization presentation', () => {
    const violations = presentationRoots.flatMap((root) =>
      collectPresentationFiles(resolve(projectRoot, root)).flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        const directViolations = [...staticControlLabelPatterns, ...rawPresentationPatterns].flatMap(
          ({ name, pattern }) => {
            pattern.lastIndex = 0;
            return [...source.matchAll(pattern)].map(
              (match) =>
                `${relative(projectRoot, path)}:${lineNumberAt(source, match.index ?? 0)} ${name}: ${match[0]}`,
            );
          },
        );

        namedControlArrayPattern.lastIndex = 0;
        const arrayViolations = [...source.matchAll(namedControlArrayPattern)].flatMap(
          (arrayMatch) => {
            const block = arrayMatch[0] ?? '';
            const blockIndex = arrayMatch.index ?? 0;
            staticNamedControlItemPattern.lastIndex = 0;
            return [...block.matchAll(staticNamedControlItemPattern)].map((itemMatch) => {
              const index = blockIndex + (itemMatch.index ?? 0);
              return `${relative(projectRoot, path)}:${lineNumberAt(source, index)} static named control item: ${itemMatch[2]}`;
            });
          },
        );

        return [...directViolations, ...arrayViolations];
      }),
    );

    expect(violations).toEqual([]);
  });
});
