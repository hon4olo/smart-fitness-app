import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

describe('user-visible data recovery actions', () => {
  it('surfaces in-session retry and durable journal replay on Data and Sync', () => {
    const screen = readSource('src/app/sync-backup.tsx');
    const recovery = readSource('src/features/settings/DataRecoveryCard.tsx');

    expect(screen).toContain('<DataRecoveryCard />');
    expect(recovery).toContain('mutationFailure');
    expect(recovery).toContain('retryFailedMutation');
    expect(recovery).toContain('getDefaultAppMutationOutboxRecoveryStore');
    expect(recovery).toContain('recoverAppMutationOutbox');
    expect(recovery).toContain('recoveryStore.list()');
    expect(recovery).not.toContain('recoveryStore.clear');
  });

  it('does not display raw persistence exception messages', () => {
    const notice = readSource('src/context/appContext/AppMutationFailureNotice.tsx');

    expect(notice).not.toContain('{failure.message}');
    expect(notice).toContain('safeMessage');
    expect(notice).toContain('getDataRecoveryCopy');
  });

  it('records recovery completion in the focused roadmap', () => {
    const roadmap = readSource('docs/roadmap/data-quality-and-scale.md');

    expect(roadmap).toContain('failed local persistence exposes a safe retry action');
    expect(roadmap).toContain('durable outbox recovery records are counted');
  });
});
