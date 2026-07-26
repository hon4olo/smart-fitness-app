import { describe, expect, it } from 'vitest';

import {
  getHomeMotivationLabel,
  getHomeRecoveryStatusLabel,
} from '@/features/home/homeLocalization';
import { enMessages, ruMessages, type Translate } from '@/localization/messages';
import { translate } from '@/localization/LocalizationProvider';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

const THIRD_SLICE_FILES = [
  'src/app/(tabs)/index.tsx',
  'src/app/auth/index.tsx',
  'src/components/auth/AuthFormScreen.tsx',
  'src/features/onboarding/OnboardingClientScreen.tsx',
  'src/features/home/homeLocalization.ts',
] as const;

const ruTranslate: Translate = (key, values) => translate('ru', key, values);

describe('localized Home and onboarding contract', () => {
  it('keeps representative Home, auth, and onboarding keys in both catalogs', () => {
    const keys = [
      'home.mattersNow',
      'home.openProfile',
      'home.volumeChange',
      'home.recovery.overloaded',
      'auth.landingTitle',
      'auth.trainingExperience',
      'onboarding.age',
      'onboarding.activityHelp',
      'onboarding.validation.trainingDays',
      'onboarding.successAction',
    ] as const;

    for (const key of keys) {
      expect(enMessages[key].trim(), key).not.toBe('');
      expect(ruMessages[key].trim(), key).not.toBe('');
      expect(ruMessages[key], key).not.toBe(enMessages[key]);
    }
  });

  it('does not branch on locale inside the completed Home and onboarding slice', () => {
    for (const path of THIRD_SLICE_FILES) {
      const source = readSource(path);
      expect(source, path).not.toMatch(/locale\s*===\s*['"](?:ru|en)['"]/);
      expect(source, path).not.toMatch(/locale\.startsWith\(\s*['"]ru/);
    }
  });

  it('routes visible controls, alerts, and accessibility copy through translation keys', () => {
    for (const path of THIRD_SLICE_FILES) {
      const source = readSource(path);
      expect(source, path).not.toMatch(
        /\b(?:label|title|subtitle|helperText|accessibilityLabel|accessibilityHint)\s*=\s*['"][A-Za-z]/,
      );
      expect(source, path).not.toMatch(/Alert\.alert\(\s*['"][A-Za-z]/);
    }
  });

  it('does not render raw Home analytics and deterministic status strings', () => {
    const home = readSource('src/app/(tabs)/index.tsx');

    expect(home).not.toContain('weeklyVolumeTrend.label');
    expect(home).not.toContain('weeklyVolumeTrend.detail');
    expect(home).not.toContain('recoveryAdvisor.recoveryExplanation');
    expect(home).toContain('getHomeRecoveryStatusLabel');
    expect(home).toContain('getHomeMotivationLabel');
  });

  it('localizes deterministic Home statuses and safely contains unknown motivation copy', () => {
    expect(getHomeRecoveryStatusLabel(ruTranslate, 'Overloaded')).toBe('Перегрузка');
    expect(getHomeMotivationLabel(ruTranslate, 'Consider deload')).toBe(
      'Рассмотрите разгрузочную неделю.',
    );
    expect(getHomeMotivationLabel(ruTranslate, 'raw internal recommendation')).toBe(
      'Выберите одно действие и продолжайте по плану.',
    );
  });
});
