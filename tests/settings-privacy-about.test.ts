import { describe, expect, it } from 'vitest';

import { enMessages, ruMessages } from '@/localization/messages';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');
const readSource = (path: string) => readFileSync(resolve(projectRoot, path), 'utf8');

describe('Settings privacy and about surfaces', () => {
  it('surfaces localized privacy and release information in Settings', () => {
    const settings = readSource('src/app/settings/index.tsx');
    const cards = readSource('src/features/settings/PrivacyAboutCards.tsx');

    expect(settings).toContain('<PrivacySettingsCard />');
    expect(settings).toContain('<AboutSettingsCard />');
    expect(cards).toContain("t('privacy.localBody')");
    expect(cards).toContain("t('privacy.analyticsBody')");
    expect(enMessages['privacy.localBody']).toContain('Anonymous data is never merged');
    expect(ruMessages['privacy.localBody']).toContain('Анонимные данные никогда не объединяются');
    expect(enMessages['privacy.analyticsBody']).toContain('Product analytics is not enabled');
    expect(ruMessages['privacy.analyticsBody']).toContain('Аналитика использования не включена');
    expect(cards).toContain('createSupportDiagnostics');
  });

  it('does not claim configured consent, legal links, or health-content telemetry', () => {
    const cards = readSource('src/features/settings/PrivacyAboutCards.tsx');

    expect(cards).not.toContain('analyticsEnabled: true');
    expect(cards).not.toContain('weightValue');
    expect(cards).not.toContain('calorieValue');
    expect(cards).not.toContain('emailAddress');
    expect(cards).toContain("t('about.legalUnavailable')");
    expect(enMessages['about.legalUnavailable']).toContain('Legal links and support contacts');
    expect(ruMessages['about.legalUnavailable']).toContain('Юридические ссылки и контакты поддержки');
  });
});
