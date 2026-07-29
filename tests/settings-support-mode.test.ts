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
const settingsSource = readFileSync(
  resolve(projectRoot, 'src/app/settings/index.tsx'),
  'utf8',
);

describe('Settings support diagnostics visibility', () => {
  it('hides developer controls in production unless support mode is explicit', () => {
    expect(settingsSource).toContain(
      "__DEV__ || process.env.EXPO_PUBLIC_SUPPORT_MODE?.trim().toLowerCase() === 'true'",
    );
    expect(settingsSource).toContain('{supportDiagnosticsEnabled ? (');
    expect(settingsSource).not.toContain(
      "process.env.EXPO_PUBLIC_SUPPORT_MODE !== 'false'",
    );
  });

  it('keeps support-only controls inside the visibility boundary', () => {
    const boundary = settingsSource.indexOf('{supportDiagnosticsEnabled ? (');
    const resetControl = settingsSource.indexOf('<ProfileActionsCard', boundary);
    const runtimeControl = settingsSource.indexOf('<ProfileRuntimeInfoCard', boundary);

    expect(boundary).toBeGreaterThan(-1);
    expect(resetControl).toBeGreaterThan(boundary);
    expect(runtimeControl).toBeGreaterThan(boundary);
  });
});
