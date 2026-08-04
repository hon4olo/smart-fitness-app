import { describe, expect, it } from 'vitest';

declare const require: any;

const {
  normalizeSourceCommit,
  resolveSourceCommit,
} = require('./source-provenance') as {
  normalizeSourceCommit(value: unknown): string | null;
  resolveSourceCommit(
    environment: Record<string, string | undefined> | undefined,
  ): string | null;
};

const explicitSha = 'A'.repeat(40);
const githubSha = 'b'.repeat(40);

describe('source provenance', () => {
  it('normalizes only an exact full git commit SHA', () => {
    expect(normalizeSourceCommit(`  ${explicitSha}  `)).toBe(
      explicitSha.toLowerCase(),
    );
    expect(normalizeSourceCommit('main')).toBeNull();
    expect(normalizeSourceCommit('a'.repeat(39))).toBeNull();
    expect(normalizeSourceCommit(`${'a'.repeat(40)}-dirty`)).toBeNull();
  });

  it('prefers an explicit release SHA and falls back to GitHub CI', () => {
    expect(
      resolveSourceCommit({
        EXPO_PUBLIC_SOURCE_COMMIT_SHA: explicitSha,
        GITHUB_SHA: githubSha,
      }),
    ).toBe(explicitSha.toLowerCase());
    expect(
      resolveSourceCommit({
        EXPO_PUBLIC_SOURCE_COMMIT_SHA: 'moving-branch',
        GITHUB_SHA: githubSha,
      }),
    ).toBe(githubSha);
  });

  it('fails closed when no exact immutable source identity exists', () => {
    expect(resolveSourceCommit(undefined)).toBeNull();
    expect(resolveSourceCommit({ GITHUB_SHA: 'main' })).toBeNull();
  });
});
