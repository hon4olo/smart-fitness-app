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

describe('Combined proposal localization', () => {
  it('localizes screen, review states, actions, restrictions, and findings', () => {
    const screen = readSource('src/features/coach/screens/CombinedCoachProposalScreen.tsx');
    const result = readSource('src/features/coach/components/CombinedCoachProposalResult.tsx');
    const copy = readSource('src/localization/combinedProposalCopy.ts');

    expect(screen).toContain('getCombinedProposalCopy');
    expect(result).toContain('getCombinedProposalCopy');
    expect(result).toContain('getUserLimitationsCopy');
    expect(result).toContain('copy.viewModelCopy');
    expect(copy).toContain('Объединённое предложение готово');
    expect(copy).toContain('Create effective Strength template');
    expect(copy).toContain('Применить цель питания');
  });

  it('uses selected units for Strength and Nutrition presentation', () => {
    const result = readSource('src/features/coach/components/CombinedCoachProposalResult.tsx');

    expect(result).toContain('useUnitPreferences');
    expect(result).toContain('formatWeightValue');
    expect(result).toContain('formatEnergyValue');
    expect(result).toContain('formatNumber');
    expect(result).not.toContain('proposed tonnage ${strength.proposedTonnage} kg');
    expect(result).not.toContain('${targets.calories} kcal');
  });

  it('preserves explicit confirmations, source revisions, idempotency, and separate mutations', () => {
    const screen = readSource('src/features/coach/screens/CombinedCoachProposalScreen.tsx');

    expect(screen).toContain('confirmCombinedEffectiveStrengthRun');
    expect(screen).toContain('confirmCombinedNutritionRun');
    expect(screen).toContain('getCombinedEffectiveStrengthConfirmationBlocker');
    expect(screen).toContain('sourceRevision');
    expect(screen).toContain("createIdempotencyKey('combined-effective-strength')");
    expect(screen).toContain("createIdempotencyKey('combined-nutrition')");
    expect(screen).toContain('app.upsertWorkoutTemplate');
    expect(screen).toContain('app.setNutritionTargets');
  });

  it('keeps the fail-closed parser and does not expose raw API or issue messages', () => {
    const screen = readSource('src/features/coach/screens/CombinedCoachProposalScreen.tsx');
    const result = readSource('src/features/coach/components/CombinedCoachProposalResult.tsx');
    const parser = readSource('src/features/coach/combinedCoachProposalViewModel.ts');

    expect(parser).toContain('automaticApplication !== false');
    expect(parser).toContain("run.domain !== 'combined'");
    expect(screen).not.toContain('requestError.message');
    expect(screen).not.toContain('confirmation.message');
    expect(result).not.toContain('issue.message');
    expect(result).not.toContain('viewModel.message');
    expect(screen).toContain('copy.requestFailed');
    expect(result).toContain('copy.issueMessage');
  });
});
