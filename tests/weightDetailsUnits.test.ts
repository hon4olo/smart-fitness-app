import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');

const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('weight details unit boundary', () => {
  it('renders charts and recent history through the selected weight unit', () => {
    const source = readSource('src/app/weight-details.tsx');
    const copy = readSource('src/localization/weightDetailsCopy.ts');

    expect(source).toContain('useUnitPreferences');
    expect(source).toContain('weightFromKg(entry.weight, weightUnit)');
    expect(source).toContain('formatWeightValue(entry.weight)');
    expect(source).toContain('copy.recentWeighIns');
    expect(copy).toContain('Recent weigh-ins');
    expect(source).toContain('${weightUnit}');
    expect(source).not.toContain('entry.weight.toFixed(1)} kg');
    expect(source).not.toContain("delta30Days, 'kg'");
  });
});
