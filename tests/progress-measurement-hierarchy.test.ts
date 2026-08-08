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

describe('progress body measurement visual hierarchy', () => {
  it('keeps the measurement editor inside the owning Progress surface without nesting another AppCard', () => {
    const progress = readSource('src/app/(tabs)/progress.tsx');
    const editor = readSource('src/components/progress/AddBodyMeasurementCard.tsx');

    expect(progress).toContain('<AddBodyMeasurementCard');
    expect(editor).toContain('<View style={styles.editor}>');
    expect(editor).not.toContain("import { AppCard }");
    expect(editor).not.toContain('<AppCard>');
    expect(editor).toContain('borderTopWidth: StyleSheet.hairlineWidth');
  });

  it('preserves explicit radio semantics and 44pt ownership for metric choices', () => {
    const editor = readSource('src/components/progress/AddBodyMeasurementCard.tsx');

    expect(editor).toContain('accessibilityRole="radio"');
    expect(editor).toContain('accessibilityState={{ checked: selected }}');
    expect(editor).toContain("minHeight: 44");
    expect(editor).toContain("minHeight: 48");
  });
});