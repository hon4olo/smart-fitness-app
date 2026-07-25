import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('pluralization source contract', () => {
  it('exports Intl.PluralRules-backed helpers from localization', () => {
    const implementation = readSource('src/localization/pluralization.ts');
    const barrel = readSource('src/localization/index.ts');

    expect(implementation).toContain('Intl.PluralRules');
    expect(implementation).toContain("ru: 'ru-RU'");
    expect(barrel).toContain('formatPlural');
    expect(barrel).toContain('selectPluralForm');
  });
});
