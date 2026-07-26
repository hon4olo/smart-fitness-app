import { describe, expect, it } from 'vitest';

import { enMessages, ruMessages } from '@/localization/messages';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

describe('Settings sync conflict review', () => {
  it('lists persisted conflicts without exposing IDs or payload values', () => {
    const screen = readSource('src/app/sync-backup.tsx');
    const card = readSource('src/features/settings/SyncConflictReviewCard.tsx');
    const copy = readSource('src/features/settings/syncConflictCopy.ts');

    expect(screen).toContain('<SyncConflictReviewCard />');
    expect(card).toContain('conflictStore.list(userId)');
    expect(card).toContain('getSyncConflictEntityLabel');
    expect(card).toContain('formatDate(conflict.detectedAt');
    expect(card).not.toContain('conflict.entityId');
    expect(card).not.toContain('conflict.details');
    expect(card).not.toContain('conflict.reason');
    expect(copy).toContain("retryExplanation: t('syncConflict.retryExplanation')");
    expect(enMessages['syncConflict.retryExplanation']).toContain('does not delete local data');
    expect(ruMessages['syncConflict.retryExplanation']).toContain('не удаляет локальные данные');
  });

  it('retries the existing deterministic resolver through syncNow', () => {
    const card = readSource('src/features/settings/SyncConflictReviewCard.tsx');
    const roadmap = readSource('docs/roadmap/data-quality-and-scale.md');

    expect(card).toContain('await syncNow()');
    expect(card).toContain('await loadConflicts()');
    expect(card).not.toContain('conflictStore.remove');
    expect(card).not.toContain('conflictStore.clear');
    expect(roadmap).toContain('without deleting either version');
    expect(roadmap).toContain('local-versus-account choice contract');
  });
});
