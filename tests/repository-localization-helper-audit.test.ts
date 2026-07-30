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
const helperRoots = ['src/components', 'src/features'];

const isAuditedHelper = (path: string) =>
  path.endsWith('.ts') &&
  !path.endsWith('.d.ts') &&
  !path.endsWith('.styles.ts') &&
  !path.endsWith('.test.ts') &&
  !path.endsWith('.types.ts');

const collectHelperFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return collectHelperFiles(path);
    return isAuditedHelper(path) ? [path] : [];
  });

type AuditPattern = {
  name: string;
  pattern: RegExp;
};

const auditPatterns: AuditPattern[] = [
  {
    name: 'direct locale formatting',
    pattern: /(?:new\s+)?Intl\.(?:DateTimeFormat|NumberFormat|RelativeTimeFormat)\s*\(/g,
  },
  {
    name: 'toLocaleString helper formatting',
    pattern: /\.toLocaleString\s*\(/g,
  },
  {
    name: 'raw status fallback',
    pattern: /\?\?\s*(?:String\s*\()?[^^\n;:,)}]*status\b/gi,
  },
  {
    name: 'humanized internal code fallback',
    pattern: /\bhumanizeCode\b/g,
  },
];

const lineNumberAt = (source: string, index: number) =>
  source.slice(0, index).split('\n').length;

describe('repository localization helper audit', () => {
  it('keeps feature and component helpers behind central formatters and bounded statuses', () => {
    const violations = helperRoots.flatMap((root) =>
      collectHelperFiles(resolve(projectRoot, root)).flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        return auditPatterns.flatMap(({ name, pattern }) => {
          pattern.lastIndex = 0;
          return [...source.matchAll(pattern)].map(
            (match) =>
              `${relative(projectRoot, path)}:${lineNumberAt(source, match.index ?? 0)} ${name}: ${match[0]}`,
          );
        });
      }),
    );

    expect(violations).toEqual([]);
  });
});
