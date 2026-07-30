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

describe('Weight Details localization', () => {
  it('uses bounded English/Russian copy and selected-locale formatting', () => {
    const screen = readSource('src/app/weight-details.tsx');
    const copy = readSource('src/localization/weightDetailsCopy.ts');

    expect(screen).toContain('getWeightDetailsCopy');
    expect(screen).toContain('formatDate');
    expect(screen).toContain('formatNumber');
    expect(copy).toContain('Динамика веса');
    expect(copy).toContain('Weight details');
    expect(copy).toContain('История тренировок');
  });

  it('preserves canonical analytics while presenting selected kg/lb values', () => {
    const screen = readSource('src/app/weight-details.tsx');

    expect(screen).toContain('getProgressAnalytics');
    expect(screen).toContain('weightFromKg');
    expect(screen).toContain('formatWeightValue(entry.weight, weightUnit)');
    expect(screen).toContain('formatWeightValue(analytics.weight.currentWeight, weightUnit)');
    expect(screen).toContain("router.push('/workout-history')");
  });

  it('removes audited fixed English controls from the route', () => {
    const screen = readSource('src/app/weight-details.tsx');

    for (const text of [
      'Weight details',
      'Detailed trend view.',
      'Current weight',
      'Recent weigh-ins',
      'Open workout history',
      'No 30-day comparison yet',
    ]) {
      expect(screen).not.toContain(`>${text}<`);
      expect(screen).not.toContain(`"${text}"`);
    }
  });
});
