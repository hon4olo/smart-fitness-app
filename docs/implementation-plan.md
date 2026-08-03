# Smart Fitness Active Implementation Plan

Updated: 2026-08-03

This document is the canonical current execution plan for the mobile and backend repositories. Detailed Provider and Release Readiness tasks live in `docs/roadmap/provider-readiness.md`. Completed implementation history remains in merged pull requests and focused architecture and operations documents.

## Verified baseline

Before this documentation synchronization slice:

- mobile `main`: `6e64b91eb5f7ed297e516aecb1baee16d4f4a698`;
- backend `main`: `1de40eb713a810bdc8875acebccd61d3b8f8d059`;
- backend PR #120 exact green head: `ccbb98c164efada298a9768d329f9150757ecbf1`;
- backend PR #120 merge: `1de40eb713a810bdc8875acebccd61d3b8f8d059`;
- open mobile pull requests before this documentation slice: none;
- open backend pull requests after PR #120 merge: none;
- public media uploads, real provider-backed media processing, and password-reset delivery remain disabled;
- no provider account, credential, deployment, worker schedule, DNS mutation, native build, or production activation is implied by source completion.

Always re-check exact `main` and open pull requests in both repositories before starting another slice.

## Product and architecture baseline

The approved product remains an Expo / React Native offline-first mobile application backed by the existing Fastify/PostgreSQL service.

The canonical local-state evidence and reviewed decision remain in `docs/architecture/local-state-performance-decision.md`. The current single AsyncStorage `AppState` snapshot remains the approved local persistence architecture.

Implemented private-data domains include:

- authentication and profile;
- workout tracking, templates, sessions, programs, and custom exercises;
- Nutrition diary, targets, meal templates, and account-scoped library items;
- weight, body measurements, recovery, limitations, and progress analytics;
- revision-aware synchronization with idempotency, tombstones, conflict persistence, restart recovery, and token refresh;
- deterministic and structured Nutrition, Strength, Safety & Recovery, and Combined Coach flows with explicit confirmation.

Implemented Social source boundaries include:

- profiles, follow graph, workout posts, reactions, comments, notifications, reports, moderation, review, appeals, retention, cleanup, managed avatars, and workout-post media;
- private quarantine storage, normalization, classifier/OCR moderation, immutable derivative delivery, deletion, expiry, recovery, and worker entrypoints;
- strict capability gating so unavailable provider operations are not exposed to mobile.

The mobile client never contains provider credentials or calls storage, CDN, classifier, OCR, email, or model providers directly.

## Active source program

There is no remaining approved autonomous source-refactor phase. The active work is the Provider and Release Readiness source-preparation program.

Goal: make later provider activation consist of externally authorized account configuration, credentials, infrastructure, deployment, staging validation, native builds, and explicit capability enablement rather than additional core application development.

Execution order:

1. P6 deployment configuration, policies, smoke scripts, and operational runbooks.
2. P7 backend-owned explicit sync conflict choices, followed by mobile UI.
3. P8 diagnostics, fixed-SHA release gating, and Android source preparation.
4. P9 technical privacy, legal, and analytics prerequisites.

## Provider-readiness phase status

### P0 — provider configuration and capability contracts

Source-complete.

- provider-neutral selectors and factories;
- explicit configured, ready, and enabled states;
- fail-closed production validation;
- privacy-safe public and authenticated capability contracts;
- strict mobile parsing and unavailable-operation gating.

### P1 — private object storage and immutable delivery

Source-complete.

- S3-compatible private quarantine storage;
- conditional immutable writes and exact deletion;
- owner-opaque, content-hashed public variants;
- strict metadata, checksum, prefix, pagination, cleanup, and replay behavior.

### P2 — worker entrypoints and source orchestration

Source-complete.

- cleanup, delivery, moderation, recovery, and upload-expiry entrypoints;
- bounded one-shot and continuous runtimes;
- privacy-safe worker readiness manifest;
- systemd and manual Docker Compose templates;
- explicit retry ownership, lease budgets, graceful shutdown, and emergency-disable boundaries.

### P3 — classifier and OCR providers

Source-complete for the selected source contracts.

- strict provider-neutral interfaces;
- Amazon Rekognition classifier and OCR adapters;
- bounded transport, retry, timeout, parsing, redaction, and conformance coverage;
- no production quality or quota claim without authorized staging evidence.

### P4 — moderation calibration tooling

Source-complete.

- aggregate-only calibration core and CLI;
- fail-closed local corpus and output boundaries;
- provider injection without real credentials in CI;
- separate corpus, operator, reviewer, policy, deletion, and incident ownership;
- no threshold or product-state change during autonomous source work.

### P5 — password-reset product and delivery

Source-complete across backend and mobile.

- hashed one-time tokens, cooldown, expiry, replay rejection, delivery-failure invalidation, password replacement, and all-session revocation;
- generic accepted responses that do not disclose account existence;
- bounded EN/RU Resend templates and strict send contract;
- exact trusted HTTPS reset route and capability-gated mobile forgot/reset flows;
- source-prepared iOS associated-domain and Android app-link configuration;
- placeholder-only sender-domain, AASA, and Digital Asset Links templates.

Operational password reset still requires an account, credential, verified sender, owned link domain, deployed association files, backend deployment, a matching native build, real non-production evidence, physical-device validation, and explicit enablement.

## P6 current source boundary

Completed backend evidence:

- PR #113, exact green head `3e366e803f91d4d563d0b1e70cc189381534cd18`, merge `bad69c42325e7156215e7fdba45962ade3372ef1`: environment templates and staging/production configuration matrix;
- PR #114, exact green head `9e9408ec87a6c6fc0786cd66c8272b502dbb5790`, merge `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`: private-storage, immutable-delivery, CORS, lifecycle, encryption, public-access, and CDN-origin policies;
- PR #116, exact green head `12ba41f2176079fbb4fbe13fc07e3016c16f5049`, merge `288425d9e8608c56f814af74274301c3940a371c`: Resend DNS classes, Apple AASA, Android Digital Asset Links, exact reset route, environment isolation, and send-only callback boundary;
- PR #117, exact green head `ce0555570c7686fd22306d5ac6769c9cafd81e0c`, merge `17cf1f7d4b9345dc0aca463cedc030e1a6b2bad1`: rollout and rollback ordering.
- PR #118, exact green head `b91cd1feef7b3ff494e86ba133ac95037fbea677`, merge `64c04872e0ede26f87dd6017877e15ab218bccc1`: fail-closed staging smoke-runner foundation with strict disabled-capability verification and privacy-safe evidence.
- PR #119, exact green head `2d2ae0aca373ce471ade00c9e721b3c3f2557643`, merge `15c1a939df06d84a38525f1558a2fa7a4ae2754f`: secret-safe synthetic auth/session scenario with replay cleanup and privacy-safe evidence.
- PR #120, exact green head `ccbb98c164efada298a9768d329f9150757ecbf1`, merge `1de40eb713a810bdc8875acebccd61d3b8f8d059`: pre-enablement managed-media lifecycle core with private-quarantine replays, bounded cleanup, and privacy-safe evidence.

PR #117 added:

- a placeholder-only machine-readable contract for explicit environment, change ID, exact mobile/backend SHAs, owners, evidence, and authorization gates;
- rollout order: preflight → migration approval → migrations → backend with capabilities disabled → worker readiness → recovery-first worker startup → pre-enablement verification → one-at-a-time capability enablement → post-enablement verification;
- worker order: upload expiry → cleanup → delivery recovery → moderation recovery → moderation processing → derivative delivery processing;
- staged enablement order: password-reset delivery, then managed-media uploads, with independent approval and observation;
- rollback order: freeze → disable capabilities → stop worker scheduling → preserve state/evidence → schema-compatible backend rollback → credential/provider response when required → verification;
- explicit prohibition on automatic down migration, destructive schema/data rollback, legal-hold removal, audit deletion, claim/state-token clearing, and generic credential revocation;
- repeated target confirmation for staging and production mutations;
- privacy-safe aggregate evidence only;
- deterministic tests locking phase order, capability gates, secret-free templates, and destructive-command exclusions.

The exact PR #117 head passed:

- lint and formatting;
- TypeScript build;
- production configuration validation;
- migrations and migration idempotency;
- migrated-schema integration;
- PostgreSQL Social API integration;
- the complete Vitest suite;
- production startup and `/health` validation.

### Completed P6 slice — staging smoke-runner foundation

Backend PR #118, exact green head `b91cd1feef7b3ff494e86ba133ac95037fbea677`, merge `64c04872e0ede26f87dd6017877e15ab218bccc1`, added:

- one fail-closed runner that accepts only an explicit `staging` target, trusted HTTPS DNS hostname, approved synthetic fixture namespace, change ID, exact backend SHA, and matching confirmation before network access;
- rejection of production, localhost, direct IP, HTTP, embedded credentials, mismatched allowlists, unsafe paths, excessive steps, and unbounded timeouts;
- mandatory synthetic fixture references for every mutating step;
- exactly one strict `GET /v1/capabilities` verification using the released schema, a 64 KiB response bound, and `enabled === false` checks for every provider-backed product capability;
- sequential bounded execution with no automatic retry and stop-on-first transport, status, or verification failure;
- privacy-safe evidence without response bodies, request bodies, raw errors, tokens, email, signed URLs, object keys, OCR text, media, provider payloads, or raw user identifiers;
- a redacted CLI, placeholder-only plan, operational runbook, and deterministic injected-transport tests;
- explicit documentation that this is the safe execution/evidence foundation rather than completed end-to-end provider smoke evidence.

The exact PR #118 head passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, the complete Vitest suite, and production startup/health.

### Completed P6 slice — synthetic auth/session scenario

Backend PR #119, exact green head `2d2ae0aca373ce471ade00c9e721b3c3f2557643`, merge `15c1a939df06d84a38525f1558a2fa7a4ae2754f`, added:

- an exact-confirmation synthetic auth/session scenario over released `/v1/auth/register`, `/login`, `/me`, `/refresh`, and `/account` contracts;
- strict synthetic-fixture scoping for email local part and device name before any request;
- in-memory-only email, password, access token, refresh token, user ID, device ID, session ID, and parsed auth responses;
- controlled replay cleanup: register `409` may continue only through successful login with the same synthetic credentials;
- strict user/device/session relationship validation before and after refresh;
- synthetic account deletion followed by `401` verification for the refreshed access token;
- bounded response reads, no redirects, no automatic retry, and fixed privacy-safe evidence categories;
- deterministic coverage for new account, interrupted-run replay, refresh, cleanup, revocation, malformed responses, identity mismatch, invalid confirmation, non-synthetic identity rejection, unexpected status, and transport redaction;
- an explicit source-only boundary: no standalone CLI, real staging execution, email delivery, media upload, deployment, or activation.

The exact PR #119 head passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, the complete Vitest suite, and production startup/health. Both new hand-written TypeScript files remain below 500 physical lines.

### Completed P6 slice — pre-enablement managed-media lifecycle core

Backend PR #120, exact green head `ccbb98c164efada298a9768d329f9150757ecbf1`, merge `1de40eb713a810bdc8875acebccd61d3b8f8d059`, added:

- an injected internal operational adapter boundary because the released public upload route correctly returns `503` while `SOCIAL_MEDIA_UPLOADS_ENABLED=false`;
- no hidden staging HTTP route and no temporary public capability enablement;
- strict synthetic fixture and idempotency scoping, PNG/JPEG byte limits, and approved signed-upload DNS host validation;
- pre- and post-scenario public capability-disabled checks;
- private upload creation, exact create replay, signed `PUT`, completion, exact completion replay, owner read, deletion, and exact deletion replay;
- strict `upload_pending` → `quarantined` → `deleted` invariants with public descriptor required absent;
- memory-only asset ID, state versions, source hash, signed URL/headers, idempotency key, and fixture bytes;
- one bounded best-effort cleanup after post-create failure, including the regression case where a strict create DTO contains identity but violates lifecycle invariants;
- fixed privacy-safe evidence with no dynamic IDs, URLs, headers, object keys, hashes, provider payloads, media bytes, request/response bodies, or raw exceptions;
- deterministic no-network tests for successful lifecycle, replays, capability regressions, unsafe signed scope, malformed responses, identity mismatch, cleanup success/failure, and non-synthetic fixtures;
- explicit scope stopping at private quarantine: worker processing, moderation, immutable delivery, expiry, and cleanup-worker evidence remain separate.

The exact PR #120 head passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, the complete Vitest suite, and production startup/health. Every new hand-written TypeScript file remains below 500 physical lines.

### Active P6 slice — managed-media staging operational adapter

Next source work:

- bind the lifecycle core to one synthetic owner through the secret-safe auth/session contract from PR #119;
- construct an internal staging adapter from the configured database, `SocialMediaUploadService`, private object storage, image validator, optional delivery provider, and a strict public capability verifier;
- instantiate the internal service with operational execution allowed while the public capability contract remains disabled;
- provide a bounded signed-upload transport that rejects redirects and unexpected statuses without reading or persisting provider response bodies;
- guarantee synthetic account and asset cleanup on success, failure, and interrupted-run replay;
- add a redacted CLI that loads secrets and fixture bytes through approved non-repository paths only after exact staging confirmation;
- keep CI fully offline through injected database/service/provider/transport fixtures;
- keep real staging/provider execution, deployment, workers, credentials, DNS, native builds, and capability activation external.

Subsequent managed-media slices must add bounded processing/recovery polling, immutable delivery validation, stale-upload expiry, cleanup-worker evidence, and authorized worker-order composition.

Password-reset delivery/expiry/replay/session-revocation scenario composition remains the next separate P6 slice after managed media.

Remaining P6 work after the managed-media scenario slice:

- key rotation;
- provider outage handling;
- emergency media disable;
- cleanup pause;
- legal-hold procedures;
- consolidated rollback operations;
- non-destructive default command wrappers with explicit environment targeting.

## Execution rules

- Work from exact current `main` on a bounded branch.
- Inspect actual code, contracts, operations documents, and tests before changing source.
- Preserve released mobile compatibility unless the task explicitly coordinates a contract migration.
- Use existing provider-neutral adapters, capability contracts, media state machines, worker leases, authentication, sync, and localization boundaries.
- Keep every new hand-written source or architecture file at or below 500 physical lines.
- Run the repository's complete blocking CI.
- Inspect review threads.
- Merge only the exact fully green head.
- After a backend slice, synchronize this plan and `docs/roadmap/provider-readiness.md` with exact head and merge SHAs.

## Invariants

- Provider credentials alone never enable a capability.
- Enabled production configuration fails closed when incomplete or unsafe.
- In-memory and unavailable providers cannot satisfy enabled production readiness.
- Product capability enablement remains separate from provider configuration and worker scheduling.
- Migrations precede the new backend; backend health precedes worker startup; workers and smoke evidence precede managed-media enablement.
- Disable capabilities before worker shutdown or code rollback.
- Code rollback requires current-schema compatibility; otherwise prefer a forward fix.
- Data deletion, legal-hold removal, audit deletion, and destructive down migration are not rollback mechanisms.
- Private fitness data remains in the offline-first revision-aware boundary.
- Social data remains server-authoritative and separate from private `AppState` synchronization.
- Reviewed, pending, appealed, rejected, failed, held, and cleanup-eligible media never become public without a valid explicit transition.
- Hidden chain-of-thought, provider payloads, secrets, tokens, signed URLs, object keys, OCR plaintext, email, and private payloads never enter logs, DTOs, diagnostics, analytics, or user-visible copy.

## Work allowed autonomously

- bounded backend and mobile source changes;
- deterministic tests and offline provider conformance fixtures;
- disabled-by-default CLI, worker, policy, smoke, and runbook templates;
- capability, parser, privacy-safe diagnostics, and CI source changes;
- documentation synchronization and exact-green PR merges.

## Work requiring direct authorization or external inputs

- credentials, secret-store values, provider accounts, buckets, CDN, sender identities, or DNS;
- real provider calls or staging calibration;
- backend deployment or migration execution outside CI;
- worker installation, scheduling, or environment activation;
- public media uploads or production password-reset delivery;
- repository-token configuration and fixed-SHA release-gate execution;
- OTA/EAS publication;
- native build, installation, or physical-device testing;
- production activation or rollback execution;
- legal approval.

## Completion gate

The source-preparation program is complete only when the checklist in `docs/roadmap/provider-readiness.md` is satisfied and both repositories contain exact fully green merged heads. Source completion does not imply operational readiness, provider activation, deployment, device validation, or public release.
