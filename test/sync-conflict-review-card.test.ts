import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: string): string;
};
const { resolve } = require('path') as { resolve(...parts: string[]): string };

const projectRoot = resolve(__dirname, '..');
const source = readFileSync(
  resolve(projectRoot, 'src/features/settings/SyncConflictReviewCard.tsx'),
  'utf8',
);

describe('sync conflict review card formatting', () => {
  it('renders real spacing instead of a literal unicode escape', () => {
    expect(source).not.toContain('\\u00a0');
    expect(source).toContain("{copy.detected}:{' '}");
  });
});
