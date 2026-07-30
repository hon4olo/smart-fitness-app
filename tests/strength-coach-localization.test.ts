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

const auditedPresentation = () =>
  [
    readSource('src/features/coach/screens/StrengthCoachScreen.tsx'),
    readSource('src/features/coach/components/StrengthCoachResultCard.tsx'),
    readSource('src/features/coach/components/StrengthStrategyProposalView.tsx'),
  ].join('\n');

describe('Strength Coach localization', () => {
  it('provides bounded English and Russian copy across the linked flow', () => {
    const screen = readSource('src/features/coach/screens/StrengthCoachScreen.tsx');
    const resultCard = readSource(
      'src/features/coach/components/StrengthCoachResultCard.tsx',
    );
    const strategy = readSource(
      'src/features/coach/components/StrengthStrategyProposalView.tsx',
    );
    const copy = readSource('src/localization/strengthCoachCopy.ts');

    expect(screen).toContain('getStrengthCoachCopy');
    expect(resultCard).toContain('StrengthCoachCopy');
    expect(strategy).toContain('StrengthCoachCopy');
    expect(copy).toContain('Силовой тренер');
    expect(copy).toContain('Шаблон тренировки создан');
    expect(copy).toContain('Strength Coach');
    expect(copy).toContain('Workout template created');
  });

  it('uses selected locale and weight boundaries without direct presentation Intl', () => {
    const source = auditedPresentation();

    expect(source).toContain('useLocalization');
    expect(source).toContain('useUnitPreferences');
    expect(source).toContain('weightFromKg');
    expect(source).not.toContain('new Intl.DateTimeFormat');
    expect(source).not.toContain('new Intl.NumberFormat');
    expect(source).not.toContain('toLocaleString');
    expect(source).not.toMatch(/['"`]\s*kg\b/);
    expect(source).not.toMatch(/\bkg\s*×/);
  });

  it('preserves all request types, abort, polling and idempotency contracts', () => {
    const screen = readSource('src/features/coach/screens/StrengthCoachScreen.tsx');

    expect(screen).toContain("'session_review'");
    expect(screen).toContain("'next_workout_proposal'");
    expect(screen).toContain("'strength_strategy_proposal'");
    expect(screen).toContain('abortControllerRef.current?.abort()');
    expect(screen).toContain('coachApi.waitForTerminalRun');
    expect(screen).toContain('intervalMs: 750');
    expect(screen).toContain('maxPolls: 20');
    expect(screen).toContain('createIdempotencyKey');
    expect(screen).toContain('createConfirmationKey');
    expect(screen).toContain('structuredStrategyProposal');
    expect(screen).toContain('structuredStrategyConfirmation');
  });

  it('keeps explicit confirmation, sync and new-template semantics', () => {
    const screen = readSource('src/features/coach/screens/StrengthCoachScreen.tsx');
    const copy = readSource('src/localization/strengthCoachCopy.ts');

    expect(screen).toContain('coachApi.confirmRun');
    expect(screen).toContain('await syncNow()');
    expect(screen).not.toContain('setWorkoutSessions');
    expect(screen).not.toContain('updateWorkoutSession');
    expect(copy).toContain('The completed source workout will not be changed.');
    expect(copy).toContain('Завершённая исходная тренировка не изменится.');
  });

  it('does not expose raw request, confirmation, view-model, issue or provider messages', () => {
    const source = auditedPresentation();

    expect(source).not.toContain('requestError.message');
    expect(source).not.toContain('confirmationError.message');
    expect(source).not.toContain('viewModel.message');
    expect(source).not.toContain('issue.message');
    expect(source).not.toContain('viewModel.provider');
    expect(source).not.toContain('viewModel.model');
    expect(source).not.toContain('.toUpperCase()');
    expect(source).toContain('copy.rejectionCopy');
    expect(source).toContain('copy.issueLabel');
  });
});
