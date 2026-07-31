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
const workflow = readFileSync(
  resolve(projectRoot, '.github/workflows/release-gate.yml'),
  'utf8',
);
const documentation = readFileSync(resolve(projectRoot, 'docs/release-gate.md'), 'utf8');

const count = (value: string, fragment: string) => value.split(fragment).length - 1;

describe('fixed-SHA cross-repository release gate', () => {
  it('requires immutable full commit SHAs and verifies the resolved checkouts', () => {
    expect(workflow).not.toContain('default: main');
    expect(workflow).toContain("sha_pattern='^[0-9a-fA-F]{40}$'");
    expect(workflow).toContain('app_ref must be a full 40-character commit SHA');
    expect(workflow).toContain('backend_ref must be a full 40-character commit SHA');
    expect(count(workflow, 'git rev-parse HEAD')).toBe(2);
    expect(workflow).toContain('Release gate passed for mobile=$MOBILE_SHA backend=$BACKEND_SHA');
  });

  it('does not weaken the current mobile blocking validation surface', () => {
    expect(workflow).toContain('node scripts/check-repository-file-lines.mjs');
    expect(workflow).toContain('npx tsc --noEmit');
    expect(workflow).toContain('npm test');
    expect(workflow).toContain('npx expo config --type public');
    expect(workflow).toContain('npx expo export --clear');
    expect(workflow).toContain('npx expo-doctor');
    expect(workflow).not.toContain('node scripts/check-changed-file-lines.mjs');
  });

  it('validates the current backend migration, test, and production-startup boundaries', () => {
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm run build');
    expect(count(workflow, 'npm run db:migrate')).toBe(2);
    expect(workflow).toContain('npx vitest run tests/migration.test.ts');
    expect(workflow).toContain('npm test -- --maxWorkers=1 --no-file-parallelism');
    expect(workflow).toContain('npm run start:production');
    expect(workflow).toContain('http://127.0.0.1:3000/health');
  });

  it('keeps the final release result fail-closed and documents the exact boundary', () => {
    expect(workflow).toContain('needs: [validate-refs, mobile, backend]');
    expect(workflow).toContain('if: always()');
    expect(workflow).toContain('REF_RESULT');
    expect(workflow).toContain('MOBILE_RESULT');
    expect(workflow).toContain('BACKEND_RESULT');
    expect(documentation).toContain('full 40-character mobile commit SHA');
    expect(documentation).toContain('full 40-character backend commit SHA');
    expect(documentation).toContain('repository-wide file-size audit');
    expect(documentation).toContain('Expo export and Expo Doctor');
    expect(documentation).toContain('migrated-schema integration test');
    expect(documentation).toContain('does not replace physical-device validation');
  });
});
