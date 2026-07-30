import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('locale-aware unit formatting', () => {
  it('formats converted units through the selected application locale', () => {
    const provider = readSource('src/units/UnitPreferencesProvider.tsx');

    expect(provider).toContain("import { useLocalization } from '@/localization'");
    expect(provider).toContain('formatNumber(weightFromKg');
    expect(provider).toContain('formatNumber(lengthFromCm');
    expect(provider).toContain('formatNumber(energyFromKcal');
  });

  it('uses locale-aware numbers and dates on weight details', () => {
    const screen = readSource('src/app/weight-details.tsx');

    expect(screen).toContain('const { formatDate, formatNumber, locale } = useLocalization()');
    expect(screen).toContain('formatWeightValue(entry.weight)');
    expect(screen).toContain("formatDate(value, { day: 'numeric', month: 'short' })");
    expect(screen).not.toContain('.toFixed(1)');
  });
});
