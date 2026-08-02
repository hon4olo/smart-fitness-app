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

- mobile `main`: `4e7149c6f36787580a4f21161c7c4dd4f434f5b4`;
- backend `main`: `db5ee5ab50c760619dfa254618b5f2de64f2e044`;
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
- backend PR #105 exact green head: `47237518847f1135629ca730cce9fd442508cb4d`;
- backend PR #105 merge: `37d4c91cafdeedde122e344fbaca78d00f1c70be`;
- backend PR #106 exact green head: `cecb34a3044110cf252fe845217d199ddad7afd8`;
- backend PR #106 merge: `95c923c146b0abcad7f97ed7073616cf30ad8bab`;
- backend PR #107 exact green head: `ce50efbd088200c572116b62bf627dc25e026b11`;
- backend PR #107 merge: `db5ee5ab50c760619dfa254618b5f2de64f2e044`;
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

Status: source-complete and merged. Provider-neutral transport, strict Amazon Rekognition classifier/OCR adapters, backend-only configuration, composition-root factories, production source support, privacy-safe readiness, and deterministic conformance are complete. Credentials, real calls, staging calibration, product enablement, deployment, and public uploads remain external activation gates.

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

Backend PR #105, exact green head `47237518847f1135629ca730cce9fd442508cb4d`, merge `37d4c91cafdeedde122e344fbaca78d00f1c70be`:

- selected and documented Amazon Rekognition `DetectText` as the OCR API contract;
- added an explicit confidence-80 JPEG-byte request with a 5 MiB input bound;
- added strict text-model-major-3 parsing with bounded geometry, unique identifiers, line/word parent validation, 100-word enforcement, and line-only text projection;
- generalized the pinned Rekognition endpoint and SigV4 boundaries only to the two approved classifier/OCR operations;
- composed exactly one bounded OCR HTTP/circuit attempt per provider invocation and preserved retry ownership in `runMediaOcr`;
- mapped timeout, network, circuit, throttling, retryable/terminal HTTP, malformed-response, model-drift, and runtime-configuration outcomes into existing `ocr_*` result codes;
- added deterministic no-network contract/runtime conformance and excluded raw provider payloads, messages, signed headers, image bytes, endpoints, credentials, and OCR plaintext from errors and logs;
- made no real provider call and did not change factories, environment schema, production source support, readiness, workers, product capabilities, or activation.

Backend PR #106, exact green head `cecb34a3044110cf252fe845217d199ddad7afd8`, merge `95c923c146b0abcad7f97ed7073616cf30ad8bab`:

- replaced unsupported generic classifier/OCR selectors with explicit `amazon_rekognition` selectors;
- added strict shared Rekognition region, access-key identifier, secret access key, optional session token, and bounded timeout inputs;
- rejected incomplete, unsupported-region, malformed, fallback, and unsafe enabled production configuration;
- composed the classifier and OCR adapters only in the backend application root through one bounded HTTP transport and independent circuit breakers;
- preserved provider-runner retry ownership and kept each adapter timeout aligned with its runner attempt timeout;
- updated source-support and readiness so complete settings are configured/ready while product enablement remains a separate explicit flag;
- added deterministic environment, factory, capability, worker-readiness, redaction, and no-network coverage;
- committed no credential values, made no real provider call, and performed no deployment, scheduling, environment activation, product enablement, or public upload activation.

P3 activation boundary:

- source completion does not prove provider-account access, quotas, latency, model behavior, or fitness-specific moderation quality;
- credentials must be supplied later through the deployment environment or secret store and must not be committed;
- real provider calls, authorized staging corpus work, thresholds, product flags, workers, and public uploads require explicit authorization;
- absent settings preserve unavailable behavior, and credentials alone do not enable managed-media capabilities;
- P4 must produce aggregate calibration evidence before any production enablement decision.

### P4 — moderation calibration harness

Status: active. The strict provider-injected calibration core is merged; safe local corpus I/O, CLI composition, no-overwrite output, and authorized representative execution remain open.

Backend PR #107, exact green head `ce50efbd088200c572116b62bf627dc25e026b11`, merge `db5ee5ab50c760619dfa254618b5f2de64f2e044`:

- added a strict versioned local manifest contract with opaque case IDs, safe relative JPEG paths, existing media asset types, expected policy decisions, and at most 1000 cases;
- added bounded reporting categories for ordinary gym photos, sportswear, bodybuilding stages, progress photos, possible minors, sexual context, violence, text overlays, prohibited content, and ambiguous cases;
- executes injected classifier and OCR providers through the existing provider runners, sends completed OCR text through an injected text-moderation boundary, and applies the existing deterministic media policy;
- added aggregate actual/expected allow-review-reject counts, mismatches, false positives, false negatives, undetermined cases, and bounded input/provider/text failure categories;
- added deterministic aggregate-only JSON and CSV renderers that exclude case IDs, file paths, image bytes, OCR plaintext, provider payloads/messages/identifiers, endpoints, credentials, identity, free text, and exception details;
- added synthetic no-network tests and documented metric, retry, corpus, and privacy boundaries;
- did not add a corpus, real images, credentials, real calls, thresholds, policy changes, routes, database changes, deployment, activation, or calibration claim.

Remaining P4 source boundary:

- add an internal CLI with strict arguments and deterministic exit codes;
- read manifest and JPEG files only from an explicitly selected canonical local corpus root with symlink/path-escape rejection and bounded file sizes;
- compose the already selected classifier/OCR providers and OCR text moderator without logging secrets or plaintext;
- require explicit JSON/CSV output paths, exclusive no-overwrite writes, private file permissions, and cleanup on partial failure;
- add deterministic filesystem, argument, output, interruption, redaction, and no-network tests;
- add operational corpus authorization, access, retention, deletion, and result-review procedures;
- keep representative authorized corpus execution, threshold review, real calls, and all calibration claims external.

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

1. P4 moderation calibration harness.
2. P5 password-reset mobile, links, templates, and delivery readiness.
3. P6 deployment policies, smoke scripts, and runbooks.
4. P7 backend-owned conflict choices and then mobile UI.
5. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.
6. P9 technical privacy, legal, and analytics prerequisites.

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

> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. First verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, backend `docs/architecture/social-media-worker-runtime.md`, backend `docs/architecture/provider-http-transport.md`, backend `docs/architecture/amazon-rekognition-classifier.md`, backend `docs/architecture/amazon-rekognition-ocr.md`, and backend `docs/architecture/media-moderation-calibration.md`; then inspect only code and tests relevant to the selected bounded slice. P0 through P3 are source-complete. P4 calibration core is complete through backend PR #107 exact green head `ce50efbd088200c572116b62bf627dc25e026b11`, merge `db5ee5ab50c760619dfa254618b5f2de64f2e044`. No corpus, real images, credentials, real provider calls, thresholds, deployment, activation, or calibration claim exists. Continue with the smallest complete P4 CLI/filesystem slice: strict CLI arguments and exit codes, canonical local corpus-root containment with symlink/path-escape rejection, bounded manifest/JPEG reads, selected-provider and OCR-text-moderator composition, exclusive mode-0600 JSON/CSV output, partial-failure cleanup, deterministic no-network filesystem tests, and operational corpus handling documentation. Preserve aggregate-only reports and keep case IDs, paths, image bytes, OCR plaintext, provider payloads/messages/identifiers, endpoints, credentials, identity, free text, and exception details out of process output and report files. Representative authorized corpus execution, real calls, threshold review, and calibration claims remain external. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without direct authorization.
