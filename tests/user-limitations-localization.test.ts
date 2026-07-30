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

describe('user limitations localization', () => {
  it('maps stable limitation enums to bounded English/Russian labels', () => {
    const copy = readSource('src/localization/userLimitationsCopy.ts');
    const fields = readSource('src/features/coach/screens/UserLimitationFormFields.tsx');

    expect(copy).toContain('medical_restriction');
    expect(copy).toContain('Медицинское ограничение');
    expect(copy).toContain('avoid_movement');
    expect(copy).toContain('Избегать движения');
    expect(fields).toContain('getLimitationOptions');
    expect(fields).toContain('copy.bodyRegionLabels[limitation.bodyRegion]');
    expect(fields).not.toContain('formatCode');
    expect(fields).not.toContain('toUpperCase()');
  });

  it('localizes screen copy, counts, validation, dates, and safe sync state', () => {
    const screen = readSource('src/features/coach/screens/UserLimitationScreen.tsx');
    const fields = readSource('src/features/coach/screens/UserLimitationFormFields.tsx');

    expect(screen).toContain('getUserLimitationsCopy');
    expect(screen).toContain('formatNumber');
    expect(screen).toContain('localizeValidationMessage');
    expect(screen).toContain('copy.syncIssue');
    expect(screen).not.toContain('{syncError}');
    expect(fields).toContain('formatDate');
    expect(fields).toContain('copy.statusLabels[limitation.status]');
  });

  it('preserves persisted enum identifiers and validation-model messages', () => {
    const model = readSource('src/features/coach/userLimitationForm.ts');
    const copy = readSource('src/localization/userLimitationsCopy.ts');

    expect(model).toContain("status: 'active'");
    expect(model).toContain("input.draft.trainingImpact === 'avoid_movement'");
    expect(model).toContain('Select a limitation type.');
    expect(copy).toContain('copy');
  });

  it('removes audited fixed English controls from screen components', () => {
    const source = [
      readSource('src/features/coach/screens/UserLimitationScreen.tsx'),
      readSource('src/features/coach/screens/UserLimitationFormFields.tsx'),
    ].join('\n');

    for (const text of [
      'Training limitations',
      'Current records',
      'No limitations have been added.',
      'Save limitation',
      'Mark resolved',
      'Reactivate',
      'Movement patterns',
    ]) {
      expect(source).not.toContain(`>${text}<`);
      expect(source).not.toContain(`"${text}"`);
    }
  });
});
