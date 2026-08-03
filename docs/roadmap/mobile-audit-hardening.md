# Mobile Audit Hardening

Updated: 2026-08-03

This focused roadmap records repository-audit findings that were verified against the exact current mobile `main`. It separates completed source fixes from follow-up work that requires a broader environment or release decision.

## Completed in the current slice

- Removed the duplicate root `app.config.js` so Expo configuration has one authoritative dynamic entrypoint: `app.config.ts`.
- Removed the unused `extra.enableOssExerciseDb` configuration flag and its internal-testing comment with the duplicate file.

## Verified non-issues

- `SyncContext.ensureFitnessProfileSync` has a correct `useCallback` closure and dependency array.
- `config/password-reset-app-link.js` already uses a bounded DNS-label expression with a 63-character label limit.
- Release-gate PostgreSQL and JWT values are isolated deterministic CI fixtures, not production credentials.
- Native access and refresh tokens remain in Expo SecureStore; tokenless cached session metadata remains in ordinary storage by design.
- Volatile web token storage is an explicit fail-closed policy until a cookie-based web authentication contract exists.

## Follow-up hardening

### P1 — environment isolation decision

Current `development`, `preview`, `production`, and `production-internal` EAS profiles all resolve the production environment and production update channel. Do not change this as a JSON-only patch. Before splitting profiles, define:

- development and preview API endpoints;
- EAS environment variables for each target;
- update channels and promotion policy;
- fixture accounts and data-isolation rules;
- rollback and runtime-version compatibility checks.

Until that contract exists, document internal builds as production-connected and do not treat them as isolated QA clients.

### Completed — bounded sync retry backoff

`createProductionCloudProvider.withServerRetry` now waits for a bounded exponential delay with jitter before its single retry of an HTTP 5xx response. Deterministic tests lock the delay, terminal-error behavior, and two-attempt ceiling. Exact sync payloads, cursors, revisions, and idempotency keys remain unchanged. HTTP 429 and `Retry-After` remain outside this retry class pending a separate contract.

### P2 — OTA promotion controls

Replace direct production publication as the only path with a preview/canary publication and explicit promotion step. Production promotion should require the blocking release gate, runtime compatibility, and an approval boundary. Native/configuration changes must remain ineligible for OTA.

### P3 — runtime input hardening

At social API trust boundaries, reject malformed runtime values explicitly rather than silently ignoring them. Keep TypeScript contracts authoritative and add tests before broadening accepted nullable fields.

### Planned migration — Expo SDK

Treat the next Expo SDK upgrade and any AsyncStorage major upgrade as a separate native migration. Use Expo-supported package versions, regenerate native projects as required, run the complete CI suite, build matching native runtimes, and perform physical-device regression testing. Do not install npm-latest native packages independently into the current SDK line.

## Excluded from urgent work

- Moving all cached session metadata into SecureStore without a threat model.
- Persisting web bearer tokens in JavaScript-accessible storage as a substitute for HttpOnly cookies.
- Replacing deterministic CI fixture credentials with unrelated repository tokens.
- Refactoring source solely because it was produced or maintained by AI-assisted tooling.
