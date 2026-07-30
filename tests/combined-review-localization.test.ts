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

describe('Combined review localization', () => {
  it('localizes the read-only screen and typed domain presentation', () => {
    const screen = readSource('src/features/coach/screens/CombinedCoachScreen.tsx');
    const copy = readSource('src/localization/combinedReviewCopy.ts');

    expect(screen).toContain('getCombinedReviewCopy');
    expect(screen).toContain('copy.viewModelCopy');
    expect(screen).toContain('copy.statusLabels');
    expect(copy).toContain('Объединённый анализ готов');
    expect(copy).toContain('Проверить Safety-входы');
    expect(copy).toContain('Combined Coach is read-only');
  });

  it('uses selected locale and units without direct Intl formatting', () => {
    const screen = readSource('src/features/coach/screens/CombinedCoachScreen.tsx');

    expect(screen).toContain('useLocalization');
    expect(screen).toContain('useUnitPreferences');
    expect(screen).toContain('formatWeightValue');
    expect(screen).toContain('formatEnergyValue');
    expect(screen).not.toContain('new Intl.NumberFormat');
    expect(screen).not.toContain("' kg'");
    expect(screen).not.toContain("' kcal'");
  });

  it('preserves child-run aggregation and the automatic-apply prohibition', () => {
    const screen = readSource('src/features/coach/screens/CombinedCoachScreen.tsx');
    const viewModel = readSource('src/features/coach/combinedCoachViewModel.ts');

    expect(screen).toContain('coachApi.startCombinedRun');
    expect(screen).toContain('coachApi.waitForTerminalRun');
    expect(screen).toContain('createIdempotencyKey');
    expect(screen).toContain('capabilities.combined.automaticApplication === false');
    expect(viewModel).toContain('review.automaticApplication !== false');
    expect(viewModel).toContain('childStrength !== strength.runId');
    expect(viewModel).toContain('automaticApplication: false');
  });

  it('does not expose raw provider, run, or issue messages', () => {
    const screen = readSource('src/features/coach/screens/CombinedCoachScreen.tsx');

    expect(screen).not.toContain('requestError.message');
    expect(screen).not.toContain('issue.message');
    expect(screen).not.toContain('viewModel.message');
    expect(screen).toContain('copy.requestErrorBody');
    expect(screen).toContain('copy.issueMessage');
  });
});
