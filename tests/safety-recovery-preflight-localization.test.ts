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

describe('Safety Recovery preflight localization', () => {
  it('localizes readiness reasons and selected-locale formatting', () => {
    const screen = readSource(
      'src/features/coach/screens/SafetyRecoveryPreflightScreen.tsx',
    );
    const copy = readSource('src/localization/safetyRecoveryPreflightCopy.ts');

    expect(screen).toContain('getSafetyRecoveryPreflightCopy');
    expect(screen).toContain('formatDate');
    expect(screen).toContain('formatNumber');
    expect(screen).not.toContain('new Intl.DateTimeFormat');
    expect(copy).toContain('Проверка восстановления устарела');
    expect(copy).toContain('Local data is ready');
    expect(copy).toContain('missing_check_in');
  });

  it('preserves deterministic readiness and synchronization gates', () => {
    const screen = readSource(
      'src/features/coach/screens/SafetyRecoveryPreflightScreen.tsx',
    );

    expect(screen).toContain('summary.reviewReady');
    expect(screen).toContain("status === 'conflict'");
    expect(screen).toContain("status === 'offline'");
    expect(screen).toContain('pendingOperations > 0');
    expect(screen).toContain('conflictCount > 0');
    expect(screen).toContain("router.push('/profile/safety-recovery/review')");
  });

  it('uses bounded sync copy and always clears local loading state', () => {
    const screen = readSource(
      'src/features/coach/screens/SafetyRecoveryPreflightScreen.tsx',
    );

    expect(screen).toContain('copy.syncIssue');
    expect(screen).not.toContain('{error}');
    expect(screen).toContain('copy.syncAttemptCompleted');
    expect(screen).toContain('copy.syncAttemptFailed');
    expect(screen).toContain('finally');
    expect(screen).toContain('setSyncing(false)');
  });

  it('removes audited fixed English controls from the screen', () => {
    const screen = readSource(
      'src/features/coach/screens/SafetyRecoveryPreflightScreen.tsx',
    );

    for (const text of [
      'Safety & Recovery',
      'Synchronization gate',
      'Synchronize records',
      'Continue to readiness review',
      'Sign in required',
      'Latest signals',
    ]) {
      expect(screen).not.toContain(`>${text}<`);
      expect(screen).not.toContain(`"${text}"`);
    }
  });
});
