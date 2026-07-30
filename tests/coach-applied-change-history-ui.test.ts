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
const readSource = (file: string) =>
  readFileSync(resolve(projectRoot, file), 'utf8');

describe('Coach applied change history UI', () => {
  it('parses and renders Nutrition, Strength, and Combined Strength summaries fail closed', () => {
    const screen = readSource(
      'src/features/coach/screens/CoachRunHistoryDetailScreen.tsx',
    );
    const card = readSource(
      'src/features/coach/components/CoachAppliedChangeCard.tsx',
    );

    expect(screen).toContain('parseCoachAppliedChanges');
    expect(screen).toContain('<CoachAppliedChangeCard');
    expect(screen).toContain('invalid={appliedChangeState.invalid}');
    expect(card).toContain("change.summary.kind === 'nutrition_targets'");
    expect(card).toContain("change.summary.kind === 'strength_template'");
    expect(card).toContain('<CombinedStrengthChange');
    expect(card).toContain('maximumAllowedWeight');
    expect(card).toContain('effectiveWeight');
  });

  it('uses localized units and keeps raw Coach data outside the rendering surface', () => {
    const card = readSource(
      'src/features/coach/components/CoachAppliedChangeCard.tsx',
    );
    const parser = readSource('src/api/coach/appliedChangeSummary.ts');

    expect(card).toContain('units.formatWeightValue');
    expect(card).toContain('units.formatEnergyValue');
    expect(card).not.toContain('contextSnapshot');
    expect(card).not.toContain('providerOutput');
    expect(card).not.toContain('entityId');
    expect(parser).not.toContain('email:');
    expect(parser).not.toContain('sourceFingerprint');
  });

  it('removes hard-coded Status labels from the completed detail surface', () => {
    const screen = readSource(
      'src/features/coach/screens/CoachRunHistoryDetailScreen.tsx',
    );

    expect(screen).toContain('label={copy.statusLabel}');
    expect(screen).not.toContain('label="Status"');
  });
});
