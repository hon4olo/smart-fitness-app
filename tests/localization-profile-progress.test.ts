import { describe, expect, it } from 'vitest';

import { enMessages, ruMessages } from '@/localization/messages';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

const SECOND_SLICE_FILES = [
  'src/app/(tabs)/profile.tsx',
  'src/app/(tabs)/progress.tsx',
  'src/components/profile/ProfileCoachCard.tsx',
  'src/components/profile/ProfileGoalsCard.tsx',
  'src/components/profile/ProfilePreferencesCard.tsx',
  'src/components/progress/AddBodyMeasurementCard.tsx',
  'src/components/progress/ProgressTrendChart.tsx',
  'src/components/progress/SafetyRecoveryProgressCard.tsx',
  'src/components/progress/SafetyRecoveryWeeklyTrendCard.tsx',
  'src/features/progress/ProgressPlanningSections.tsx',
] as const;

describe('localized Profile and Progress contract', () => {
  it('keeps representative Profile, goal, Coach, measurement, and recovery keys in both catalogs', () => {
    const keys = [
      'profile.summary',
      'goals.targetWeight',
      'coach.trainingExperience',
      'progress.currentWeight',
      'measurement.metric.bodyFat',
      'safety.weeklyTitle',
    ] as const;

    for (const key of keys) {
      expect(enMessages[key].trim(), key).not.toBe('');
      expect(ruMessages[key].trim(), key).not.toBe('');
      expect(ruMessages[key], key).not.toBe(enMessages[key]);
    }
  });

  it('does not branch on locale inside the completed second slice', () => {
    for (const path of SECOND_SLICE_FILES) {
      const source = readSource(path);
      expect(source, path).not.toMatch(/locale\s*===\s*['"](?:ru|en)['"]/);
      expect(source, path).not.toMatch(/locale\.startsWith\(\s*['"]ru/);
    }
  });

  it('routes high-risk visible props, alerts, and accessibility copy through translation keys', () => {
    for (const path of SECOND_SLICE_FILES) {
      const source = readSource(path);
      expect(source, path).not.toMatch(
        /\b(?:label|title|subtitle|helperText|accessibilityLabel|accessibilityHint)\s*=\s*['"][A-Za-z]/,
      );
      expect(source, path).not.toMatch(/Alert\.alert\(\s*['"][A-Za-z]/);
    }
  });

  it('does not expose analytics labels or internal movement codes directly on Progress', () => {
    const history = readSource('src/components/progress/SafetyRecoveryProgressCard.tsx');
    const weekly = readSource('src/components/progress/SafetyRecoveryWeeklyTrendCard.tsx');

    expect(history).not.toContain('metric.label');
    expect(history).not.toContain('analytics.periodLabel');
    expect(history).not.toContain('analytics.loadTrend.deltaLabel');
    expect(history).toContain('getSafetyMovementLabel');
    expect(history).toContain('getSafetyStatusLabel');
    expect(weekly).not.toContain('STATUS_LABELS');
    expect(weekly).not.toContain('trend.windowLabel');
    expect(weekly).toContain('getSafetyStatusLabel');
  });
});
