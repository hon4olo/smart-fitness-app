import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('Settings account and security placement', () => {
  it('surfaces the existing authenticated account controls inside Settings', () => {
    const source = readSource('src/app/settings/index.tsx');

    expect(source).toContain("import { AuthGateCard } from '@/components/auth';");
    expect(source).toContain("<SettingsSection title={t('account.title')}>");
    expect(source).toContain('<AuthGateCard />');
  });

  it('records pluralization and Settings progress in the focused phase file', () => {
    const roadmap = readSource('docs/roadmap/localization-settings.md');

    expect(roadmap).toContain('deterministic English/Russian pluralization helpers');
    expect(roadmap).toContain('Account & Security is surfaced inside the dedicated Settings');
  });
});
