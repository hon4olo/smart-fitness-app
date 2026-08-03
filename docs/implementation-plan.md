# Smart Fitness Active Implementation Plan

Updated: 2026-08-03

This file contains the current verified baseline, active source program, execution order, and authorization boundary. Detailed tasks live in `docs/roadmap/provider-readiness.md`. Completed implementation history remains in merged pull requests and focused architecture and roadmap documents.

## Verified baseline

Before this documentation synchronization slice:

- mobile `main`: `32249cf88781b75e3f50c274510bff87b68250ad`;
- backend `main`: `288425d9e8608c56f814af74274301c3940a371c`;
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
- backend PR #111 exact green head: `1f0d08ff6eccec676c94bd231e974ad98cdd5176`;
- backend PR #111 merge: `ecd8a2e425b032be323b9852ba9e60221a1ca968`;
- mobile PR #381 exact green head: `e57d84e89499f34c3cdaf46b73a76548d80b4e16`;
- mobile PR #381 merge: `cf3de6bd746493ffbf8d4d3159c302dadb6c5c30`;
- backend PR #112 exact green head: `ef779e42f6d28f4c8c103a4a2961d1ee8c26b436`;
- backend PR #112 merge: `44604b216bef723680fdd12f3a5d9d100bb70e3b`;
- mobile PR #382 exact green head: `ad25597ff91a947fb90964f2993ecb6f5e79487d`;
- mobile PR #382 merge: `521f6202cf9782f299d14c4b3f92920d5c65d3cc`;
- mobile PR #383 exact green head: `4e596dd3f6abd44284e0baf8509f19296c24178b`;
- mobile PR #383 merge: `ef048d41f47487fe079afb1b5ac4b49edea36d76`;
- mobile PR #384 exact green head: `f6c238434fe3632cef697210bad5dc73b68c7b40`;
- mobile PR #384 merge: `19bb637d900941e5721d63a8e673089c27d11ad1`;
- backend PR #113 exact green head: `3e366e803f91d4d563d0b1e70cc189381534cd18`;
- backend PR #113 merge: `bad69c42325e7156215e7fdba45962ade3372ef1`;
- mobile PR #385 exact green head: `9b7605bf53e3b4a6ca1f437f1ff89f44ade1c821`;
- mobile PR #385 merge: `25bbefa7621fefa0ec6bafafc34aec867f3638f1`;
- backend PR #114 exact green head: `9e9408ec87a6c6fc0786cd66c8272b502dbb5790`;
- backend PR #114 merge: `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`;
- mobile PR #386 exact green head: `8076e93c43e53cc0b9e460866745c2baebfd5038`;
- mobile PR #386 merge: `32249cf88781b75e3f50c274510bff87b68250ad`;
- backend PR #116 exact green head: `12ba41f2176079fbb4fbe13fc07e3016c16f5049`;
- backend PR #116 merge: `288425d9e8608c56f814af74274301c3940a371c`;
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

Backend PR #106, exact green head `cecb34a3044110cf252fe845217d199ddad7afd8`, merge `95c923c146b0abcad7f97ed7073616cf30ad8bab`:

- replaced unsupported generic classifier/OCR selectors with explicit `amazon_rekognition` selectors;
- added strict shared backend-only Rekognition environment inputs without committing values;
- rejected incomplete, malformed, unsupported, fallback, and unsafe enabled production configuration;
- composed both selected adapters only in the application root through one bounded transport and independent circuits;
- preserved runner-owned attempts/timeouts and safe unavailable defaults;
- updated source support, configured/ready state, capabilities, and worker readiness while keeping product enablement separate;
- added deterministic configuration, factory, production-validation, capability, readiness, redaction, and no-network tests;
- made no real provider call and performed no deployment, worker scheduling, environment activation, product enablement, or public upload activation.

## P4 calibration source completion

Backend PR #107, exact green head `ce50efbd088200c572116b62bf627dc25e026b11`, merge `db5ee5ab50c760619dfa254618b5f2de64f2e044`, completed the strict provider-injected aggregate calibration core.

Backend PR #108, exact green head `e13d8f53e9eefad9e9f9ea6513b986a40a9e2760`, merge `a0f97680189b6daa05a2b5fc22a469d687df23c9`, completed the bounded CLI, canonical local filesystem, provider composition, private no-overwrite reporting, interruption, redaction, and deterministic no-network boundary.

Backend PR #109, exact green head `d3b6a1599352a79a4dd2bb8d361148d605de3ec3`, merge `c8d315113881e81f7b6c8522bfb5b439b4b36972`, completed the source-prepared non-production operations boundary:

- exact CLI invocation and fail-closed commit/build/configuration/filesystem/output preflight;
- separate corpus-owner, operator, reviewer, policy-owner, deletion-verifier, and incident-owner responsibilities;
- lawful-purpose, provenance, minimization, access, retention, secure-deletion, and accidental-media requirements;
- aggregate-only review, private report handling, interruption/retry, deletion verification, and privacy-safe evidence;
- explicit prohibition on treating synthetic tests as provider-quality evidence or changing thresholds/product state during calibration operations.

P4 autonomous source preparation is complete. Corpus collection, credentials, provider-account validation, real calls, representative non-production execution, quota/latency evidence, aggregate review, threshold or policy proposals, product enablement, public uploads, production activation, and every calibration claim remain external and require direct authorization.

## P5 source completion

The password-reset product and delivery source boundary is complete across backend and mobile.

Existing invariants remain unchanged:

- generic accepted responses do not disclose account existence;
- hashed one-time tokens retain cooldown, expiry, replay rejection, undelivered-token invalidation, password replacement, and all-session revocation;
- provider credentials and readiness remain inert until the explicit password-reset product flag is enabled;
- tokens remain outside ordinary persisted application state, logs, diagnostics, analytics, and user-visible copy.

Backend PR #110, exact green head `54fe3bcf57745caddb1177ef6c75453befed407f`, merge `2c683c95274409aa5958033e96cb8acf67ca8b56`, completed the selected Resend request, bilingual template, exact trusted reset-link, strict parser, deterministic idempotency, and no-network contract boundary.

Backend PR #111, exact green head `1f0d08ff6eccec676c94bd231e974ad98cdd5176`, merge `ecd8a2e425b032be323b9852ba9e60221a1ca968`, completed the bounded Resend runtime, adapter-owned retry/failure mapping, stable request identity, strict success parsing, provider-message discard, final constant error, and token-invalidation preservation.

Backend PR #112, exact green head `ef779e42f6d28f4c8c103a4a2961d1ee8c26b436`, merge `44604b216bef723680fdd12f3a5d9d100bb70e3b`, completed explicit `resend` selection, strict backend-only configuration, application-root composition through the shared bounded transport, privacy-safe configured/ready state, capability gating, fail-closed production validation, and deterministic no-network coverage.

Mobile PR #383, exact green head `4e596dd3f6abd44284e0baf8509f19296c24178b`, merge `ef048d41f47487fe079afb1b5ac4b49edea36d76`, completed release-grade app/universal-link source preparation:

- added fail-closed dynamic Expo configuration using the shared `PASSWORD_RESET_APP_LINK_BASE_URL` setting;
- accepts only one exact HTTPS DNS-hosted `/auth/reset-password` route with no port, credentials, query, fragment, trailing slash, or broad path;
- adds narrowly scoped iOS associated-domain and Android verified app-link source configuration while preserving existing configuration and idempotence;
- enforces the backend-generated exact 43-character base64url token and rejects missing, duplicate, short, long, padded, or non-URL-safe values before any reset request;
- removes token material from navigation state after malformed input, terminal token rejection, or successful reset;
- preserves localized invalid-link recovery, capability gating, generic accepted responses, session cleanup, and forced return to sign-in;
- documents external AASA, `assetlinks.json`, owned-domain, signing-certificate, native-build, physical-device, and real-delivery gates;
- passed repository and changed-file line audits, TypeScript, Coach/sync contract tests, the full regression suite, Expo export, and Expo Doctor on the exact merged head.

P5 autonomous source preparation is complete. The next approved source phase is P6 deployment configuration, policies, smoke scripts, and runbooks.

Operational password reset remains unavailable until an authorized environment supplies a verified sender domain, Resend account and credential, exact owned HTTPS link domain, Apple and Android association files, backend deployment and migration execution, a new native build, real non-production delivery evidence, physical-device validation, and explicit capability enablement.

No credential, sender-domain, DNS, association-file deployment, provider account, real delivery, backend deployment, migration execution outside CI, environment activation, OTA/EAS publication, native build, device installation, or production capability activation was performed.

## P6 current source boundary

Backend PR #113, exact green head `3e366e803f91d4d563d0b1e70cc189381534cd18`, merge `bad69c42325e7156215e7fdba45962ade3372ef1`, completed fail-closed environment templates and the staging/production configuration matrix.

Backend PR #114, exact green head `9e9408ec87a6c6fc0786cd66c8272b502dbb5790`, merge `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`, completed provider-neutral private-storage, immutable-delivery, CORS, lifecycle, encryption, public-access, and CDN-origin policy contracts aligned with the implemented S3-compatible adapters.

Backend PR #116, exact green head `12ba41f2176079fbb4fbe13fc07e3016c16f5049`, merge `288425d9e8608c56f814af74274301c3940a371c`, completed sender and link-domain association source preparation:

- added placeholder-only Resend DKIM/SPF/MX, Apple AASA, and Android Digital Asset Links templates;
- fixed the source contract to `/auth/reset-password`, `com.dzahard28.smartfitnessapp`, external Apple Team ID, and external Android release signing fingerprint;
- documented exact HTTPS/no-redirect hosting, staging/production isolation, privacy-safe browser fallback, rollback, and no-token evidence requirements;
- kept the current Resend integration send-only with no callback route, webhook secret, provider-event persistence, or callback-based readiness claim;
- added deterministic route, identifier, wildcard-rejection, placeholder, callback-disablement, and credential-shape coverage;
- passed the complete blocking Backend CI.

The active P6 boundary is now rollout and rollback ordering:

- define exact migration, backend, worker, capability-enablement, verification, disablement, and rollback order;
- require explicit staging or production targeting and fail closed before each irreversible or externally visible transition;
- preserve current disabled defaults and content-free evidence requirements;
- leave migration execution outside CI, deployment, worker startup, DNS, real provider calls, native builds, and capability activation external.

No provider account, credential, infrastructure, DNS, association deployment, callback registration, real delivery, backend deployment, worker startup, environment activation, capability enablement, OTA/EAS publication, native build, or device installation was performed.

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
