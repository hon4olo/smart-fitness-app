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
const readSource = (file: string) =>
  readFileSync(resolve(projectRoot, file), 'utf8');

describe('Coach input coverage history UI', () => {
  it('parses optional detail metadata fail closed without hiding the run', () => {
    const client = readSource('src/api/coach/client.ts');
    const screen = readSource(
      'src/features/coach/screens/CoachRunHistoryDetailScreen.tsx',
    );

    expect(client).toContain('parseCoachRunInputSummary');
    expect(client).toContain('inputSummaryValidationFailed: true');
    expect(screen).toContain('<CoachInputSummaryCard');
    expect(screen).toContain('summary={run.inputSummary}');
    expect(screen).toContain('invalid={run.inputSummaryValidationFailed}');
  });

  it('renders only counts and availability through localized copy and formatters', () => {
    const card = readSource(
      'src/features/coach/components/CoachInputSummaryCard.tsx',
    );
    const parser = readSource('src/api/coach/inputSummary.ts');
    const copy = readSource('src/features/coach/coachInputSummaryCopy.ts');

    expect(card).toContain('formatNumber(value');
    expect(card).toContain('source.available');
    expect(card).not.toContain('contextSnapshot');
    expect(card).not.toContain('entityId');
    expect(card).not.toContain('foodName');
    expect(card).not.toContain('exerciseName');
    expect(parser).not.toContain('requestData');
    expect(copy).toContain('Использованные данные');
    expect(copy).toContain('Inputs used');
  });
});
