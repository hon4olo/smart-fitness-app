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
const symbols = ['DEFAULT_APP_DATA_CREATED_AT', 'DEFAULT_EXERCISE_CREATED_AT'] as const;

type SourceOccurrence = {
  path: string;
  line: number;
  sourceLine: string;
};
type DateOccurrence = SourceOccurrence & {
  literal: string;
  classificationHint: string;
};

const dateOccurrences: DateOccurrence[] = [];
const symbolUsages: Record<(typeof symbols)[number], SourceOccurrence[]> = {
  DEFAULT_APP_DATA_CREATED_AT: [],
  DEFAULT_EXERCISE_CREATED_AT: [],
};
for (const path of sourceFiles) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
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
      dateOccurrences.push({
        path: relative(projectRoot, path),
        line: lineIndex + 1,
        literal,
        sourceLine: sourceLine.trim(),
        classificationHint,
      });
    }
    for (const symbol of symbols) {
      if (!sourceLine.includes(symbol)) continue;
      symbolUsages[symbol].push({
        path: relative(projectRoot, path),
        line: lineIndex + 1,
        sourceLine: sourceLine.trim(),
      });
    }
  }
}

describe('temporary placeholder timestamp inventory', () => {
  test('prints fixed production dates and sentinel symbol usages', () => {
    throw new Error(
      `PLACEHOLDER_TIMESTAMP_INVENTORY=${JSON.stringify({ dateOccurrences, symbolUsages })}`,
    );
  });
});
