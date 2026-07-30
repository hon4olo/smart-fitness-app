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

describe('Nutrition Coach localization', () => {
  it('localizes screen, metrics, review and strategy presentation', () => {
    const screen = readSource('src/features/coach/screens/NutritionCoachScreen.tsx');
    const cards = readSource('src/features/coach/components/NutritionCoachResultCards.tsx');
    const metrics = readSource('src/features/coach/components/NutritionCoachReviewMetrics.tsx');
    const strategy = readSource('src/features/coach/components/NutritionStrategyProposalView.tsx');
    const copy = readSource('src/localization/nutritionCoachCopy.ts');

    expect(screen).toContain('getNutritionCoachCopy');
    expect(cards).toContain('NutritionCoachCopy');
    expect(metrics).toContain('NutritionCoachCopy');
    expect(strategy).toContain('NutritionCoachCopy');
    expect(copy).toContain('Проверенный анализ питания');
    expect(copy).toContain('Применить strategy к целям');
  });

  it('uses selected locale and central unit boundaries without direct Intl', () => {
    const source = [
      readSource('src/features/coach/screens/NutritionCoachScreen.tsx'),
      readSource('src/features/coach/components/NutritionCoachReviewMetrics.tsx'),
      readSource('src/features/coach/components/NutritionStrategyProposalView.tsx'),
    ].join('\n');
    const units = readSource('src/units/unitPreferences.ts');

    expect(source).toContain('formatEnergyValue');
    expect(source).toContain('formatWeightValue');
    expect(source).toContain('useUnitPreferences');
    expect(source).toContain('proteinRatioUnitForWeight');
    expect(source).toContain('proteinRatioFromPerKg');
    expect(units).toContain("export type ProteinRatioUnit = 'g/kg' | 'g/lb'");
    expect(source).not.toContain("weight === 'lb'");
    expect(source).not.toContain('new Intl.NumberFormat');
    expect(source).not.toContain('new Intl.DateTimeFormat');
  });

  it('preserves abort, polling, capability and explicit confirmation gates', () => {
    const screen = readSource('src/features/coach/screens/NutritionCoachScreen.tsx');

    expect(screen).toContain('abortControllerRef.current?.abort()');
    expect(screen).toContain('coachApi.waitForTerminalRun');
    expect(screen).toContain('structuredStrategyProposal');
    expect(screen).toContain('structuredStrategyConfirmation');
    expect(screen).toContain('coachApi.confirmRun');
    expect(screen).toContain('createConfirmationIdempotencyKey');
    expect(screen).toContain('await syncNow()');
  });

  it('does not expose raw provider, rejection or issue messages', () => {
    const screen = readSource('src/features/coach/screens/NutritionCoachScreen.tsx');
    const cards = readSource('src/features/coach/components/NutritionCoachResultCards.tsx');
    const strategy = readSource('src/features/coach/components/NutritionStrategyProposalView.tsx');

    expect(screen).not.toContain('capabilityError.message');
    expect(screen).not.toContain('requestError.message');
    expect(screen).not.toContain('confirmationError.message');
    expect(cards).not.toContain('viewModel.message');
    expect(cards).not.toContain('viewModel.reason');
    expect(cards).not.toContain('issue.message');
    expect(strategy).not.toContain('issue.message');
    expect(screen).toContain('copy.reviewFailed');
    expect(strategy).toContain('copy.typedIssue');
  });
});
