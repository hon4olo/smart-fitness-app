import { describe, expect, it } from 'vitest';

import { getSyncConflictResolutionUiCopy } from '@/localization/syncConflictResolutionMessages';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

describe('Settings sync conflict review', () => {
  it('shows only safe candidate metadata and version kinds', () => {
    const screen = readSource('src/app/sync-backup.tsx');
    const card = readSource('src/features/settings/SyncConflictReviewCard.tsx');

    expect(screen).toContain('<SyncConflictReviewCard />');
    expect(card).toContain('useSyncConflictResolution');
    expect(card).toContain('listReviewItems');
    expect(card).toContain('getSyncConflictEntityLabel');
    expect(card).toContain('formatDate(candidate.detectedAt');
    expect(card).toContain('candidate.localKind');
    expect(card).toContain('candidate.remoteKind');
    expect(card).not.toContain('candidate.entityId');
    expect(card).not.toContain('candidate.expectedConflictRevision');
    expect(card).not.toContain('candidate.expectedRemoteRevision');
    expect(card).not.toContain('getSyncConflictDiagnosticItems');
    expect(card).not.toContain('conflict.details');
  });

  it('requires an explicit choice and confirmation before submission', () => {
    const card = readSource('src/features/settings/SyncConflictReviewCard.tsx');

    expect(card).toContain("confirmResolution(item, 'keep_local')");
    expect(card).toContain("confirmResolution(item, 'keep_remote')");
    expect(card).toContain('Alert.alert(');
    expect(card).toContain('resolutionCopy.confirm');
    expect(card).toContain('resolve(item.candidate!, choice)');
    expect(card).toContain('disabled={isBusy}');
    expect(card).not.toContain('automatic');
  });

  it('locks a persisted choice and resumes it through the durable workflow', () => {
    const card = readSource('src/features/settings/SyncConflictReviewCard.tsx');
    const hook = readSource('src/context/useSyncConflictResolution.ts');

    expect(card).toContain('intentChoice !== null && intentState !== null');
    expect(card).toContain('resumeResolution(item)');
    expect(card).toContain('isSyncConflictIntentSubmitting');
    expect(hook).toContain('controller.resume(userId, item.conflictId)');
    expect(card).not.toContain('idempotencyKey');
  });

  it('keeps English and Russian choice copy equivalent and bounded', () => {
    const en = getSyncConflictResolutionUiCopy('en');
    const ru = getSyncConflictResolutionUiCopy('ru');

    expect(Object.keys(ru)).toEqual(Object.keys(en));
    expect(en.useDeviceVersion).toContain('device');
    expect(en.useAccountVersion).toContain('account');
    expect(ru.useDeviceVersion).toContain('устройства');
    expect(ru.useAccountVersion).toContain('аккаунта');
    expect(`${en.confirmDeviceBody} ${en.confirmAccountBody}`).not.toMatch(
      /payload|revision|idempotency|entity id/i,
    );
    expect(`${ru.confirmDeviceBody} ${ru.confirmAccountBody}`).not.toMatch(
      /payload|revision|idempotency|entity id/i,
    );
  });
});
