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

describe('Combined Coach trust presentation', () => {
  it('provides bounded EN/RU capability and sync states with an unknown fallback', () => {
    const copy = readSource('src/localization/combinedCoachTrustCopy.ts');

    expect(copy).toContain("'checking'");
    expect(copy).toContain("'sign_in'");
    expect(copy).toContain("'available'");
    expect(copy).toContain("'unavailable'");
    expect(copy).toContain('доступно после входа');
    expect(copy).toContain('available after sign-in');
    expect(copy).toContain('статус недоступен');
    expect(copy).toContain('status unavailable');
    expect(copy).toContain('isKnownSyncState(status)');
    expect(copy).not.toContain('return status;');
  });

  it('does not expose schema versions or raw sync statuses in standalone screens', () => {
    const review = readSource('src/features/coach/screens/CombinedCoachScreen.tsx');
    const proposal = readSource(
      'src/features/coach/screens/CombinedCoachProposalScreen.tsx',
    );
    const presentation = `${review}\n${proposal}`;

    expect(review).toContain('trustCopy.capabilityLabel(capabilityPresentation)');
    expect(proposal).toContain('trustCopy.capabilityLabel(capabilityPresentation)');
    expect(review).toContain('trustCopy.syncLabel(syncStatus)');
    expect(proposal).toContain('trustCopy.syncLabel(syncStatus)');
    expect(review).toContain('trustCopy.unavailableHint');
    expect(presentation).not.toContain('?? syncStatus');
    expect(presentation).not.toContain('syncLabels[syncStatus]');
    expect(presentation).not.toContain('`v${capabilities.schemaVersion}`');
    expect(presentation).not.toContain('copy.capabilityAvailable');
    expect(presentation).not.toContain('copy.capabilityHint');
  });

  it('preserves exact capability gates, polling, idempotency and explicit mutations', () => {
    const review = readSource('src/features/coach/screens/CombinedCoachScreen.tsx');
    const proposal = readSource(
      'src/features/coach/screens/CombinedCoachProposalScreen.tsx',
    );

    expect(review).toContain('capabilities?.schemaVersion === 6');
    expect(review).toContain('capabilities.combined?.deterministicReview === true');
    expect(review).toContain('capabilities.combined.automaticApplication === false');
    expect(review).toContain('coachApi.startCombinedRun');
    expect(review).toContain('coachApi.waitForTerminalRun');
    expect(review).toContain('createIdempotencyKey');

    expect(proposal).toContain('capabilities.schemaVersion >= 7');
    expect(proposal).toContain('capabilities.schemaVersion >= 8');
    expect(proposal).toContain('capabilities?.schemaVersion === 9');
    expect(proposal).toContain("requestType: 'combined_proposal_review'");
    expect(proposal).toContain('coachApi.waitForTerminalRun');
    expect(proposal).toContain('createRunIdempotencyKey');
    expect(proposal).toContain('coachApi.confirmCombinedEffectiveStrength');
    expect(proposal).toContain('coachApi.confirmCombinedNutrition');
    expect(proposal).toContain('createStrengthConfirmationKey');
    expect(proposal).toContain('createNutritionConfirmationKey');
  });
});
