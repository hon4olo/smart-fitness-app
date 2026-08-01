import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: string): string;
};
const { resolve } = require('path') as {
  resolve(...parts: string[]): string;
};

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('local-state storage decision', () => {
  it('keeps the reviewed AsyncStorage decision and evidence linked from the active plan', () => {
    const decision = readSource(
      'docs/architecture/local-state-performance-decision.md',
    );
    const plan = readSource('docs/implementation-plan.md');

    expect(decision).toContain(
      'Keep the current single AsyncStorage AppState snapshot.',
    );
    expect(decision).toContain('| Representative | 262,315 |');
    expect(decision).toContain('| Stress | 1,114,421 |');
    expect(decision).toContain('supported release-device diagnostics');
    expect(plan).toContain(
      'docs/architecture/local-state-performance-decision.md',
    );
    expect(plan).toContain(
      'There is no remaining approved autonomous source-refactor phase',
    );
  });

  it('keeps deterministic snapshot budgets and avoids an unapproved SQLite dependency', () => {
    const benchmark = readSource(
      'src/testing/appStateRepositoryBenchmark.test.ts',
    );
    const packageJson = readSource('package.json');

    expect(benchmark).toContain('25_000');
    expect(benchmark).toContain('350_000');
    expect(benchmark).toContain('1_500_000');
    expect(packageJson).not.toContain('expo-sqlite');
    expect(packageJson).not.toContain('op-sqlite');
  });
});
