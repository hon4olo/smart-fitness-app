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

describe('recovery check-in localization', () => {
  it('uses a bounded English/Russian copy contract and selected-locale formatting', () => {
    const screen = readSource('src/features/coach/screens/RecoveryCheckInScreen.tsx');
    const picker = readSource('src/features/coach/components/RecoveryScorePicker.tsx');
    const copy = readSource('src/localization/recoveryCheckInCopy.ts');

    expect(screen).toContain('getRecoveryCheckInCopy');
    expect(screen).toContain('formatDate');
    expect(screen).toContain('formatNumber');
    expect(screen).not.toContain('new Intl.DateTimeFormat');
    expect(picker).toContain('copy.clearField');
    expect(copy).toContain('Проверка восстановления');
    expect(copy).toContain('Recovery check-in');
    expect(copy).toContain('Продолжительность сна');
  });

  it('preserves stable validation behavior while localizing UI messages', () => {
    const screen = readSource('src/features/coach/screens/RecoveryCheckInScreen.tsx');
    const model = readSource('src/features/coach/recoveryCheckInForm.ts');

    expect(model).toContain('Sleep duration must be between 0 and 24 hours.');
    expect(model).toContain('Add at least two recovery signals before saving.');
    expect(screen).toContain('localizeValidationMessage');
    expect(screen).toContain('copy.validation.sleepRange');
    expect(screen).toContain('copy.validation.minimumSignals');
  });

  it('does not expose raw sync errors or audited fixed English controls', () => {
    const screen = readSource('src/features/coach/screens/RecoveryCheckInScreen.tsx');

    expect(screen).toContain('copy.syncIssue');
    expect(screen).not.toContain('{syncError}');
    for (const text of [
      'Recovery check-in saved and synchronized.',
      'Today’s signals',
      'Save recovery check-in',
      'Open Safety & Recovery review',
      'Unknown time',
    ]) {
      expect(screen).not.toContain(text);
    }
  });
});
