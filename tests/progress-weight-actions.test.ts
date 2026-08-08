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
const readSource = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), 'utf8');

describe('Progress weight action ownership', () => {
  it('keeps one weight-details action and one add-weight action in the Weight card', () => {
    const source = readSource('src/app/(tabs)/progress.tsx');
    const weightDetailsRoutes = source.match(/router\.push\('\/weight-details'\)/g) ?? [];

    expect(weightDetailsRoutes).toHaveLength(1);
    expect(source).toContain("label={t('progress.weightDetails')}");
    expect(source).toContain("label={t('progress.addWeight')}");
    expect(source).not.toContain("label={t('progress.trainingDetails')}");
  });
});
