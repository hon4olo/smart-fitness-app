# Smart Fitness Roadmap Progress

Updated: 2026-08-02

This is the canonical product and release roadmap index for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Read this index together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md`;
- `docs/roadmap/provider-readiness.md`;
- `docs/roadmap/social-network.md`;
- `docs/roadmap/release-and-account.md`;
- `docs/roadmap/localization-settings.md`;
- `docs/roadmap/data-quality-and-scale.md`;
- `docs/nutrition-roadmap.md`;
- backend `AGENTS.md` when backend work is required.

Completed implementation history remains in merged pull requests and focused roadmap and architecture documents. This file tracks the verified baseline, active program, execution order, and activation boundary.

## Verified repository baseline

Before this documentation synchronization slice:

- mobile `main`: `c3e3aca3d7593386924569b4ceeaac2c4a72c56f`;
- backend `main`: `3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3`;
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
- backend PR #99 exact green head: `6c1a2efe46e435d990df5a5dc39afe07562339f6`;
- backend PR #99 merge: `ec42dc864a56311e04997a3bd76f400e0bde129f`;
- backend PR #100 exact green head: `5fb21ca3b5d63fee89bf0e3db65b2bf37ba672fd`;
- backend PR #100 merge: `6a2b7f1a1196ee66b4e3ad4f049afcef561981f9`;
- backend PR #101 exact green head: `cc261cfe01c82d8b18888195fc8e4eec1ee56558`;
- backend PR #101 merge: `237d83eb25688e2a72157ea8e199b724bd9426e2`;
- backend PR #102 exact green head: `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`;
- backend PR #102 merge: `1d98e50aa9014bca59a7ed7a51ef3803f296dae3`;
- backend PR #103 exact green head: `02675ab50683c4745f7f1a3c5cc05b081016bb15`;
- backend PR #103 merge: `0e2829d91b077eec9fb60d25390b038ada0676db`;
- backend PR #104 exact green head: `7c684cc9426d33b4a9ec4e52cb818966ae71fdac`;
- backend PR #104 merge: `3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3`;
- open mobile pull requests: none;
- open backend pull requests: none.

Always recheck exact `main` and open pull requests in both repositories before changing code.

## Working rules

- Continue through a meaningful bounded phase rather than stopping after every micro-change.
- Use branches and pull requests; merge only an exact fully green head.
- Preserve routes, stable IDs, persisted schemas, canonical units, authentication, revisions, idempotency, conflicts, completed history, explicit Coach confirmations, media state versions, leases, retention, legal holds, and immutable audit unless the task explicitly changes them.
- Keep private fitness data in the existing offline-first and revision-aware private-data boundary.
- Keep Social data server-authoritative and separate from private `AppState` synchronization.
- Keep provider calls and credentials backend-only.
- Keep every hand-written source or architecture file at or below 500 physical lines.
- New user-facing copy must use the localization layer and bounded display mappings.
- Never add health, nutrition, workout, limitation, authentication, Coach, Social content, email, token, object key, signed URL, OCR plaintext, provider payload, or raw private values to telemetry or diagnostics.
- Do not publish OTA, create native builds, install on devices, deploy backend changes, execute migrations outside CI, activate environments, configure credentials, connect real providers, or enable public media uploads without explicit authorization.

## Completed product foundation

### Core application and synchronization

- Single Fastify/PostgreSQL backend and shared mobile API boundary.
- Offline-first local persistence with ordered observable critical mutations.
- Revision-aware synchronization for supported private fitness domains and the account-scoped Nutrition library.
- Restart recovery, auth-refresh retry, concurrent pull, idempotency, and two-device conflict source coverage.
- Data & Sync status, persistence retry, outbox recovery, unresolved-conflict review, and privacy-safe diagnostics.
- Secure native token storage and source-complete account deletion, password change, and session/device management.
- Focused state/action boundaries with zero production `useAppContext` consumers.
- Approved single AsyncStorage `AppState` snapshot after measured local-state performance review.

### Product surfaces

- Home, Workouts, Nutrition, Progress, Profile, Settings, Account & Security, Safety & Recovery, and Coach source flows.
- English/Russian localization and centralized date, number, plural, weight, length, and energy presentation.
- High-volume list virtualization and Progress chart boundaries.
- Blocking mobile and backend CI.

### Social S0-S6

Source-complete:

- profiles, visibility, usernames, follows, requests, and blocks;
- relationship discovery;
- immutable opt-in workout-post snapshots;
- profile post lists, post detail, deletion, and chronological following feed;
- bounded account-scoped feed cache;
- reactions, comments, notifications, and persistent rate limits;
- reports, Community Guidelines, operator review, audited restrictions, and fail-closed visibility enforcement;
- provider-neutral typed pre-publication text moderation.

Real moderation-provider activation remains disabled.

### Social S7 managed media

S7.1-S7.7 source boundaries are complete through backend PR #91 and mobile PR #355:

- managed-media ownership, lifecycle, state versions, leases, deletion, and account cascade;
- private quarantine uploads and strict image validation;
- normalization, metadata removal, classifier and OCR contracts, OCR text moderation, and fitness-aware policy;
- approved avatar and workout-post derivatives with owner-opaque immutable descriptors;
- managed avatar and optional one-image workout-post mobile flows;
- internal manual review, append-only decision audit, owner appeals, and rejected-evidence retention;
- reviewer evidence export with byte integrity and state-version revalidation;
- lifecycle-derived cleanup deadlines, restart-safe cleanup claims, legal holds, dependency-ordered deletion, and append-only cleanup audit.

Public media uploads, real storage, CDN, classifier, OCR, and worker scheduling remain disabled. Detailed history and acceptance criteria are in `docs/roadmap/social-network.md` and the merged PRs.

## Active autonomous source program

The approved active program is **Provider and Release Readiness**.

Canonical detail:

- `docs/roadmap/provider-readiness.md`.

Goal: prepare mobile and backend so later activation requires provider selection, credentials, infrastructure creation, deployment, staging validation, native builds, and explicit feature flags rather than new core application work.

### P0 — provider configuration and capabilities

Status: source-complete and merged.

Backend PR #92, exact green head `97f363221b77fc69041ab19d713e9d9c9124ef9d`, merge `7b557a216a3e08b043941f2863c6ae64c68b0cf0`:

- provider-neutral selectors and composition-root factories;
- separate `configured`, `ready`, and `enabled` states;
- fail-closed production validation;
- privacy-safe redacted readiness representation;
- strict versioned capability response for managed avatars, workout-post images, media moderation, immutable media delivery, and password reset;
- safe disabled behavior when configuration is absent;
- credentials and settings remain inert without explicit product enablement.

Backend PR #93, exact green head `d3a1f19ed419fe96111925ebe37e36ad855a67de`, merge `84e4100b85d24bfee04be2dbea0130fd95be3370`:

- made the privacy-safe capability bootstrap available before authentication so password-reset availability can be checked without a bearer token;
- preserved the same strict provider-neutral DTO and disclosure boundary.

Mobile PR #363, exact green head `ebda5b78713e0313bf088a54b299b6a943131074`, merge `ac468c103db07ecb6b550535ed77aa72898fb68d`:

- exact-key and exact-version fail-closed capability parsing;
- rejection of unknown critical fields, unsupported versions, and inconsistent state;
- account/session-scoped loading, cancellation, stale-response rejection, and recheck behavior;
- bounded EN/RU unavailable, temporarily unavailable, configuration-required, checking, and recheck-required states;
- password-reset, managed-avatar, and workout-post image controls and requests gated by confirmed capability readiness;
- text-only workout-post publication preserved when image capability is unavailable;
- existing offline, auth, navigation, draft, polling, media lifecycle, and privacy boundaries preserved.

No real provider adapter, credential, deployment, worker, upload, or password-reset email activation was added by P0.

### P1 — storage and immutable delivery adapters

Status: source-complete and merged.

Backend PR #94, exact green head `f0a199ac4c797d6b025fb48226502a7edddcab9e`, merge `a2d4f67db3000785facb11e2d69cacb8cda03bc3`:

- added dependency-free S3 Signature Version 4 primitives and a bounded HTTPS transport;
- added a production S3-compatible private object-storage adapter behind the existing provider-neutral contract;
- bound private quarantine uploads to exact method, object key, content type, content length, signed headers, and expiry;
- added signed `HEAD`, bounded private `GET`, conditional immutable private `PUT`, and idempotent exact-object deletion;
- added fail-closed metadata, checksum, namespace, expiry, duplicate-write, malformed-response, and secret-nondisclosure coverage;
- composed the concrete private provider only in the backend composition root.

Backend PR #95, exact green head `ab30ee7b31458b69409ba7c00116397fad07887e`, merge `1eefe77d7260721fc7f3b5a2c0f85e6a962583c8`:

- reused the shared SigV4 and bounded HTTPS primitives for immutable media delivery;
- added strict canonical owner-opaque asset prefixes and content-hashed JPEG variant keys;
- added conditional immutable uploads with exact SHA-256, MIME, length, cache-control, and no-overwrite semantics;
- added strict `HEAD` validation and trusted origin-only public delivery URL construction;
- added bounded `ListObjectsV2` parsing, pagination, exact-prefix isolation, idempotent exact deletion, partial-cleanup recovery, and safe replay;
- kept provider XML and HTTP details inside the adapter and concrete selection inside the composition root;
- added deterministic namespace, signing, XML, pagination, malformed-response, duplicate-write, cleanup, and redaction conformance tests.

P1 completion preserves disabled product behavior. Storage and delivery may be configured and operationally ready, but managed-media product capabilities remain unavailable until classifier and OCR providers are ready and the explicit product flag is enabled.

No credentials, real provider calls, provider accounts, buckets, public ACLs, CDN, DNS, deployment, worker activation, public uploads, or production environment changes were performed.

### P2 — worker entrypoints and orchestration

Status: source-complete and merged.

Backend PR #96, exact green head `6ec65413b4c3164bcf176d41230d817e203b8095`, merge `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`:

- added the shared bounded one-shot and continuous worker runtime;
- added privacy-safe aggregate summaries, deterministic exit codes, abortable polling, and process resource cleanup;
- added source-only cleanup processing around existing claims, leases, legal holds, dependency ordering, and append-only audit.

Backend PR #98, exact green head `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`, merge `34104bec69533fbe89bbaa53cef0884119c13e38`:

- added per-operation abort observation;
- hardened cleanup shutdown;
- added derivative-delivery processing and expired-claim recovery through existing worker contracts.

Backend PR #99, exact green head `6c1a2efe46e435d990df5a5dc39afe07562339f6`, merge `ec42dc864a56311e04997a3bd76f400e0bde129f`:

- added media-moderation processing and expired-claim recovery;
- preserved normalization, classifier, OCR, text policy, state-version, token, lease, stale-result, failed-state, and manual-review contracts.

Backend PR #100, exact green head `5fb21ca3b5d63fee89bf0e3db65b2bf37ba672fd`, merge `6a2b7f1a1196ee66b4e3ad4f049afcef561981f9`:

- added stale private-upload expiry through `expireStaleUploads(1)`;
- preserved oldest-expired ordering, private deletion before terminal CAS, exact state versions, retention eligibility, and safe retry after deletion failure.

Backend PR #101, exact green head `cc261cfe01c82d8b18888195fc8e4eec1ee56558`, merge `237d83eb25688e2a72157ea8e199b724bd9426e2`:

- added a strict versioned privacy-safe readiness manifest for every P2 worker operation;
- separated configured/ready state from product enablement and worker activation;
- fixed retry ownership so provider attempts stay in provider runners and domain replay stays in existing claims, release, idempotent deletion, recovery, and CAS contracts;
- recorded bounded external restart backoff and the no-heartbeat decision with explicit reopen criteria;
- added a readiness CLI that opens no database and performs no provider call;
- added disabled-by-default systemd unit/timer examples and a manual-profile non-restarting Docker Compose example;
- added deterministic source tests and an operations runbook for startup order, duplicate processes, crash recovery, emergency disable, rollback, and privacy-safe evidence.

P2 source completion does not activate workers or managed-media product behavior. No credentials, real provider calls, provider accounts, buckets, CDN, DNS, deployment, migration execution outside CI, unit installation, timer enablement, Docker worker startup, environment activation, public uploads, or production feature enablement were performed.

### P3 — classifier and OCR readiness

Status: active. Provider-neutral transport and the complete Amazon Rekognition `DetectModerationLabels` classifier source boundary are merged; OCR selection/runtime, composition-root support, readiness, and activation remain open.

Backend PR #102, exact green head `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`, merge `1d98e50aa9014bca59a7ed7a51ef3803f296dae3`:

- added a backend-only HTTPS transport with bounded URL, headers, request bytes, timeout, response bytes, redirect behavior, and caller cancellation;
- performs exactly one transport attempt so existing provider runners retain retry ownership;
- added strict success, retryable-failure, and terminal-failure HTTP classification;
- added bounded standard rate-limit metadata parsing;
- added generic redacted errors for invalid request, cancellation, timeout, network failure, oversized response, invalid response, and open circuit;
- added optional bounded circuit containment with one half-open probe and no provider identity or endpoint state;
- added deterministic conformance coverage for redirect blocking, rate limits, malformed metadata, declared and streamed overflow, timeout, cancellation, network failure, unsafe requests, redaction, circuit state, and strict bounds;
- made no network calls and did not change provider factories, configuration support, classifier/OCR readiness, workers, or product capabilities.

Backend PR #103, exact green head `02675ab50683c4745f7f1a3c5cc05b081016bb15`, merge `0e2829d91b077eec9fb60d25390b038ada0676db`:

- selected and documented Amazon Rekognition `DetectModerationLabels` as the classifier API contract;
- added bounded endpoint-relative JPEG-byte request construction with a fixed minimum confidence and response budget;
- added a strict moderation-model-v7 parser with exact field, hierarchy, duplicate, model, taxonomy, size, and unknown-label rejection;
- mapped only validated labels into the existing internal classifier categories and risk contexts without changing moderation policy;
- intentionally emitted no fitness context and no unsupported possible-minor, personal-data, or spam/scam signal;
- retained constant non-reflective errors and deterministic no-network conformance coverage;
- did not add credentials, signing, endpoint configuration, network calls, factory support, readiness, workers, or product capability changes.

Backend PR #104, exact green head `7c684cc9426d33b4a9ec4e52cb818966ae71fdac`, merge `3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3`:

- added a pinned standard Rekognition endpoint contract for moderation-capable regions;
- added a separate service-correct SigV4 signer scoped to `rekognition` without reusing S3-only assumptions;
- composed the strict classifier request/parser through exactly one injected bounded HTTP transport call per provider invocation;
- promoted bounded Rekognition throughput/throttling HTTP `400` errors before circuit accounting;
- mapped timeout, network, circuit, retryable/terminal HTTP, malformed-response, model-drift, and runtime-configuration outcomes into the existing media classifier result contract;
- preserved retry ownership in `runMediaClassifier` and added deterministic retry-then-success integration coverage;
- documented the absence of caller cancellation in the current provider interface instead of inventing an adapter-local contract;
- made no real provider call and did not change factories, environment schema, source readiness, workers, product capabilities, or activation.

Remaining P3 boundary:

- select and document the OCR provider API contract before implementing its request builder and strict versioned response parser;
- compose exactly one bounded OCR transport attempt through trusted endpoint/authentication and the shared HTTP/circuit boundary;
- map only validated OCR outputs into the existing internal OCR signals without changing deterministic policy;
- preserve runner-owned retries, timeout bounds, leases, stale-result handling, and secret non-disclosure;
- retain bounded provider/model/parser metadata without raw responses, signed headers, image bytes, endpoints, credentials, or OCR plaintext;
- compose classifier and OCR providers only in the backend application root after the OCR adapter is complete;
- update environment schema, source-support validation, factories, and readiness only after both selected adapters and conformance boundaries are complete;
- keep credentials, real calls, staging configuration, managed-media product enablement, and calibration outside autonomous source work.

### P4 — moderation calibration harness

- local authorized-corpus manifest;
- aggregate allow/review/reject and false-positive/false-negative reporting;
- bounded fitness-specific categories;
- no raw media, OCR plaintext, credentials, identity, or provider payloads in reports.

### P5 — password-reset product readiness

- localized mobile forgot/reset routes and strict API states;
- validated app/universal links and token hygiene;
- production delivery adapter and EN/RU email templates;
- provider-failure coverage and capability-gated activation.

### P6 — deployment templates and runbooks

- `.env.example`, secret-name, storage/CDN/email policy, and lifecycle templates;
- migration, rollout, worker-start, capability-enable, rollback, and key-rotation order;
- non-production smoke scripts and emergency-disable procedures.

### P7 — explicit sync conflict choices

- backend-owned `keep_local` and `keep_server` with exact revisions and idempotency;
- merge only for explicitly documented deterministic domains;
- immutable bounded resolution audit and stale-choice rejection;
- mobile destructive-choice UI only after the backend contract is merged.

### P8 — diagnostics, release gate, and Android source preparation

- privacy-safe auth/API/provider/worker failure categories;
- exact-SHA cross-repository compatibility manifest and fail-closed gate;
- Android permissions, picker, app-link, network, release-profile, native-module, and build-time source audit.

### P9 — privacy, legal, and analytics prerequisites

- technical data and retention inventory;
- engineering drafts for privacy, terms, acceptable use, provider subprocessors, and appeals;
- analytics consent, identity, taxonomy, retention, deletion, and prohibited-data requirements before any SDK.

## Current execution order

1. P3 selected OCR adapter and classifier/OCR composition/readiness.
2. P4 moderation calibration harness.
3. P5 password-reset mobile, links, templates, and delivery readiness.
4. P6 deployment policies, smoke scripts, and runbooks.
5. P7 backend-owned conflict choices and then mobile UI.
6. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.
7. P9 technical privacy, legal, and analytics prerequisites.

Each phase may be divided into bounded backend, mobile, and documentation PRs. After every backend slice, synchronize this mobile roadmap with exact head and merge SHAs.

## Source work allowed now

- backend and mobile implementation;
- provider adapters written against documented contracts without real credentials;
- deterministic tests, fixtures, conformance suites, and CI;
- CLI and worker entrypoints that are not started in an environment;
- environment, Docker Compose, systemd, policy, smoke, and runbook templates;
- mobile deep-link and Android source configuration;
- technical privacy and legal drafts marked as non-approved;
- exact-green PR merges.

## Activation and release boundary

Source completion does not activate production behavior.

Still prohibited without explicit authorization:

- credential, secret-store, provider-account, bucket, CDN, DNS, sender-domain, or repository-token changes;
- real provider calls or staging calibration;
- backend deployment or migration execution outside CI;
- worker scheduling;
- staging or production activation;
- OTA/EAS publication;
- native builds or device installation;
- public media upload enablement;
- production password-reset email activation;
- legal approval claims.

Physical-device, second-device, offline-restart, accessibility, EN/RU/unit, Android, release, and rollback validation remain external after source preparation.

## Deferred beyond the current program

Do not begin without explicit product prioritization:

- direct messages;
- groups or communities;
- trainer marketplace;
- subscriptions, payments, or tips;
- algorithmic feed ranking or recommendations;
- contact-book discovery;
- location sharing;
- automatic workout publication;
- public nutrition, weight, body-measurement, limitation, recovery, or Coach data;
- public body or health leaderboards;
- multi-image posts and advanced media formats before the bounded one-image pipeline is proven;
- lab analysis, diagnosis, pharmacology, hormone, or supplement protocol features.

## New-chat starter prompt

> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. Do not rely only on this prompt: first verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, backend `docs/architecture/social-media-worker-runtime.md`, and backend `docs/architecture/provider-http-transport.md`; then inspect only code and tests relevant to the selected bounded slice. P0, P1, and P2 are source-complete. P3 transport foundation is complete through backend PR #102 exact green head `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`, merge `1d98e50aa9014bca59a7ed7a51ef3803f296dae3`; the selected Amazon Rekognition classifier request/parser contract is complete through backend PR #103 exact green head `02675ab50683c4745f7f1a3c5cc05b081016bb15`, merge `0e2829d91b077eec9fb60d25390b038ada0676db`. The Rekognition classifier runtime is complete through backend PR #104 exact green head `7c684cc9426d33b4a9ec4e52cb818966ae71fdac`, merge `3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3`. The classifier source boundary is complete, but the OCR API contract is not selected, provider factories remain unavailable, and managed-media capabilities remain disabled. Continue with the smallest complete OCR slice: select and document one provider API contract, then add strict bounded request construction, exact versioned response parsing, provider-neutral OCR mapping, one-attempt transport/circuit integration, runner-owned retry conformance, and secret non-disclosure without changing factories or readiness yet. Do not invent a generic provider payload or make a provider source-ready without a selected contract. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without my direct request.
