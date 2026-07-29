import { afterEach, describe, expect, it } from 'vitest';

import { formatPlural } from '../src/localization/pluralization';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: string): string;
};
const { resolve } = require('path') as { resolve(...parts: string[]): string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');
const originalPluralRules = Intl.PluralRules;

const disablePluralRules = () => {
  Object.defineProperty(Intl, 'PluralRules', {
    configurable: true,
    value: undefined,
    writable: true,
  });
};

afterEach(() => {
  Object.defineProperty(Intl, 'PluralRules', {
    configurable: true,
    value: originalPluralRules,
    writable: true,
  });
});

describe('release runtime regressions', () => {
  it('formats English and Russian plurals when Hermes has no Intl.PluralRules', () => {
    disablePluralRules();

    const english = { one: '{count} set', other: '{count} sets' };
    const russian = {
      one: '{count} подход',
      few: '{count} подхода',
      many: '{count} подходов',
      other: '{count} подхода',
    };

    expect(formatPlural('en', 1, english)).toBe('1 set');
    expect(formatPlural('en', 2, english)).toBe('2 sets');
    expect(formatPlural('ru', 1, russian)).toBe('1 подход');
    expect(formatPlural('ru', 2, russian)).toBe('2 подхода');
    expect(formatPlural('ru', 5, russian)).toBe('5 подходов');
    expect(formatPlural('ru', 11, russian)).toBe('11 подходов');
    expect(formatPlural('ru', 21, russian)).toBe('21 подход');
  });

  it('uses semantic axis keys even when displayed progress labels are equal', () => {
    const source = readSource('src/components/progress/ProgressTrendChart.tsx');

    expect(source).toContain("{ key: 'maximum', value: maxLabel }");
    expect(source).toContain("{ key: 'midpoint', value: midpoint.toFixed(1) }");
    expect(source).toContain("{ key: 'minimum', value: minLabel }");
    expect(source).toContain('key={axisLabel.key}');
    expect(source).not.toContain('key={label}');
  });

  it('keeps every installable EAS profile standalone and isolates the native runtime', () => {
    const eas = JSON.parse(readSource('eas.json')) as {
      build: Record<string, { channel?: string; developmentClient?: boolean; distribution?: string }>;
    };
    const app = JSON.parse(readSource('app.json')) as {
      expo: { runtimeVersion?: { policy?: string }; version?: string };
    };

    expect(Object.values(eas.build).every((profile) => profile.developmentClient !== true)).toBe(true);
    expect(eas.build.development).toMatchObject({
      channel: 'production',
      distribution: 'internal',
    });
    expect(app.expo.version).toBe('1.0.3');
    expect(app.expo.runtimeVersion?.policy).toBe('appVersion');
  });
});
