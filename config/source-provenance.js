'use strict';

const SOURCE_COMMIT_ENV_KEYS = [
  'EXPO_PUBLIC_SOURCE_COMMIT_SHA',
  'GITHUB_SHA',
];
const EXACT_GIT_SHA_PATTERN = /^[0-9a-f]{40}$/iu;

const normalizeSourceCommit = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return EXACT_GIT_SHA_PATTERN.test(normalized) ? normalized : null;
};

const resolveSourceCommit = (environment) => {
  for (const key of SOURCE_COMMIT_ENV_KEYS) {
    const sourceCommit = normalizeSourceCommit(environment?.[key]);
    if (sourceCommit) return sourceCommit;
  }
  return null;
};

module.exports = {
  SOURCE_COMMIT_ENV_KEYS,
  normalizeSourceCommit,
  resolveSourceCommit,
};
