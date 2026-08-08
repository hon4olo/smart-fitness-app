# Latest Handoff

Updated: 2026-08-08

## Checkpoint

- Mobile repo: `ivangemini/smart-fitness-app`
- Mobile `main` before this docs sync: `76ad9166eb8f9a58df17a551b5b76db8f5a9cc29`
- Backend repo: `ivangemini/smart-fitness-backend`
- Backend `main`: `431998bfa85bf169fd68e98a7e46651f70cfa2d9` (PR #196)
- Backend PRs #192–#196 are merged and advance P9-D beyond the previous mobile roadmap checkpoint.

This mobile branch is docs-only. No mobile runtime/business-logic/persistence change is part of this handoff.

## What changed since the previous mobile handoff

Backend P9-D now includes:

1. audit/idempotency request identity;
2. durable owner-bound request persistence (`0038`);
3. preparation-route audit create/replay/conflict after fresh password re-verification;
4. seven complete ownership-safe candidate projections;
5. deterministic all-or-nothing multi-surface assembly;
6. audited assembly execution with exact UTF-8 measurement and a hard **8 MiB** serialized JSON ceiling;
7. deterministic in-memory JSON artifact generation with fixed filename, exact bytes and SHA-256 integrity metadata.

The fixed artifact filename is `smart-fitness-data-export.json` and media type is `application/json`.

## Important fail-closed state

Do not interpret source completion as product availability.

Still true:

- backend default `createApp()` does not compose the optional export route;
- `/prepare` does not invoke execution/artifact generation;
- new/replayed preparation ends `409 DATA_EXPORT_NOT_AVAILABLE`;
- no large-account pagination/chunking exists;
- no artifact persistence row exists;
- no object-storage write exists;
- no status/download route exists;
- no expiring/revocable download credential exists;
- no mobile export UI exists;
- no storage/provider environment has been selected/activated;
- migration `0038` is source evidence only; no production migration was run.

The artifact bytes are sensitive user export content and must never be logged or copied into generic telemetry/audit events.

## Evidence accuracy

Backend PRs #192, #194, #195 and #196 passed exact-head Backend CI: lint, Prettier, TypeScript build, production configuration validation and the full test suite.

Backend PR #193 passed exact-head Backend CI, Backend PostgreSQL CI and Account Deletion Receipt CI. PostgreSQL CI applied the full migration chain twice and validated migrated schema/table expectations.

`tests/data-access-export-request-postgres.test.ts` exists as focused PostgreSQL evidence, but the current PostgreSQL workflow does not directly enumerate that standalone new file. Do not claim that specific file ran in CI.

## Canonical next P9-D boundary

Next implementation package: **secure storage/delivery source contract**, still with no provider activation or real object write by default.

It should define:

- private owner-scoped artifact identity;
- explicit lifecycle states;
- bounded retention/expiry and deletion;
- account-deletion behavior;
- expiring and revocable download authorization semantics;
- SHA-256 integrity verification across persistence/download;
- failure cleanup/orphan handling;
- no public object URLs or reusable bearer credentials.

Do not wire production object storage, public/default route activation or deployment into the same source-contract package unless explicitly authorized.

If evidence later shows complete export JSON can exceed 8 MiB, design pagination/chunking explicitly rather than silently raising the hard execution ceiling.

## Other remaining roadmap boundaries

- P9-B3: exact provider/environment retention evidence remains externally blocked.
- P9-C: analytics/telemetry collection remains disabled until policy, consent and provider evidence is complete.
- P9-A: physical-device/native/OTA/release/rollback evidence remains authorization-gated.

## Required start for the next work session

1. Fetch current mobile/backend `main` and open PRs.
2. Read both `AGENTS.md` files.
3. Read mobile `docs/implementation-plan.md`, `docs/current-status.md` and this handoff.
4. Read backend `docs/current-status.md` and `docs/handoffs/latest.md` before P9-D continuation.
5. Trust authoritative repository history after the account transfer; do not allow stale numeric-repository REST redirects to override normal repo reads.

## Prohibited implicit actions

Do not perform backend deployment, production migration execution, provider/storage activation, production data access, public/default export-route activation, real object-storage writes, OTA/EAS publication, native build/install, credential/DNS changes, destructive production cleanup or store submission without direct authorization.
