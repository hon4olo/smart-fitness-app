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
const documentation = readFileSync(
  resolve(projectRoot, 'docs/release-gate.md'),
  'utf8',
);
const count = (value: string, fragment: string) =>
  value.split(fragment).length - 1;

describe('fixed-SHA cross-repository release gate', () => {
  it('requires immutable release and distinct rollback commit SHAs', () => {
    expect(workflow).not.toContain('default: main');
    expect(workflow).toContain("sha_pattern='^[0-9a-fA-F]{40}$'");
    expect(workflow).toContain('"app_ref:$APP_REF"');
    expect(workflow).toContain('"backend_ref:$BACKEND_REF"');
    expect(workflow).toContain('"rollback_app_ref:$ROLLBACK_APP_REF"');
    expect(workflow).toContain(
      '"rollback_backend_ref:$ROLLBACK_BACKEND_REF"',
    );
    expect(workflow).toContain(
      '$name must be a full 40-character commit SHA',
    );
    expect(workflow).toContain(
      'rollback_app_ref must identify a distinct previous mobile commit',
    );
    expect(workflow).toContain(
      'rollback_backend_ref must identify a distinct previous backend commit',
    );
    expect(count(workflow, 'git rev-parse HEAD')).toBe(2);
    expect(count(workflow, 'git merge-base --is-ancestor')).toBe(2);
  });

  it('does not weaken the current mobile blocking validation surface', () => {
    expect(workflow).toContain('node scripts/check-repository-file-lines.mjs');
    expect(workflow).toContain('npx tsc --noEmit');
    expect(workflow).toContain('npm test');
    expect(workflow).toContain('npx expo config --type public --json');
    expect(workflow).toContain('npx expo export --clear');
    expect(workflow).toContain('npx expo-doctor');
    expect(workflow).not.toContain('node scripts/check-changed-file-lines.mjs');
  });

  it('binds Expo evidence to the checked-out mobile source and routing', () => {
    expect(workflow).toContain(
      'EXPO_PUBLIC_SOURCE_COMMIT_SHA: ${{ inputs.app_ref }}',
    );
    expect(workflow).toContain(
      'PASSWORD_RESET_APP_LINK_BASE_URL: https://release-gate.invalid/auth/reset-password',
    );
    expect(workflow).toContain(
      'node scripts/validate-release-expo-config.mjs',
    );
    expect(workflow).toContain('mobile-release-evidence.json');
  });

  it('validates the current backend migration, test, and production-startup boundaries', () => {
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm run build');
    expect(count(workflow, 'npm run db:migrate')).toBe(2);
    expect(workflow).toContain('npx vitest run tests/migration.test.ts');
    expect(workflow).toContain(
      'tests/sync-idempotency-scope-migration.test.ts',
    );
    expect(workflow).toContain(
      "SOCIAL_CONTENT_MODERATION_ENFORCEMENT_ENABLED: 'false'",
    );
    expect(workflow).toContain("SOCIAL_MEDIA_UPLOADS_ENABLED: 'false'");
    expect(workflow).toContain(
      'npm test -- --maxWorkers=1 --no-file-parallelism',
    );
    expect(workflow).toContain('npm run start:production');
    expect(workflow).toContain('http://127.0.0.1:39001/health');
    expect(workflow).not.toContain('http://127.0.0.1:3000/health');
  });

  it('keeps the final result fail-closed and emits bounded immutable evidence', () => {
    expect(workflow).toContain('needs: [validate-refs, mobile, backend]');
    expect(workflow).toContain('if: always()');
    expect(workflow).toContain('REF_RESULT');
    expect(workflow).toContain('MOBILE_RESULT');
    expect(workflow).toContain('BACKEND_RESULT');
    expect(workflow).toContain('rollbackMobileSha');
    expect(workflow).toContain('rollbackBackendSha');
    expect(workflow).toContain('release-evidence.json');
    expect(workflow).toContain('retention-days: 30');
    expect(workflow).not.toMatch(/eas (?:build|update|submit)/iu);
    expect(workflow).not.toMatch(/kubectl|terraform apply|docker push/iu);
  });

  it('documents exact provenance, rollback ancestry and authorization boundaries', () => {
    expect(documentation).toContain('full 40-character mobile commit SHA');
    expect(documentation).toContain('full 40-character backend commit SHA');
    expect(documentation).toContain('previously validated rollback');
    expect(documentation).toContain('ancestor of the selected release commit');
    expect(documentation).toContain('EXPO_PUBLIC_SOURCE_COMMIT_SHA');
    expect(documentation).toContain('repository-wide file-size audit');
    expect(documentation).toContain('Expo export and Expo Doctor');
    expect(documentation).toContain(
      'migrated-schema and scoped-idempotency integration tests',
    );
    expect(documentation).toContain('does not replace physical-device validation');
  });
});
