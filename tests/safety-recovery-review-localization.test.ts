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

describe('Safety Recovery review localization', () => {
  it('localizes review states, periods, result metrics, restrictions, and findings', () => {
    const screen = readSource('src/features/coach/screens/SafetyRecoveryCoachScreen.tsx');
    const copy = readSource('src/localization/safetyRecoveryReviewCopy.ts');

    expect(screen).toContain('getSafetyRecoveryReviewCopy');
    expect(screen).toContain('getUserLimitationsCopy');
    expect(screen).toContain('copy.viewModelCopy');
    expect(screen).toContain('copy.issueCopy');
    expect(screen).toContain('copy.readinessStatusLabels');
    expect(copy).toContain('Тренировку следует изменить');
    expect(copy).toContain('Recovery check-in required');
    expect(copy).toContain('LIMITATION_MOVEMENT_AVOIDANCE_REQUIRED');
  });

  it('uses selected-locale date and number boundaries instead of direct Intl formatting', () => {
    const screen = readSource('src/features/coach/screens/SafetyRecoveryCoachScreen.tsx');

    expect(screen).toContain('formatDate');
    expect(screen).toContain('formatNumber');
    expect(screen).not.toContain('new Intl.DateTimeFormat');
    expect(screen).toContain('copy.hoursAgo');
    expect(screen).toContain('copy.days');
  });

  it('preserves deterministic API lifecycle and fail-closed view-model parsing', () => {
    const screen = readSource('src/features/coach/screens/SafetyRecoveryCoachScreen.tsx');
    const viewModel = readSource('src/features/coach/safetyRecoveryViewModel.ts');

    expect(screen).toContain('startSafetyRecoveryRun');
    expect(screen).toContain('waitForTerminalRun');
    expect(screen).toContain('buildSafetyRecoveryReviewSnapshot');
    expect(screen).toContain("requestError.name === 'AbortError'");
    expect(viewModel).toContain('approvedForAutomaticApply !== false');
    expect(viewModel).toContain("run.domain !== 'safety_recovery'");
  });

  it('does not expose raw capability, request, run, or issue error messages', () => {
    const screen = readSource('src/features/coach/screens/SafetyRecoveryCoachScreen.tsx');

    expect(screen).not.toContain('capabilityError.message');
    expect(screen).not.toContain('requestError.message');
    expect(screen).not.toContain('issue.message');
    expect(screen).not.toContain('viewModel.message');
    expect(screen).toContain('copy.requestErrorBody');
    expect(screen).toContain('issuePresentation.message');
  });
});
