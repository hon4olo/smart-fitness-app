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

describe('support-only local performance diagnostics', () => {
  it('keeps the metrics card behind explicit support mode and the collapsed developer section', () => {
    const settings = readSource('src/app/settings/index.tsx');
    const supportGuard = settings.indexOf('supportDiagnosticsEnabled ?');
    const expandedGuard = settings.indexOf('developerExpanded ?');
    const metricsCard = settings.indexOf('<LocalPerformanceDiagnosticsCard />');

    expect(settings).toContain('EXPO_PUBLIC_SUPPORT_MODE');
    expect(supportGuard).toBeGreaterThan(-1);
    expect(expandedGuard).toBeGreaterThan(supportGuard);
    expect(metricsCard).toBeGreaterThan(expandedGuard);
  });

  it('renders aggregates only and does not request content, identifiers, paths, or raw failures', () => {
    const card = readSource(
      'src/features/settings/LocalPerformanceDiagnosticsCard.tsx',
    );
    const copy = readSource(
      'src/localization/supportDiagnosticsMetricsCopy.ts',
    );

    expect(card).toContain('lastSerializedBytes');
    expect(card).toContain('totalFailures');
    expect(card).toContain('authRefreshFailures');
    expect(card).toContain('entityCounts');
    expect(card).not.toContain('contextSnapshot');
    expect(card).not.toContain('requestId');
    expect(card).not.toContain('entityId');
    expect(card).not.toContain('payload');
    expect(card).not.toContain('email');
    expect(card).not.toContain('token');
    expect(card).not.toContain('error.message');
    expect(copy).toContain('Локальная производительность');
    expect(copy).toContain('Local performance');
  });

  it('describes the current local-only privacy boundary instead of removed crash reporting', () => {
    const privacyCard = readSource(
      'src/features/settings/PrivacyAboutCards.tsx',
    );
    const privacyCopy = readSource(
      'src/localization/privacyCurrentCopy.ts',
    );

    expect(privacyCard).toContain('getPrivacyCurrentCopy');
    expect(privacyCard).not.toContain("t('privacy.crashBody')");
    expect(privacyCopy).toContain('External crash reporting is not enabled');
    expect(privacyCopy).toContain('Внешняя отправка отчётов о сбоях не включена');
    expect(privacyCopy).not.toContain('DSN');
  });
});
