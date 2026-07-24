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

    expect(source).toContain('conflictStore.list(userId)');
    expect(source).toContain('setConflictCount(conflicts.length)');
  });

  it('persists conflict snapshots before deciding whether pull cursor may advance', () => {
    const source = readSource('src/context/SyncContext.tsx');
    const persistIndex = source.indexOf(
      'await conflictStore.merge(session.user.id, snapshots)',
    );
    const pullApplyIndex = source.indexOf('await applySyncPullResult({');

    expect(persistIndex).toBeGreaterThan(-1);
    expect(pullApplyIndex).toBeGreaterThan(persistIndex);
    expect(source).toContain('persistedConflicts.length');
    expect(source).toContain('nextConflictCount,');
  });
});
