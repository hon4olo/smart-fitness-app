# Smart Fitness Active Implementation Plan

Updated: 2026-08-02

This file contains the current verified baseline, active source program, execution order, and authorization boundary. Detailed tasks live in `docs/roadmap/provider-readiness.md`. Completed implementation history remains in merged pull requests and focused architecture and roadmap documents.

## Verified baseline

Before this documentation synchronization slice:

- mobile `main`: `720273195668d3663ec35ba7baca090127ee1b15`;
- backend `main`: `37d4c91cafdeedde122e344fbaca78d00f1c70be`;
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

## Completed P2 status

Production worker entrypoints and source orchestration are source-complete.

Merged evidence:

- backend PR #96 exact green head `6ec65413b4c3164bcf176d41230d817e203b8095`, merge `b6fe1fa4d7f42960f0e0544f256466faa3cf9b49`;
- backend PR #98 exact green head `565d60f99cf20cac7fb7c3bf0dcef01d737048ca`, merge `34104bec69533fbe89bbaa53cef0884119c13e38`;
- backend PR #99 exact green head `6c1a2efe46e435d990df5a5dc39afe07562339f6`, merge `ec42dc864a56311e04997a3bd76f400e0bde129f`;
- backend PR #100 exact green head `5fb21ca3b5d63fee89bf0e3db65b2bf37ba672fd`, merge `6a2b7f1a1196ee66b4e3ad4f049afcef561981f9`;
- backend PR #101 exact green head `cc261cfe01c82d8b18888195fc8e4eec1ee56558`, merge `237d83eb25688e2a72157ea8e199b724bd9426e2`.

Completed source boundary:

- bounded one-shot and continuous worker runtime with per-operation abort observation;
- cleanup, derivative-delivery processing/recovery, moderation processing/recovery, and stale-upload expiry entrypoints;
- strict privacy-safe readiness manifest and read-only CLI;
- explicit retry ownership and bounded process-manager backoff without multiplying provider attempts;
- documented lease budgets and no-heartbeat decision with measured-reopen criteria;
- disabled-by-default systemd and manual-profile Docker Compose examples;
- deterministic template/readiness tests and operational runbook;
- no deployment, scheduling, credentials, provider calls, environment activation, public uploads, or product enablement.

## Current P3 status

The provider-neutral HTTP transport and complete Amazon Rekognition classifier source boundary are source-complete. OCR selection/runtime and final provider composition/readiness remain open.

Backend PR #102, exact green head `b7aa65cdd22d47b914fcb83e7bb674129b6c1c35`, merge `1d98e50aa9014bca59a7ed7a51ef3803f296dae3`:

- added bounded HTTPS GET/POST transport with caller cancellation, internal timeout, manual redirects, no-store requests, omitted credentials, safe headers, and bounded request/response bytes;
- added strict status classification and bounded Retry-After/RateLimit metadata;
- added constant redacted transport errors and no internal retry loop;
- added optional bounded circuit containment with one half-open probe;
- added deterministic no-network conformance tests and architecture documentation;
- preserved provider-runner retry ownership, moderation policy, worker leases, provider factories, production source support, readiness, and product disablement.

Backend PR #103, exact green head `02675ab50683c4745f7f1a3c5cc05b081016bb15`, merge `0e2829d91b077eec9fb60d25390b038ada0676db`:

- selected and documented Amazon Rekognition `DetectModerationLabels` as the classifier API contract;
- added bounded endpoint-relative JPEG request construction;
- added strict moderation-model-v7 response and taxonomy parsing;
- mapped validated labels into existing internal classifier signals without changing deterministic moderation policy;
- intentionally emitted no inferred fitness context or unsupported safety/privacy signals;
- added deterministic no-network conformance and constant redacted errors;
- preserved absent credentials, signing, endpoint configuration, provider factories, readiness, and managed-media product disablement.

Backend PR #104, exact green head `7c684cc9426d33b4a9ec4e52cb818966ae71fdac`, merge `3d2e8cdeb0b0f3d9767a5416e59e06caa4d006c3`:

- added trusted region-derived Rekognition endpoints and service-correct SigV4 signing;
- composed exactly one bounded classifier transport call per provider invocation;
- mapped bounded HTTP, timeout, circuit, parsing, model, and configuration outcomes into the existing classifier provider result contract;
- preserved retry ownership in `runMediaClassifier` with deterministic retry-then-success coverage;
- retained constant non-reflective errors and excluded raw payloads, signed headers, image bytes, endpoints, and credentials;
- preserved absent factory support, environment schema, source readiness, product capability enablement, credentials, real calls, and deployment.

Backend PR #105, exact green head `47237518847f1135629ca730cce9fd442508cb4d`, merge `37d4c91cafdeedde122e344fbaca78d00f1c70be`:

- selected and documented Amazon Rekognition `DetectText` as the OCR API contract;
- added fixed bounded JPEG-byte request construction with an explicit confidence threshold;
- added strict text-model-major-3 parsing, line/word relationship validation, 100-word enforcement, and line-only text projection;
- reused only the pinned Rekognition endpoint and approved-operation SigV4 boundaries;
- composed exactly one bounded OCR transport/circuit attempt per provider invocation;
- preserved retry ownership in `runMediaOcr` and existing worker lease, state-version, CAS, and stale-result behavior;
- mapped bounded transport, HTTP, throttling, parsing, model, and configuration outcomes into the existing OCR provider result contract;
- retained constant non-reflective failures without raw provider payloads, messages, signed headers, image bytes, endpoints, credentials, or OCR plaintext;
- preserved absent factory support, environment schema, production source readiness, product capability enablement, credentials, real calls, and deployment.

## Next bounded slice

Complete the selected classifier/OCR composition-root and source-readiness boundary without activating providers:

- add strict backend-only Rekognition configuration for region, bounded timeout, access-key identifier, secret access key, and optional session token;
- keep credentials represented only as runtime environment inputs and redacted from summaries, errors, capabilities, readiness manifests, and logs;
- compose classifier and OCR providers only in the backend application root through the existing bounded HTTP transport and explicitly scoped circuit containment;
- preserve independent provider-runner retry ownership and keep adapter transport timeout at or below the configured runner attempt timeout;
- update source-support validation only for the selected fully implemented adapters while preserving separate configured, ready, and enabled states;
- keep absent/incomplete settings fail-closed and preserve unavailable providers as the safe default;
- add deterministic configuration, factory, source-support, production-validation, worker-readiness, capability, and secret non-disclosure coverage without network calls;
- do not mark operational readiness true without complete runtime settings, and do not enable managed-media product behavior or public uploads.

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
