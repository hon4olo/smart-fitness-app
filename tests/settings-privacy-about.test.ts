import { describe, expect, it } from 'vitest';

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
    expect(cards).toContain('Anonymous data is not silently merged');
    expect(cards).toContain('Анонимные данные не объединяются');
    expect(cards).toContain('Product analytics is not currently enabled');
    expect(cards).toContain('Продуктовая аналитика сейчас не включена');
    expect(cards).toContain('createSupportDiagnostics');
  });

  it('does not claim configured consent, legal links, or health-content telemetry', () => {
    const cards = readSource('src/features/settings/PrivacyAboutCards.tsx');

    expect(cards).not.toContain('analyticsEnabled: true');
    expect(cards).not.toContain('weightValue');
    expect(cards).not.toContain('calorieValue');
    expect(cards).not.toContain('emailAddress');
    expect(cards).toContain('No legal or support link is shown until a verified destination is configured.');
  });
});
