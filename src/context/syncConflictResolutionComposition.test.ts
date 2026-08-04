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

describe('sync conflict resolution composition', () => {
  it('binds the authenticated API client to persisted stores and normal sync', () => {
    const source = readSource('src/context/useSyncConflictResolution.ts');

    expect(source).toContain('createSyncConflictResolutionClient');
    expect(source).toContain('createSyncConflictResolutionIntentStore');
    expect(source).toContain('createSyncConflictStore');
    expect(source).toContain('getDefaultSyncCursorStore');
    expect(source).toContain('const { syncNow } = useWeightSync()');
    expect(source).toContain('synchronize: syncNow');
  });

  it('derives identity from auth context and exposes no user-owned request fields', () => {
    const source = readSource('src/context/useSyncConflictResolution.ts');

    expect(source).toContain('const { refresh, session } = useAuthSession()');
    expect(source).toContain('session?.tokens.accessToken');
    expect(source).toContain('session?.user.id');
    expect(source).not.toContain('userId: string');
    expect(source).not.toContain('idempotencyKey: string');
    expect(source).not.toContain('resolvedPayload');
  });

  it('keeps unauthenticated use fail closed before intent creation', () => {
    const source = readSource('src/context/useSyncConflictResolution.ts');
    const userCheck = source.indexOf('if (!userId)');
    const controllerCall = source.indexOf('controller.resolve(userId');

    expect(userCheck).toBeGreaterThan(-1);
    expect(controllerCall).toBeGreaterThan(userCheck);
    expect(source).toContain("status: 'authentication_required'");
  });
});
