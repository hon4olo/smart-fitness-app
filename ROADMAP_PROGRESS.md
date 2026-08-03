# Smart Fitness Roadmap Progress

Updated: 2026-08-03

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

- mobile `main`: `1c49a6f7fd236c30e0539b510d6818470a356273`;
- backend `main`: `2c683c95274409aa5958033e96cb8acf67ca8b56`;
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
- backend PR #108 exact green head: `e13d8f53e9eefad9e9f9ea6513b986a40a9e2760`;
- backend PR #108 merge: `a0f97680189b6daa05a2b5fc22a469d687df23c9`;
- backend PR #109 exact green head: `d3b6a1599352a79a4dd2bb8d361148d605de3ec3`;
- backend PR #109 merge: `c8d315113881e81f7b6c8522bfb5b439b4b36972`;
- backend PR #110 exact green head: `54fe3bcf57745caddb1177ef6c75453befed407f`;
- backend PR #110 merge: `2c683c95274409aa5958033e96cb8acf67ca8b56`;
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

Status: source-complete and merged. The provider-injected calibration core, bounded local CLI/filesystem/reporting boundary, and non-production operator runbook are complete. Representative authorized execution, real provider calls, provider-account/quota/latency evidence, threshold review, product activation, and every calibration claim remain external.

Backend PR #107, exact green head `ce50efbd088200c572116b62bf627dc25e026b11`, merge `db5ee5ab50c760619dfa254618b5f2de64f2e044`:

- added the strict versioned manifest and provider-injected aggregate calibration core;
- reused existing classifier/OCR runners, OCR text moderation, and deterministic media policy;
- added bounded category, decision, mismatch, false-positive/false-negative, undetermined, and failure aggregates;
- added aggregate-only deterministic JSON/CSV rendering and synthetic no-network tests;
- added no corpus, real media, credential, real call, threshold/policy change, deployment, activation, or calibration claim.

Backend PR #108, exact green head `e13d8f53e9eefad9e9f9ea6513b986a40a9e2760`, merge `a0f97680189b6daa05a2b5fc22a469d687df23c9`:

- added strict CLI arguments and deterministic aggregate process states and exit codes;
- added canonical local corpus containment with traversal, symlink, file-type, size, manifest, and JPEG rejection;
- composed configured classifier, OCR, and pure non-persisting OCR text moderation without opening the database;
- added exclusive mode-`0600` no-overwrite JSON/CSV output, deterministic content, synchronization, rollback, and bounded interruption behavior;
- added deterministic filesystem, text-policy, CLI, output, composition, interruption, redaction, and no-network tests;
- kept reports/process output free of case IDs, roots/paths, media bytes/hashes, OCR plaintext, provider details, endpoints, credentials, identity, free text, and exception details.

Backend PR #109, exact green head `d3b6a1599352a79a4dd2bb8d361148d605de3ec3`, merge `c8d315113881e81f7b6c8522bfb5b439b4b36972`:

- added the operator-facing non-production calibration runbook with exact CLI invocation and fail-closed preflight;
- defined corpus lawful purpose, provenance, minimization, access, bounded retention, secure deletion, and accidental-media incident handling;
- separated corpus ownership, operation, aggregate review, threshold decisions, deletion verification, and incident response;
- defined aggregate-only result review, private report handling, interruption/retry rules, deletion evidence, and privacy-safe operational records;
- explicitly prohibited deriving production quality or thresholds from synthetic tests and kept all real execution/evidence/activation gates external;
- added no corpus, real media, credential, provider account, real call, threshold/policy change, route, database change, deployment, scheduling, activation, public upload, or calibration claim.

P4 external evidence boundary:

- source completion does not prove provider-account access, quota behavior, latency, moderation quality, or fitness-specific error rates;
- representative non-production corpus collection and execution require explicit authorization;
- real provider calls, aggregate evidence review, threshold or policy proposals, product flags, workers, public uploads, and production activation remain external;
- no statement that moderation is calibrated or production-ready is supported until those external gates are completed and reviewed.

### P5 — password-reset product readiness

Status: active. The provider-neutral backend token/session foundation and localized mobile forgot/reset source flow already exist. Resend `POST /emails` is now the selected concrete delivery API contract, and its trusted reset-link construction, bilingual templates, request builder, strict success parser, idempotency identity, and no-network conformance are merged. Runtime transport, provider failure/retry mapping, backend composition/readiness, release-grade app/universal links, real delivery, and activation remain open.

Existing source foundation:

- backend PR #60, exact head `af192c4fbe48c82f1d8e3ac5c7f020c2949fe72f`, merge `5aa7fa35b0d3e89fe1e824266fd659d1296a61a3`, added generic accepted responses, hashed one-time tokens, cooldown, expiry/replay rejection, undelivered-token invalidation, password replacement, and all-session revocation;
- mobile PR #200, exact head `5ff6cdb50fe04e35d7294d241e37ea46924c06c2`, merge `1b77802bb765a1a3db6b8dcd1f081c210049a2d0`, added localized capability-gated forgot/reset routes, strict API states, password validation, token hygiene, success handling, and forced return to sign-in;
- the current mobile source supports the private `smartfitnessapp` reset route, but production app/universal-link domain configuration and physical-device validation remain open.

Backend PR #110, exact green head `54fe3bcf57745caddb1177ef6c75453befed407f`, merge `2c683c95274409aa5958033e96cb8acf67ca8b56`:

- selected and documented Resend `POST https://api.resend.com/emails` as the concrete password-reset delivery contract;
- added the fixed HTTPS endpoint, Bearer authorization, required direct-HTTP user agent, JSON content type, and deterministic SHA-256 idempotency key without raw email or token;
- constructs a reset URL only from an exact trusted HTTPS reset-route base with one URL-encoded `token` parameter;
- added bounded bilingual EN/RU subject, plain-text, and HTML templates with exact expiry and unrequested-reset guidance;
- emits only one sender, one recipient, subject, HTML, and plain text;
- added strict bounded exact success parsing for the provider message ID;
- rejects unsafe API keys, email addresses, tokens, expiry values, and link bases with constant non-reflective errors;
- added deterministic no-network tests and did not add an account, credential, sender/domain, DNS, network call, runtime retry, factory, environment selector, readiness, capability, deployment, or activation change.

Remaining P5 boundary:

- add a Resend runtime that performs one bounded shared-transport attempt per adapter attempt and reuses the same idempotency identity;
- define explicit bounded retry ownership and classify only validated provider status/error identifiers while ignoring provider messages;
- map timeout, cancellation, network, rate-limit, idempotency/conflict, server, authentication, sender-verification, validation, security, malformed-success, and contract-drift outcomes into the existing `PasswordResetDelivery` success/final-failure boundary;
- preserve password-reset-service invalidation of the token after final delivery failure and avoid hidden retry multiplication;
- add deterministic timeout, network, cancellation, rate-limit, conflict, terminal/auth/configuration, malformed-response, retry, and secret/email/token/reset-link/provider-payload non-disclosure coverage;
- add strict backend configuration, composition-root support, source-support validation, and readiness only after the runtime adapter is complete and green;
- complete release-grade app/universal-link source configuration, token/navigation/accessibility tests, and later physical-device validation;
- keep sender-domain/DNS setup, provider account and credentials, real email delivery, deployment, OTA/native builds, and production activation external.

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

1. P5 password-reset mobile, links, templates, and delivery readiness.
2. P6 deployment policies, smoke scripts, and runbooks.
3. P7 backend-owned conflict choices and then mobile UI.
4. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.
5. P9 technical privacy, legal, and analytics prerequisites.

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

> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. First verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/release-and-account.md`, mobile password-reset routes/tests, backend password-reset service/delivery/configuration contracts, shared provider HTTP transport, and backend `docs/architecture/resend-password-reset-delivery.md`. P0 through P4 autonomous source preparation are complete. The concrete Resend password-reset request/template/parser contract is complete through backend PR #110 exact green head `54fe3bcf57745caddb1177ef6c75453befed407f`, merge `2c683c95274409aa5958033e96cb8acf67ca8b56`. No Resend account, credential, verified sender/domain, DNS, real email, runtime transport, factory/readiness, deployment, or activation was added. Continue with the smallest complete backend runtime slice only: compose exactly one bounded Resend request attempt through the existing shared provider HTTP transport, keep a stable idempotency identity across bounded adapter-owned retries, classify only bounded official status/error identifiers while ignoring messages, map final success/failure into the existing `PasswordResetDelivery` contract, preserve token invalidation after final delivery failure, and add deterministic timeout/network/cancellation/rate-limit/idempotency-conflict/server/authentication/sender-validation/security/malformed-success/redaction/no-network conformance. Do not change environment selectors, composition root, source-support validation, readiness, capabilities, mobile routes, or activation in the same runtime slice. Preserve generic accepted responses, token hashing, cooldown, expiry/replay rejection, all-session revocation, token non-persistence, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, sender domains, DNS, provider accounts, call real providers, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without direct authorization.
