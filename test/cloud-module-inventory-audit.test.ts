import { describe, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync, readdirSync, statSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
  readdirSync: (path: string) => string[];
  statSync: (path: string) => { isDirectory(): boolean };
};
const { dirname, extname, relative, resolve } = require('path') as {
  dirname: (path: string) => string;
  extname: (path: string) => string;
  relative: (from: string, to: string) => string;
  resolve: (...parts: string[]) => string;
};

const projectRoot = resolve(__dirname, '..');
const sourceRoot = resolve(projectRoot, 'src');
const cloudRoot = resolve(sourceRoot, 'cloud');

const collectFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });

const allCodeFiles = [
  ...collectFiles(sourceRoot),
  ...collectFiles(resolve(projectRoot, 'test')),
  ...collectFiles(resolve(projectRoot, 'tests')),
].filter((path) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path));
const codeFileSet = new Set(allCodeFiles);
const cloudFiles = collectFiles(cloudRoot).filter((path) => /\.(ts|tsx)$/.test(path));
const cloudFileSet = new Set(cloudFiles);

const isTestFile = (path: string) =>
  /(?:^|\/)(?:test|tests)(?:\/|$)/.test(relative(projectRoot, path)) ||
  /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/.test(path);

const getSpecifiers = (source: string): string[] => {
  const matches = [
    ...source.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g),
    ...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g),
    ...source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g),
  ];
  return Array.from(new Set(matches.map((match) => match[1])));
};

const resolveCodeModule = (importer: string, specifier: string): string | null => {
  const base = specifier.startsWith('@/')
    ? resolve(sourceRoot, specifier.slice(2))
    : specifier.startsWith('.')
      ? resolve(dirname(importer), specifier)
      : null;
  if (!base) return null;

  const candidates = extname(base)
    ? [base]
    : [
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.js`,
        `${base}.jsx`,
        resolve(base, 'index.ts'),
        resolve(base, 'index.tsx'),
        resolve(base, 'index.js'),
      ];
  return candidates.find((candidate) => codeFileSet.has(candidate)) ?? null;
};

type IncomingEdge = { importer: string; testOnly: boolean };
const incoming = new Map<string, IncomingEdge[]>();
const outgoingCloud = new Map<string, string[]>();
for (const file of cloudFiles) {
  incoming.set(file, []);
  outgoingCloud.set(file, []);
}

for (const importer of allCodeFiles) {
  const source = readFileSync(importer, 'utf8');
  for (const specifier of getSpecifiers(source)) {
    const resolved = resolveCodeModule(importer, specifier);
    if (!resolved || !cloudFileSet.has(resolved)) continue;
    incoming.get(resolved)?.push({
      importer: relative(projectRoot, importer),
      testOnly: isTestFile(importer),
    });
    if (cloudFileSet.has(importer)) {
      outgoingCloud.get(importer)?.push(relative(projectRoot, resolved));
    }
  }
}

const report = cloudFiles
  .sort()
  .map((file) => {
    const edges = incoming.get(file) ?? [];
    const productionImporters = edges
      .filter((edge) => !edge.testOnly)
      .map((edge) => edge.importer)
      .sort();
    const testImporters = edges
      .filter((edge) => edge.testOnly)
      .map((edge) => edge.importer)
      .sort();
    const path = relative(projectRoot, file);
    const source = readFileSync(file, 'utf8');

    return {
      path,
      lineCount: source.split(/\r?\n/).length,
      productionImporters,
      testImporters,
      outgoingCloud: Array.from(new Set(outgoingCloud.get(file) ?? [])).sort(),
      classification:
        productionImporters.length > 0
          ? 'production-reachable'
          : testImporters.length > 0
            ? 'test-only-or-direct-test-target'
            : /\.(?:test|spec)\.tsx?$/.test(path)
              ? 'test-file'
              : 'no-static-importers',
    };
  });

describe('temporary cloud module inventory', () => {
  test('prints the cloud import graph for classification', () => {
    throw new Error(`CLOUD_MODULE_INVENTORY=${JSON.stringify(report)}`);
  });
});
