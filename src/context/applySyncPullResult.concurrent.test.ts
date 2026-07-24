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

describe('concurrent local mutation during sync pull', () => {
  it('reads current application state only after asynchronous metadata loading completes', () => {
    const source = readSource('src/context/applySyncPullResult.ts');
    const metadataLoad = source.indexOf('await Promise.all([');
    const currentStateRead = source.indexOf('const currentState = getState();');
    const firstRemoteApply = source.indexOf('applyRemoteWeightHistoryChanges(');

    expect(metadataLoad).toBeGreaterThan(-1);
    expect(currentStateRead).toBeGreaterThan(metadataLoad);
    expect(firstRemoteApply).toBeGreaterThan(currentStateRead);
    expect(source).not.toContain('state: AppState;');
  });

  it('passes a live state accessor from SyncContext instead of a captured state snapshot', () => {
    const source = readSource('src/context/SyncContext.tsx');

    expect(source).toContain('getState: () => latestStateRef.current');
    expect(source).not.toContain('state: latestStateRef.current');
  });
});
