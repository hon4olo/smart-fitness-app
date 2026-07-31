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

const collectFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });
const isTestFile = (path: string) =>
  /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/.test(path) ||
  /(?:^|\/)(?:__tests__|test|tests)(?:\/|$)/.test(relative(projectRoot, path));

const sourceFiles = collectFiles(sourceRoot).filter(
  (path) => /\.(?:ts|tsx|js|jsx|json)$/.test(path) && !isTestFile(path),
);
const dateLiteralPattern = /(['"])(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?)\1/g;

type DateOccurrence = {
  path: string;
  line: number;
  literal: string;
  sourceLine: string;
  classificationHint: string;
};

const occurrences: DateOccurrence[] = [];
for (const path of sourceFiles) {
  const source = readFileSync(path, 'utf8');
  const lines = source.split(/\r?\n/);
  for (const [lineIndex, sourceLine] of lines.entries()) {
    for (const match of sourceLine.matchAll(dateLiteralPattern)) {
      const literal = match[2];
      const year = Number(literal.slice(0, 4));
      const classificationHint =
        year <= 2001 || /(?:default|fallback|unknown|sentinel|placeholder|seed)/i.test(sourceLine)
          ? 'sentinel-candidate'
          : /(?:createdAt|updatedAt|finishedAt|occurredAt|timestamp|date)/.test(sourceLine)
            ? 'fixed-domain-date'
            : 'fixed-literal';
      occurrences.push({
        path: relative(projectRoot, path),
        line: lineIndex + 1,
        literal,
        sourceLine: sourceLine.trim(),
        classificationHint,
      });
    }
  }
}

describe('temporary placeholder timestamp inventory', () => {
  test('prints fixed production date literals for classification', () => {
    throw new Error(`PLACEHOLDER_TIMESTAMP_INVENTORY=${JSON.stringify(occurrences)}`);
  });
});
