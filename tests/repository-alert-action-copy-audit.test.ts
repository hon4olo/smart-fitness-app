import { describe, expect, it } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readFileSync, readdirSync, statSync } = require('fs') as {
  readFileSync(path: string, encoding: string): string;
  readdirSync(path: string): string[];
  statSync(path: string): { isDirectory(): boolean };
};
const { join, relative, resolve } = require('path') as {
  join(...parts: string[]): string;
  relative(from: string, to: string): string;
  resolve(...parts: string[]): string;
};

const projectRoot = resolve(__dirname, '..');
const presentationRoots = ['src/app', 'src/components', 'src/features'];

const collectPresentationFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return collectPresentationFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });

const lineNumberAt = (source: string, index: number) =>
  source.slice(0, index).split('\n').length;

const staticAlertActionPattern = /\{\s*text\s*:\s*(["'])([^"'\n]+)\1\s*(?:,|\})/g;

const isInsideAlertCall = (source: string, index: number): boolean => {
  const alertStart = source.lastIndexOf('Alert.alert(', index);
  if (alertStart < 0) return false;
  const lastClosedAlert = source.lastIndexOf(']);', index);
  return alertStart > lastClosedAlert;
};

describe('repository alert action copy audit', () => {
  it('keeps static Alert action labels behind localization boundaries', () => {
    const violations = presentationRoots.flatMap((root) =>
      collectPresentationFiles(resolve(projectRoot, root)).flatMap((path) => {
        const source = readFileSync(path, 'utf8');
        staticAlertActionPattern.lastIndex = 0;

        return [...source.matchAll(staticAlertActionPattern)].flatMap((match) => {
          const index = match.index ?? 0;
          if (!isInsideAlertCall(source, index)) return [];
          const label = match[2] ?? '';
          if (!/[A-Za-zА-Яа-я]/.test(label)) return [];
          return [
            `${relative(projectRoot, path)}:${lineNumberAt(source, index)} static Alert action label: ${label}`,
          ];
        });
      }),
    );

    expect(violations).toEqual([]);
  });
});
