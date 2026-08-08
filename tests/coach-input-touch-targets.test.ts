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
  const match = source.match(new RegExp(`${name}: \\{([\\s\\S]*?)\\n   ?\\},`));
  return match?.[1] ?? '';
};

describe('Coach input touch targets', () => {
  it('keeps Recovery score, clear and back controls at 44 pt minimum', () => {
    const picker = readSource('src/features/coach/components/RecoveryScorePicker.tsx');
    const screenStyles = readSource(
      'src/features/coach/screens/recoveryCheckInScreen.styles.ts',
    );

    expect(styleBlock(picker, 'scoreButton')).toContain('minHeight: 44');
    expect(styleBlock(picker, 'clearButton')).toContain('minHeight: 44');
    expect(picker).toContain('accessibilityState={{ disabled: value === null }}');
    expect(styleBlock(screenStyles, 'backButton')).toContain('height: 44');
    expect(styleBlock(screenStyles, 'backButton')).toContain('width: 44');
  });

  it('keeps Limitation movement and back controls at 44 pt minimum', () => {
    const source = readSource('src/features/coach/screens/userLimitationScreen.styles.ts');

    expect(styleBlock(source, 'movementChoice')).toContain('minHeight: 44');
    expect(styleBlock(source, 'backButton')).toContain('height: 44');
    expect(styleBlock(source, 'backButton')).toContain('width: 44');
  });
});
