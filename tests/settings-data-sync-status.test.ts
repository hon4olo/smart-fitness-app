import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

describe('Settings Data and Sync status', () => {
  it('surfaces the existing sync contract without exposing raw errors', () => {
    const settings = readSource('src/app/settings/index.tsx');
    const details = readSource('src/app/sync-backup.tsx');
    const card = readSource('src/features/settings/SyncSettingsCard.tsx');
    const copy = readSource('src/features/settings/syncStatusCopy.ts');

    expect(settings).toContain('<SyncSettingsCard />');
    expect(card).toContain("router.push('/sync-backup')");
    expect(details).toContain('pendingOperations');
    expect(details).toContain('conflictCount');
    expect(details).toContain('syncNow()');
    expect(details).not.toContain('{error ?');
    expect(copy).toContain("'local-only': 'Local only'");
    expect(copy).toContain("'local-only': 'Только на устройстве'");
    expect(copy).toContain('Your local data remains available');
  });
});
