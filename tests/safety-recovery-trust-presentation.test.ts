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
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('Safety & Recovery trust presentation', () => {
  it('bounds preflight sync states with an EN/RU unknown fallback', () => {
    const copy = readSource('src/localization/safetyRecoveryPreflightCopy.ts');
    const screen = readSource(
      'src/features/coach/screens/SafetyRecoveryPreflightScreen.tsx',
    );

    expect(copy).toContain('isSyncState(status)');
    expect(copy).toContain('статус недоступен');
    expect(copy).toContain('status unavailable');
    expect(copy).toContain('нужна повторная попытка');
    expect(copy).toContain('retry needed');
    expect(screen).toContain('copy.syncLabel(String(status))');
    expect(screen).not.toContain('?? String(status)');
    expect(screen).not.toContain('syncLabels[String(status)]');
  });

  it('bounds run statuses, capability text and unknown limitation enums', () => {
    const copy = readSource('src/localization/safetyRecoveryReviewCopy.ts');
    const screen = readSource('src/features/coach/screens/SafetyRecoveryCoachScreen.tsx');

    expect(copy).toContain('runStatusLabel: (status: string)');
    expect(copy).toContain('Статус недоступен');
    expect(copy).toContain('Status unavailable');
    expect(copy).toContain("available: locale === 'ru' ? 'Доступно' : 'Available'");
    expect(copy).toContain('current account and server configuration');
    expect(screen).toContain('copy.runStatusLabel(run.run.status)');
    expect(screen).toContain('copy.unknownValue');
    expect(screen).not.toContain('?? run.run.status');
    expect(screen).not.toContain('humanizeCode');
    expect(screen).not.toContain('copy.runStatusLabels');
    expect(copy).not.toContain('Safety Recovery v5 available');
    expect(copy).not.toContain('capability v5 safety contract');
  });

  it('preserves readiness, sync, abort, polling, idempotency and snapshot contracts', () => {
    const preflight = readSource(
      'src/features/coach/screens/SafetyRecoveryPreflightScreen.tsx',
    );
    const review = readSource('src/features/coach/screens/SafetyRecoveryCoachScreen.tsx');

    expect(preflight).toContain('summary.reviewReady');
    expect(preflight).toContain('pendingOperations > 0');
    expect(preflight).toContain('conflictCount > 0');
    expect(preflight).toContain("status === 'offline'");
    expect(preflight).toContain('await syncNow()');
    expect(preflight).toContain("router.push('/profile/safety-recovery/review')");

    expect(review).toContain('capabilities?.safety?.deterministicRecoveryReview === true');
    expect(review).toContain('abortControllerRef.current?.abort()');
    expect(review).toContain('signal: abortController.signal');
    expect(review).toContain('coachApi.startSafetyRecoveryRun');
    expect(review).toContain('coachApi.waitForTerminalRun');
    expect(review).toContain('createIdempotencyKey(lookbackDays)');
    expect(review).toContain('buildSafetyRecoveryReviewSnapshot');
    expect(review).toContain('await reviewStore.set(snapshot)');
    expect(review).toContain('buildSafetyRecoveryViewModel(terminal)');
  });
});
