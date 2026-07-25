import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };

const projectRoot = resolve(__dirname, '..');
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('modular roadmap', () => {
  it('keeps the canonical index linked to focused phase files', () => {
    const index = readSource('ROADMAP_PROGRESS.md');
    const release = readSource('docs/roadmap/release-and-account.md');
    const localization = readSource('docs/roadmap/localization-settings.md');
    const data = readSource('docs/roadmap/data-quality-and-scale.md');

    expect(index).toContain('docs/roadmap/release-and-account.md');
    expect(index).toContain('docs/roadmap/localization-settings.md');
    expect(index).toContain('docs/roadmap/data-quality-and-scale.md');
    expect(release).toContain('Account lifecycle');
    expect(localization).toContain('Localization and regional formatting');
    expect(data).toContain('Local-storage scalability');
  });
});
