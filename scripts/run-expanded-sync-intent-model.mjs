import { createHash } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const DEFAULT_SEED_COUNT = 2_048;
const MIN_SEED_COUNT = 129;
const MAX_SEED_COUNT = 4_096;
const SOURCE_LOOP = 'for (let seed = 1; seed <= 128; seed += 1)';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const sourcePath = resolve(
  projectRoot,
  'src/storage/SyncConflictResolutionIntentStore.property.test.ts',
);
const generatedPath = resolve(
  projectRoot,
  'src/storage/SyncConflictResolutionIntentStore.scheduled.test.ts',
);
const evidencePath = resolve(
  projectRoot,
  process.env.SYNC_INTENT_PROPERTY_EVIDENCE_PATH ??
    'scheduled-sync-intent-model-evidence.json',
);

const parseSeedCount = (value) => {
  if (value === undefined || value.trim() === '') return DEFAULT_SEED_COUNT;
  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    parsed < MIN_SEED_COUNT ||
    parsed > MAX_SEED_COUNT
  ) {
    throw new Error(
      `SYNC_INTENT_PROPERTY_SEED_COUNT must be an integer from ${MIN_SEED_COUNT} to ${MAX_SEED_COUNT}`,
    );
  }
  return parsed;
};

const exactShaOrUnknown = (value) =>
  typeof value === 'string' && /^[0-9a-f]{40}$/iu.test(value.trim())
    ? value.trim().toLowerCase()
    : 'unknown';

const writeEvidence = async ({
  mobileSha,
  result,
  seedCount,
  sourceDigest,
}) => {
  await writeFile(
    evidencePath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        suite: 'sync-conflict-resolution-intent-model',
        mobileSha,
        seedStart: 1,
        seedCount,
        sourceDigest,
        result,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
};

const run = async () => {
  const seedCount = parseSeedCount(
    process.env.SYNC_INTENT_PROPERTY_SEED_COUNT,
  );
  const source = await readFile(sourcePath, 'utf8');
  const occurrences = source.split(SOURCE_LOOP).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `Expected one bounded property loop marker, found ${occurrences}`,
    );
  }

  const expanded = source.replace(
    SOURCE_LOOP,
    `for (let seed = 1; seed <= ${seedCount}; seed += 1)`,
  );
  const sourceDigest = createHash('sha256').update(source).digest('hex');
  const mobileSha = exactShaOrUnknown(
    process.env.EXPECTED_MOBILE_SHA ?? process.env.GITHUB_SHA,
  );

  await writeFile(generatedPath, expanded, 'utf8');
  let result = 'failed';
  try {
    const vitestPath = resolve(projectRoot, 'node_modules/vitest/vitest.mjs');
    const execution = spawnSync(
      process.execPath,
      [vitestPath, 'run', generatedPath, '--reporter=verbose', '--testTimeout', '30000'],
      {
        cwd: projectRoot,
        env: process.env,
        stdio: 'inherit',
      },
    );
    if (execution.error) throw execution.error;
    result = execution.status === 0 ? 'passed' : 'failed';
    await writeEvidence({
      mobileSha,
      result,
      seedCount,
      sourceDigest,
    });
    if (execution.status !== 0) process.exitCode = execution.status ?? 1;
  } finally {
    await rm(generatedPath, { force: true });
    if (result === 'failed') {
      await writeEvidence({
        mobileSha,
        result,
        seedCount,
        sourceDigest,
      });
    }
  }
};

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
