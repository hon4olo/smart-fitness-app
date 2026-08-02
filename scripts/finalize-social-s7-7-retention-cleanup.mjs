import { readFile, rm, writeFile } from 'node:fs/promises';

const replaceExact = (content, before, after, path) => {
  if (!content.includes(before)) {
    throw new Error(`Missing patch anchor in ${path}: ${before}`);
  }
  return content.replace(before, after);
};

const patchFile = async (path, patch) =>
  writeFile(path, patch(await readFile(path, 'utf8')));

await patchFile('ROADMAP_PROGRESS.md', (source) => {
  let next = replaceExact(
    source,
    '- mobile `main`: `4b4a8f06daaba7f546067bb5c4403902e24e7c50`;\n- backend `main`: `0a2b9d0a9e7f1d3bd3f5a31cf8ef201abc3bdff1`;',
    '- mobile `main`: `3b7f7098c479d946df6d141d9f17a183bee4de77`;\n- backend `main`: `c6c9177230425194c3ce5508f9e6bf350ed6d697`;',
    'ROADMAP_PROGRESS.md',
  );
  next = replaceExact(
    next,
    'Status: S7.1-S7.6 and the first three S7.7 operations slices are source-complete and merged. Broader bounded retention and restart-safe cleanup operations remain active. Public media upload remains disabled.',
    'Status: S7.1-S7.6 and four bounded S7.7 operations slices are source-complete and merged. The source-level manual-review, appeal, evidence-export, lifecycle-retention, legal-hold, and restart-safe cleanup boundaries are complete. Provider calibration and authorized staging/release validation remain. Public media upload remains disabled.',
    'ROADMAP_PROGRESS.md',
  );
  const remainingBlock = `### S7.7 Remaining active work

Remaining source work is:

- bounded retention deadlines for quarantine uploads, moderation masters, failed/review evidence, approved originals, derivatives, and deletion tombstones;
- restart-safe cleanup claims, retries, stale-worker recovery, deletion races, account deletion, legal-hold-safe boundaries, and privacy-safe audit records;
- exact authorization, stale-state, retention, cleanup, legal-hold, and account-deletion tests.`;
  const completedBlock = `### S7.7 Lifecycle retention and restart-safe cleanup — fourth slice complete

Merged backend PR #91:

- exact green head: \`24dc3b3d7f4193ccd92ec76b996b6d539eabd8be\`;
- merge SHA: \`c6c9177230425194c3ce5508f9e6bf350ed6d697\`.

Completed:

- lifecycle-derived deadlines cover abandoned quarantine uploads, thirty-day review evidence, existing fourteen-day rejected evidence, failed evidence, approved private origins, deleted delivery derivatives, and thirty-day metadata tombstones;
- bounded cleanup operations persist due time, exact expected state version, claim token, lease expiry, attempt count, failure code, and completion state;
- oldest-due \`FOR UPDATE SKIP LOCKED\` claims, expired-lease recovery, bounded retries, and state-version revalidation make restart and stale-worker behavior deterministic;
- active internal legal holds block scheduled cleanup, direct cleanup, and account cleanup before any bytes or metadata are removed;
- deletion ordering requires private-origin and delivery-derivative cleanup before metadata tombstone purge;
- append-only privacy-safe cleanup audit excludes owner IDs, object keys, credentials, provider payloads, OCR plaintext, and raw media data;
- migration \`0033\`, deadline materialization, stale-claim refresh, lease recovery, legal hold, deletion ordering, immutability, account cascade, PostgreSQL Social integration, full Vitest, production startup, and health are green.

### S7.7 Remaining validation and activation work

No additional S7 lifecycle source boundary is currently open. Remaining work requires explicit authorization or external configuration:

- wire and schedule the cleanup runner only in an authorized deployment environment;
- calibrate image-moderation thresholds and false-positive handling against a representative staging corpus;
- validate retention, cleanup, legal-hold procedures, and immutable delivery deletion against configured object storage and CDN providers;
- complete staging, physical-device, release, rollback, legal-policy, and operational runbook gates before enabling public media uploads.`;
  next = replaceExact(
    next,
    remainingBlock,
    completedBlock,
    'ROADMAP_PROGRESS.md',
  );
  const executionBlock = `## Next execution order

1. Continue S7.7 with broader lifecycle retention deadlines and restart-safe cleanup claims.
2. Complete stale-worker, deletion-race, account-cleanup, legal-hold-safe, and privacy-safe audit boundaries.
3. Complete false-positive, retention, cleanup, deletion, account-cleanup, privacy, and legal-hold validation before any public media activation.
4. Run staging, physical-device, release, and rollback gates only with the required authorization and configuration.`;
  const nextExecutionBlock = `## Next execution order

1. Keep public media uploads disabled and obtain explicit authorization before wiring a cleanup schedule or real media providers.
2. Calibrate moderation thresholds and false-positive outcomes in staging against representative fitness imagery.
3. Validate real-provider retention, cleanup, deletion, account-cleanup, privacy, and legal-hold procedures.
4. Complete legal-policy, physical-device, release, and rollback gates before any public media activation.
5. Resume another source roadmap program only after product prioritization.`;
  next = replaceExact(
    next,
    executionBlock,
    nextExecutionBlock,
    'ROADMAP_PROGRESS.md',
  );
  const promptStart = '> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`. Social S7.1-S7.6 plus the S7.7 internal manual-review, owner-appeal, and reviewer-evidence-export slices are source-complete. The next unstarted slice is broader bounded retention and restart-safe cleanup operations.';
  const promptReplacement = '> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`. Social S7.1-S7.6 plus the S7.7 internal manual-review, owner-appeal, reviewer-evidence-export, and lifecycle-retention/restart-safe-cleanup slices are source-complete. No further S7 lifecycle source boundary is open before authorized staging and provider validation.';
  return replaceExact(
    next,
    promptStart,
    promptReplacement,
    'ROADMAP_PROGRESS.md',
  );
});

await patchFile('docs/roadmap/social-network.md', (source) => {
  let next = replaceExact(
    source,
    'Status: source-complete through managed avatars and bounded one-image workout posts; manual review, appeal, retention, and cleanup operations remain active.',
    'Status: source-complete through managed avatars, bounded one-image workout posts, internal manual review, owner appeals, reviewer evidence export, lifecycle retention, legal holds, and restart-safe cleanup. Moderation calibration and authorized staging/release validation remain.',
    'docs/roadmap/social-network.md',
  );
  next = replaceExact(
    next,
    '- [ ] add manual review and appeal operations before broad public image rollout;',
    '- [x] add manual review and appeal operations before broad public image rollout;',
    'docs/roadmap/social-network.md',
  );
  return replaceExact(
    next,
    '23. [ ] Manual review, appeal, retention, threshold calibration, and false-positive validation.',
    '23. [ ] Calibrate moderation thresholds and validate false-positive, retention, cleanup, deletion, account-cleanup, privacy, and legal-hold behavior in authorized staging.',
    'docs/roadmap/social-network.md',
  );
});

await rm('scripts/finalize-social-s7-7-retention-cleanup.mjs');
