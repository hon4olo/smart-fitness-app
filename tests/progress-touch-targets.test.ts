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
  const match = source.match(new RegExp(`${name}: \\{([\\s\\S]*?)\\n  \\},`));
  return match?.[1] ?? '';
};

describe('Progress compact touch targets', () => {
  it('keeps the weight range tabs at a 44 pt minimum touch height', () => {
    const source = readSource('src/app/(tabs)/progress.tsx');

    expect(source).toContain('accessibilityRole="tablist"');
    expect(source).toContain('accessibilityRole="tab"');
    expect(styleBlock(source, 'rangeTab')).toContain('minHeight: 44');
  });

  it('keeps Safety period and history chips at a 44 pt minimum touch height', () => {
    const progressStyles = readSource(
      'src/components/progress/SafetyRecoveryProgressCard.styles.ts',
    );
    const weeklyStyles = readSource(
      'src/components/progress/SafetyRecoveryWeeklyTrendCard.styles.ts',
    );

    expect(styleBlock(progressStyles, 'periodChip')).toContain('minHeight: 44');
    expect(styleBlock(weeklyStyles, 'periodChip')).toContain('minHeight: 44');
    expect(styleBlock(weeklyStyles, 'historyButton')).toContain('minHeight: 44');
  });
});
