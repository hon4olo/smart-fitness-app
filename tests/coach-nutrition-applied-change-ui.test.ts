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

describe('Coach Nutrition applied change history UI', () => {
  it('parses and renders bounded before-after metadata fail closed', () => {
    const screen = readSource(
      'src/features/coach/screens/CoachRunHistoryDetailScreen.tsx',
    );
    const card = readSource(
      'src/features/coach/components/NutritionAppliedChangeCard.tsx',
    );

    expect(screen).toContain('parseCoachNutritionAppliedChanges');
    expect(screen).toContain('<NutritionAppliedChangeCard');
    expect(screen).toContain('invalid={nutritionChangeState.invalid}');
    expect(card).toContain('summary.before');
    expect(card).toContain('summary.after');
    expect(card).toContain('copy.rationaleCode(code)');
    expect(card).toContain('formatEnergyValue(values.calories)');
  });

  it('does not render raw Coach context, provider output, or entity identifiers', () => {
    const card = readSource(
      'src/features/coach/components/NutritionAppliedChangeCard.tsx',
    );

    expect(card).not.toContain('contextSnapshot');
    expect(card).not.toContain('providerOutput');
    expect(card).not.toContain('entityId');
    expect(card).not.toContain('sourceFingerprint');
  });
});
