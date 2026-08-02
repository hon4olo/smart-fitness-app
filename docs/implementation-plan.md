# Smart Fitness Active Implementation Plan

Updated: 2026-08-02

This file contains the current verified baseline, active source program, execution order, and authorization boundary. Detailed tasks live in `docs/roadmap/provider-readiness.md`. Completed implementation history remains in merged pull requests and focused architecture and roadmap documents.

## Verified baseline

Before this documentation synchronization slice:

- mobile `main`: `7695b3ff1116fae667e0dbbfd1f11baa9ae4d455`;
- backend `main`: `34104bec69533fbe89bbaa53cef0884119c13e38`;
- backend PR #92 exact green head: `97f363221b77fc69041ab19d713e9d9c9124ef9d`;
- backend PR #92 merge: `7b557a216a3e08b043941f2863c6ae64c68b0cf0`;
- backend PR #93 exact green head: `d3a1f19ed419fe96111925ebe37e36ad855a67de`;
- backend PR #93 merge: `84e4100b85d24bfee04be2dbea0130fd95be3370`;
- mobile PR #363 exact green head: `ebda5b78713e0313bf088a54b299b6a943131074`;
- mobile PR #363 merge: `ac468c103db07ecb6b550535ed77aa72898fb68d`;
- backend PR #94 exact green head: `f0a199ac4c797d6b025fb48226502a7edddcab9e`;
- backend PR #94 merge: `a2d4f67db3000785facb11e2d69cacb8cda03bc3`;
- backend PR #95 exact green head: `ab30ee7b31458b69409ba7c00116397fad07887e`;
- backend PR #95 merge: `1eefe77d7260721fc7f3b5a2c0f85e6a962583c8`;
- backend PR #96 exact green head: `6ec65413b4c3164bcf176d41230d817e203b8095`;
- backend PR #96 merge: `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`;
- backend PR #98 exact green head: `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`;
- backend PR #98 merge: `34104bec69533fbe89bbaa53cef0884119c13e38`;
- open mobile pull requests: none;
- open backend pull requests: none;
- production `useAppContext` consumers: `0`;
- Social S0-S6 and managed-media S7.1-S7.7 source boundaries are complete;
- Provider and Release Readiness P0 is source-complete;
- public media uploads and real providers remain disabled;
- the single AsyncStorage `AppState` snapshot remains the approved local-state architecture;
- the reviewed local-state evidence, budgets, and reopen criteria remain canonical in `docs/architecture/local-state-performance-decision.md`;
- blocking Mobile CI covers repository and changed-file line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor;
- blocking Backend CI covers lint, formatting, build, migrations, schema and PostgreSQL integration, full regression, startup, and health.

Always verify current exact `main` and open pull requests in both repositories before starting a slice.

## Active source program

There is no remaining approved autonomous source-refactor phase. The active work is the separately approved Provider and Release Readiness source-preparation program.

Status: approved for autonomous source preparation.

Goal: prepare mobile and backend provider integrations so later activation consists of provider selection, credentials, infrastructure creation, deployment, staging validation, native builds, and explicit feature enablement rather than additional core application work.

Canonical detailed roadmap:

- `docs/roadmap/provider-readiness.md`.

The program includes:

1. provider configuration, factories, readiness validation, and cross-repository capability contracts;
2. S3-compatible private object storage and immutable delivery adapters;
3. production worker entrypoints, process templates, recovery, and readiness;
4. classifier and OCR transport, strict adapters, and conformance tests;
5. moderation calibration tooling;
6. password-reset mobile flow, deep links, templates, and delivery adapter;
7. environment templates, storage/CDN/email policies, smoke scripts, and operational runbooks;
8. backend-owned explicit sync conflict choices before destructive mobile UI;
9. privacy-safe diagnostics, fixed-SHA release gating, and Android source preparation;
10. technical privacy, legal, and analytics prerequisites.

## Completed P0 status

Provider configuration and capability foundation is source-complete.

Backend PR #92, exact green head `97f363221b77fc69041ab19d713e9d9c9124ef9d`, merge `7b557a216a3e08b043941f2863c6ae64c68b0cf0`:

- provider-neutral selectors for private object storage, immutable media delivery, media classifier, OCR, and password-reset delivery;
- composition-root provider factories;
- explicit `configured`, `ready`, and `enabled` states;
- credentials and settings remain inert without explicit product enablement;
- strict fail-closed production validation for unsafe, incomplete, memory, unavailable, and source-unsupported enabled configurations;
- privacy-safe configuration/readiness representation;
- strict versioned backend capability response for managed avatars, workout-post images, media moderation, immutable media delivery, and password reset;
- safe disabled behavior when configuration is absent.

Backend PR #93, exact green head `d3a1f19ed419fe96111925ebe37e36ad855a67de`, merge `84e4100b85d24bfee04be2dbea0130fd95be3370`:

- public pre-auth access to the same privacy-safe capability bootstrap;
- no expansion of public DTO content or provider disclosure.

Mobile PR #363, exact green head `ebda5b78713e0313bf088a54b299b6a943131074`, merge `ac468c103db07ecb6b550535ed77aa72898fb68d`:

- exact-key and exact-version capability parser;
- rejection of unknown critical fields, unsupported versions, and inconsistent states;
- account/session-safe loading, cancellation, stale-response rejection, refresh, and recheck behavior;
- bounded EN/RU states without raw backend or provider text;
- password-reset, managed-avatar, and workout-post image controls and requests blocked until capability readiness is confirmed;
- text-only workout-post publication preserved when image capability is unavailable;
- existing offline, auth, navigation, draft, polling, sync, and persistence boundaries preserved.

No real provider adapter, credential, provider call, deployment, worker activation, public upload activation, or production password-reset email activation was added.

## Completed P1 status

S3-compatible private storage and immutable delivery are source-complete.

Backend PR #94, exact green head `f0a199ac4c797d6b025fb48226502a7edddcab9e`, merge `a2d4f67db3000785facb11e2d69cacb8cda03bc3`:

- provider-neutral SigV4 and bounded HTTPS primitives;
- production S3-compatible private object storage selected only in the composition root;
- exact presigned quarantine uploads, signed metadata reads, bounded private reads, conditional immutable private writes, and idempotent exact deletion;
- strict namespace, metadata, checksum, duplicate-write, malformed-response, and redaction coverage.

Backend PR #95, exact green head `ab30ee7b31458b69409ba7c00116397fad07887e`, merge `1eefe77d7260721fc7f3b5a2c0f85e6a962583c8`:

- production S3-compatible immutable delivery selected only in the composition root;
- canonical owner-opaque asset prefixes and content-hashed named JPEG variants;
- SHA-256, MIME, length, immutable cache-control, no-overwrite, strict metadata, and trusted public-base validation;
- bounded URL-encoded `ListObjectsV2`, pagination-token validation, exact-prefix isolation, exact deletion, partial-cleanup recovery, and safe replay;
- deterministic conformance tests without credentials or real network calls.

Storage and delivery readiness remains separate from product enablement. Aggregate managed-media capabilities remain unavailable until classifier and OCR providers are operationally ready and the explicit product flag is enabled.

## Current P2 status

P2 is active. The shared runtime, cleanup worker, per-claim shutdown boundary, and derivative-delivery process/recovery entrypoint are merged.

Backend PR #96, exact green head `6ec65413b4c3164bcf176d41230d817e203b8095`, merge `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`:

- added the provider-neutral bounded one-shot and continuous process loop;
- added the source-only cleanup worker around existing cleanup claims and providers;
- added deterministic aggregate output, exit codes, abortable polling, resource close, and privacy tests.

Backend PR #98, exact green head `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`, merge `34104bec69533fbe89bbaa53cef0884119c13e38`:

- added `runWorkerClaimBatch`, which processes existing service claims one at a time and observes abort before the next claim;
- hardened cleanup so shutdown is observed between individual cleanup claims;
- added derivative-delivery `process` and expired-processing `recover` operations through the existing delivery worker;
- preserved exact state versions, processing tokens, leases, master integrity, immutable variants, stale-worker rejection, partial-publication cleanup, claim release, recovery, approval completion, and origin-cleanup ordering;
- added bounded one-shot/continuous modes, readiness failure, privacy-safe aggregate output, resource cleanup, and deterministic tests;
- added no scheduling, deployment, provider activation, credentials, or lifecycle changes.

## Next bounded slice

Continue P2 with the media-moderation process boundary:

- audit the current moderation worker factory dependencies: private storage, image normalizer, classifier, OCR, text moderator, cleanup service, repositories, and provider runtime;
- add bounded `process` and expired-claim `recover` operations using the merged shared runtime and per-claim batch helper;
- preserve normalization, checksum validation, classifier/OCR attempt metadata, deterministic fitness-aware policy, manual-review routing, stale-result cleanup, claim release, state versions, and legal/retention boundaries;
- expose only aggregate process results and bounded failure categories without asset IDs, object keys, media bytes, OCR text, provider payloads, credentials, or raw exceptions;
- keep provider-specific adapters unavailable until P3 provider selection and keep every worker unscheduled.

No deployment, migration execution outside CI, worker scheduling, environment activation, credential change, real provider call, public upload activation, OTA, or native build is authorized.

## Execution rules

- Continue through one meaningful bounded phase or subphase rather than stopping after every micro-change.
- Inspect existing routes, services, repositories, modules, schemas, tests, and mobile parsers before adding abstractions.
- Reuse current media lifecycle, moderation, delivery, cleanup, appeal, review, password-reset, authentication, sync, and localization contracts.
- Keep provider-specific SDKs, model IDs, payloads, credentials, and raw responses behind backend adapters.
- Keep mobile provider-neutral and backend-only for all provider calls.
- Use branches and pull requests.
- Run the repository's complete blocking CI.
- Inspect review threads.
- Merge only the exact fully green head.
- After a backend phase, update the canonical mobile roadmap documents with exact head and merge SHAs.

## Invariants

- Preserve persisted schemas, stable IDs, canonical units, authentication, revisions, idempotency, conflicts, completed history, explicit Coach confirmations, media state versions, worker leases, retention deadlines, legal holds, and append-only audit.
- Keep private fitness data in the existing offline-first revision-aware private-data boundary.
- Keep Social data server-authoritative and separate from private `AppState` synchronization.
- Reviewed, pending, appealed, rejected, failed, and deleted media remain non-public unless an explicit valid transition approves them.
- Mobile never contains provider secrets or calls object storage, CDN, moderation, OCR, email, or model providers directly.
- Never expose raw provider responses, OCR plaintext, object keys, signed URLs, tokens, email, private payloads, or full idempotency keys in logs, diagnostics, DTOs, or user-visible copy.
- New user-facing copy uses the localization layer and bounded display mappings.
- Keep every new hand-written source or architecture file at or below 500 physical lines.
- Do not introduce SQLite, another persistence layer, a second backend, Firebase, or Supabase.

## Safe-default requirements

- Provider credentials alone must not enable a product capability.
- Production startup must fail closed when an enabled capability has incomplete or unsafe configuration.
- In-memory and unavailable providers remain test/development fallbacks and cannot satisfy enabled production readiness.
- Mobile hides or disables known-unavailable operations through the strict capability contract rather than issuing doomed requests.
- Missing provider configuration preserves current disabled behavior.

## Work allowed now

- backend and mobile source changes;
- provider adapters written against public provider contracts without real credentials;
- deterministic tests, provider conformance suites, fixtures, and CI changes;
- CLI and worker entrypoints that are not started in an environment;
- Docker Compose, systemd, environment, policy, smoke, and runbook templates;
- email templates and deep-link source configuration;
- technical privacy and legal drafts clearly marked as non-approved;
- documentation updates and exact-green PR merges.

## Work requiring explicit authorization or external inputs

- credentials, secret-store, DNS, sender-domain, bucket, CDN, or provider-account configuration;
- real provider calls or staging calibration;
- repository-token setup and execution of the fixed-SHA release gate;
- backend deployment or migration execution outside CI;
- worker scheduling or environment activation;
- OTA publication;
- native build or device installation;
- physical-device, second-device, accessibility, EN/RU/unit, offline-restart, and release matrices;
- public media upload enablement;
- production password-reset email activation;
- legal approval.

## Completion gate

The source program is complete only when the criteria in `docs/roadmap/provider-readiness.md` are satisfied and both repositories have exact fully green merged heads. Source completion does not imply deployment, provider activation, device validation, or public release.
