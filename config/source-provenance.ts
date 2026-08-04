export const SOURCE_COMMIT_ENV_KEYS = [
  'EXPO_PUBLIC_SOURCE_COMMIT_SHA',
  'GITHUB_SHA',
] as const;

export type SourceProvenanceEnvironment = Record<
  string,
  string | undefined
>;

const EXACT_GIT_SHA_PATTERN = /^[0-9a-f]{40}$/iu;

export const normalizeSourceCommit = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return EXACT_GIT_SHA_PATTERN.test(normalized) ? normalized : null;
};

export const resolveSourceCommit = (
  environment: SourceProvenanceEnvironment | undefined,
): string | null => {
  for (const key of SOURCE_COMMIT_ENV_KEYS) {
    const sourceCommit = normalizeSourceCommit(environment?.[key]);
    if (sourceCommit) return sourceCommit;
  }
  return null;
};
