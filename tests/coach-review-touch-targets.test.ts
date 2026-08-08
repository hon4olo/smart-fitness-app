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

const styleBlock = (source: string, name: string) => {
  const match = source.match(new RegExp(`${name}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`));
  return match?.[1] ?? '';
};

describe('Coach review touch targets', () => {
  it('keeps Safety & Recovery review navigation and period controls at 44 pt minimum', () => {
    const source = readSource(
      'src/features/coach/screens/safetyRecoveryCoachScreen.styles.ts',
    );

    expect(styleBlock(source, 'backButton')).toContain('height: 44');
    expect(styleBlock(source, 'backButton')).toContain('width: 44');
    expect(styleBlock(source, 'periodButton')).toContain('minHeight: 44');
  });

  it('keeps Combined review back navigation at 44 pt', () => {
    const source = readSource('src/features/coach/screens/combinedCoachScreenStyles.ts');

    expect(styleBlock(source, 'backButton')).toContain('height: 44');
    expect(styleBlock(source, 'backButton')).toContain('width: 44');
  });
});
