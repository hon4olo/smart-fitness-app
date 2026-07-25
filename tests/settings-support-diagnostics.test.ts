import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const modelSource = readFileSync('src/features/settings/supportDiagnostics.ts', 'utf8');
const cardSource = readFileSync('src/features/settings/SupportDiagnosticsCard.tsx', 'utf8');
const screenSource = readFileSync('src/app/sync-backup.tsx', 'utf8');

describe('support diagnostics privacy contract', () => {
  it('contains only release and aggregate sync metadata', () => {
    expect(modelSource).toContain('appVersion');
    expect(modelSource).toContain('runtimeVersion');
    expect(modelSource).toContain('updateId');
    expect(modelSource).toContain('pendingOperations');
    expect(modelSource).not.toMatch(/email|token|password|userId|entityId|foodName|weightValue/);
  });

  it('is localized and mounted on Data & Sync', () => {
    expect(cardSource).toContain('Support diagnostics');
    expect(cardSource).toContain('Диагностика для поддержки');
    expect(screenSource).toContain('<SupportDiagnosticsCard');
  });
});
