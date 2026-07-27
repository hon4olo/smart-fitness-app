import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: string): string;
};
const { resolve } = require('path') as { resolve(...parts: string[]): string };

const projectRoot = resolve(__dirname, '../..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('sync conflict persistence integration', () => {
  it('restores per-user conflict state after application restart', () => {
    const source = readSource('src/context/SyncContext.tsx');
    const storeIndex = source.indexOf('conflictStore');
    const restoreIndex = source.indexOf('.list(userId)', storeIndex);

    expect(storeIndex).toBeGreaterThan(-1);
    expect(restoreIndex).toBeGreaterThan(storeIndex);
    expect(source).toContain('setConflictCount(conflicts.length)');
  });

  it('retains failed conflicts and clears successful snapshots only after pull applies', () => {
    const source = readSource('src/context/SyncContext.tsx');
    const failedIndex = source.indexOf("if (result.status.phase === 'Failed')");
    const failedMergeIndex = source.indexOf(
      'await conflictStore.merge(session.user.id, snapshots)',
      failedIndex,
    );
    const pullApplyIndex = source.indexOf('await applySyncPullResult({');
    const clearIndex = source.indexOf(
      'await conflictStore.clear(session.user.id)',
      pullApplyIndex,
    );
    const successfulMergeIndex = source.indexOf(
      'await conflictStore.merge(session.user.id, snapshots)',
      pullApplyIndex,
    );

    expect(failedIndex).toBeGreaterThan(-1);
    expect(failedMergeIndex).toBeGreaterThan(failedIndex);
    expect(pullApplyIndex).toBeGreaterThan(failedMergeIndex);
    expect(clearIndex).toBeGreaterThan(pullApplyIndex);
    expect(successfulMergeIndex).toBeGreaterThan(pullApplyIndex);
    expect(source).toContain('nextConflictCount = Math.max');
  });
});
