import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync, existsSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
  existsSync: (path: string) => boolean;
};
const { resolve } = require('path') as { resolve: (...parts: string[]) => string };
const projectRoot = resolve(__dirname, '..');

describe('roadmap index', () => {
  it('links to existing focused phase files', () => {
    const index = readFileSync(resolve(projectRoot, 'ROADMAP_PROGRESS.md'), 'utf8');
    const paths = [
      'docs/roadmap/release-and-account.md',
      'docs/roadmap/localization-settings.md',
      'docs/roadmap/data-quality-and-scale.md',
    ];

    paths.forEach((path) => {
      expect(index).toContain(path);
      expect(existsSync(resolve(projectRoot, path))).toBe(true);
    });
  });
});
