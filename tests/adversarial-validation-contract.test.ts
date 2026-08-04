import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('node:fs') as {
  readFileSync(path: string, encoding: string): string;
};
const { resolve } = require('node:path') as {
  resolve(...parts: string[]): string;
};

const projectRoot = resolve(__dirname, '..');
const workflow = readFileSync(
  resolve(projectRoot, '.github/workflows/adversarial-validation.yml'),
  'utf8',
);
const runner = readFileSync(
  resolve(projectRoot, 'scripts/run-expanded-sync-intent-model.mjs'),
  'utf8',
);

describe('bounded scheduled adversarial validation', () => {
  it('runs weekly or manually without replacing pull-request gates', () => {
    expect(workflow).toContain("cron: '17 3 * * 0'");
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('cancel-in-progress: false');
    expect(workflow).not.toContain('pull_request:');
    expect(workflow).not.toContain('push:');
  });

  it('expands the reviewed generated model within a hard bound', () => {
    expect(runner).toContain('DEFAULT_SEED_COUNT = 2_048');
    expect(runner).toContain('MIN_SEED_COUNT = 129');
    expect(runner).toContain('MAX_SEED_COUNT = 4_096');
    expect(runner).toContain(
      "SOURCE_LOOP = 'for (let seed = 1; seed <= 128; seed += 1)'",
    );
    expect(runner).toContain("suite: 'sync-conflict-resolution-intent-model'");
    expect(runner).toContain("result = 'passed'");
    expect(workflow).toContain("SYNC_INTENT_PROPERTY_SEED_COUNT: '2048'");
  });

  it('reuses deterministic PostgreSQL retry and transaction invariants', () => {
    expect(workflow).toContain('postgres:16-alpine');
    expect(workflow).toContain(
      'tests/sync-conflict-resolution-api-postgres.test.ts',
    );
    expect(workflow).toContain('tests/sync-idempotency-postgres.test.ts');
    expect(workflow).toContain(
      'tests/sync-transaction-rollback-postgres.test.ts',
    );
    expect(workflow).toContain('--maxWorkers=1 --no-file-parallelism');
    expect(workflow).toContain('git rev-parse HEAD');
  });

  it('retains exact-source evidence and fails closed', () => {
    expect(workflow).toContain('mobileSha');
    expect(workflow).toContain('backendSha');
    expect(workflow).toContain('mobileModelSeedCount');
    expect(workflow).toContain('retention-days: 30');
    expect(workflow).toContain('if: always()');
    expect(workflow).toContain('Adversarial validation failed');
  });

  it('does not introduce proxy, load, deployment, publication or production actions', () => {
    expect(workflow).not.toMatch(/toxiproxy|k6|100[- ]?vu/iu);
    expect(workflow).not.toMatch(/eas (?:build|update|submit)/iu);
    expect(workflow).not.toMatch(
      /kubectl|terraform apply|docker push|npm run provider:staging/iu,
    );
    expect(workflow).not.toContain('environment: production');
    expect(workflow).not.toContain('NODE_ENV: production');
  });
});
