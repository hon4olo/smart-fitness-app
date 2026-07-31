import { describe, expect, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { existsSync, readFileSync, readdirSync, statSync } = require('fs') as {
  existsSync: (path: string) => boolean;
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
const collectExistingFiles = (directory: string): string[] =>
  existsSync(directory) ? collectFiles(directory) : [];
const isCodeFile = (path: string) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path);
const isTestFile = (path: string) =>
  /(?:^|\/)(?:test|tests)(?:\/|$)/.test(relative(projectRoot, path)) ||
  /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/.test(path);

const allCodeFiles = [
  ...collectFiles(sourceRoot),
  ...collectExistingFiles(resolve(projectRoot, 'test')),
  ...collectExistingFiles(resolve(projectRoot, 'tests')),
].filter(isCodeFile);
const codeFileSet = new Set(allCodeFiles);
const productionCloudFiles = collectFiles(cloudRoot).filter(
  (path) => /\.(ts|tsx)$/.test(path) && !isTestFile(path),
);
const productionCloudFileSet = new Set(productionCloudFiles);

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

const outgoingCloud = new Map<string, Set<string>>(
  productionCloudFiles.map((file) => [file, new Set<string>()]),
);
const runtimeRoots = new Set<string>();

for (const importer of allCodeFiles.filter((path) => !isTestFile(path))) {
  const importerIsCloud = productionCloudFileSet.has(importer);
  const source = readFileSync(importer, 'utf8');
  for (const specifier of getSpecifiers(source)) {
    const resolved = resolveCodeModule(importer, specifier);
    if (!resolved || !productionCloudFileSet.has(resolved)) continue;
    if (importerIsCloud) {
      outgoingCloud.get(importer)?.add(resolved);
    } else {
      runtimeRoots.add(resolved);
    }
  }
}

const reachableCloudFiles = new Set(runtimeRoots);
const pending = [...runtimeRoots];
while (pending.length > 0) {
  const file = pending.pop();
  if (!file) continue;
  for (const dependency of outgoingCloud.get(file) ?? []) {
    if (reachableCloudFiles.has(dependency)) continue;
    reachableCloudFiles.add(dependency);
    pending.push(dependency);
  }
}

describe('cloud module reachability', () => {
  test('keeps every production cloud module reachable from runtime code', () => {
    const unreachable = productionCloudFiles
      .filter((file) => !reachableCloudFiles.has(file))
      .map((file) => relative(projectRoot, file))
      .sort();

    expect(unreachable).toEqual([]);
  });

  test('retains at least one runtime entry into the cloud boundary', () => {
    expect(runtimeRoots.size).toBeGreaterThan(0);
  });
});
