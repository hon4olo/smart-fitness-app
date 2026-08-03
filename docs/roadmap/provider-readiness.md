# Provider and Release Readiness Roadmap

Updated: 2026-08-03

## Objective

Prepare the mobile application and backend so later activation is limited to provider selection, credentials, infrastructure creation, deployment, staging validation, native builds, and feature-flag changes.

This is an approved autonomous source program. It does not authorize connecting real providers, changing credentials, deploying backend changes, running migrations outside CI, publishing OTA updates, creating or installing native builds, or enabling public media uploads.

## Verified starting baseline

Before this documentation synchronization slice:

- mobile `main`: `1e4bcb4dbd7d7aba8ee16ada91602e21ee401e44`;
- backend `main`: `ecd8a2e425b032be323b9852ba9e60221a1ca968`;
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
- open mobile pull requests: none;
- open backend pull requests: none.

Always recheck both exact `main` commits and open pull requests before starting a slice.

## Existing foundation to reuse

The source already includes:

- private managed-media lifecycle metadata and state transitions;
- private quarantine upload contracts and narrowly scoped signed PUT semantics;
- server-side image validation, normalization, metadata removal, classifier and OCR contracts;
- approved derivative generation and immutable public descriptors;
- managed avatar and one-image workout-post mobile flows;
- manual review, owner appeals, reviewer evidence export, retention deadlines, legal holds, restart-safe cleanup claims, and append-only audit;
- provider-neutral password-reset delivery with hashed one-time tokens, expiry, replay rejection, and all-session revocation;
- strict mobile trust-boundary parsing, EN/RU localization, offline recovery, and blocking CI.

Do not replace these contracts with provider-specific domain models. Provider identifiers, SDK payloads, credentials, and raw responses remain behind backend adapters.

## Global invariants

- Keep safe defaults disabled.
- Mobile never contains provider credentials or calls storage, moderation, OCR, email, or AI providers directly.
- Provider-specific payloads do not leak into routes, domain DTOs, public descriptors, mobile contracts, logs, or diagnostics.
- Unknown or malformed provider results fail closed.
- Reviewed, pending, rejected, failed, appealed, and deleted media remain non-public unless a valid explicit transition approves them.
- Preserve ownership checks, state versions, idempotency, leases, retries, retention, legal holds, account cascade, and immutable audit.
- Never log tokens, email, object keys, signed URLs, raw images, OCR plaintext, provider payloads, private workout data, or full idempotency keys.
- Keep every new hand-written source or architecture file at or below 500 physical lines.
- Merge only exact fully green heads.

## Phase P0 — provider configuration and capability foundation

Status: source-complete and merged.

Merged evidence:

- backend PR #92 exact green head: `97f363221b77fc69041ab19d713e9d9c9124ef9d`;
- backend PR #92 merge: `7b557a216a3e08b043941f2863c6ae64c68b0cf0`;
- backend PR #93 exact green head: `d3a1f19ed419fe96111925ebe37e36ad855a67de`;
- backend PR #93 merge: `84e4100b85d24bfee04be2dbea0130fd95be3370`;
- mobile PR #363 exact green head: `ebda5b78713e0313bf088a54b299b6a943131074`;
- mobile PR #363 merge: `ac468c103db07ecb6b550535ed77aa72898fb68d`.

Backend PR #92 exact head passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health. Backend PR #93 passed the same blocking Backend CI. Mobile PR #363 passed repository and changed-file line audits, TypeScript, Coach and sync contract tests, 1174 regression tests, Expo export, and Expo Doctor.

Backend:

- [x] define provider-neutral configuration selectors for private object storage, immutable media delivery, media classifier, OCR, and password-reset delivery;
- [x] separate `configured`, `ready`, and `enabled` states so credentials alone cannot activate a feature;
- [x] add strict production validation for provider names, endpoints, regions, bucket names, public base URLs, timeouts, retry limits, worker concurrency, and feature flags;
- [x] reject production startup when an enabled feature would use an in-memory, unavailable, incomplete, or source-unsupported provider;
- [x] keep safe defaults disabled and preserve current behavior when no provider configuration exists;
- [x] add redacted configuration summaries and privacy-safe readiness representation;
- [x] add provider factories at the composition root rather than in routes or domain services.

Cross-repository capability contract:

- [x] add a versioned backend capability response for managed avatars, workout-post images, media moderation, media delivery, and password reset;
- [x] distinguish source availability from operational readiness and product enablement;
- [x] expose the privacy-safe capability bootstrap before authentication so pre-auth password reset can be gated without hard-coded assumptions;
- [x] add strict fail-closed mobile parsing and account/session-safe refresh behavior;
- [x] hide or disable unavailable controls without sending requests into a known-disabled pipeline;
- [x] localize bounded unavailable, temporarily unavailable, configuration-required, checking, and recheck-required states in English and Russian.

The merged backend response is public, strict, versioned, provider-neutral, and privacy-safe. It does not expose provider names, secret names or values, endpoints, buckets, regions, email, object keys, signed URLs, provider payloads, raw internal errors, or user data.

Acceptance criteria:

- [x] production cannot accidentally activate a partially configured provider;
- [x] missing credentials preserve disabled behavior rather than causing startup-time secret leakage or request-time ambiguity;
- [x] mobile behavior is determined by a strict backend capability contract, not hard-coded assumptions;
- [x] password-reset, managed-avatar, and workout-post image requests are blocked until the corresponding capability is confirmed available;
- [x] text-only workout-post publication remains available when workout-post images are disabled;
- [x] account and session transitions clear capability state, abort prior loading, and ignore stale responses.

No real provider adapter, credential, provider call, backend deployment, worker activation, public upload activation, or production password-reset email activation was performed.

## Phase P1 — S3-compatible private storage and immutable delivery adapters

Status: source-complete and merged.

Merged evidence:

- backend PR #94 exact green head: `f0a199ac4c797d6b025fb48226502a7edddcab9e`;
- backend PR #94 merge: `a2d4f67db3000785facb11e2d69cacb8cda03bc3`;
- backend PR #95 exact green head: `ab30ee7b31458b69409ba7c00116397fad07887e`;
- backend PR #95 merge: `1eefe77d7260721fc7f3b5a2c0f85e6a962583c8`;
- both exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

Private object storage:

- [x] implement a production S3-compatible adapter usable with AWS S3, Cloudflare R2, Backblaze B2 S3 API, MinIO, or another explicitly configured compatible endpoint;
- [x] create narrowly scoped presigned private `PUT` uploads with exact method, content type, content length, expiry, signed headers, and key namespace;
- [x] implement signed `HEAD`, bounded private `GET`, conditional immutable private `PUT`, and idempotent exact-object deletion;
- [x] verify returned content length, media type, ETag, last-modified metadata, optional SHA-256 metadata, and missing-object behavior;
- [x] reject path traversal, foreign namespaces, unsafe endpoint configuration, unbounded reads, mutable replacement, malformed metadata, and inconsistent response bytes;
- [x] keep quarantine and moderation-master objects private and compose the concrete provider only in the application root;
- [x] use exact known private object deletion and reserve bounded prefix enumeration for the validated immutable asset-prefix cleanup contract that requires it.

Immutable delivery:

- [x] implement immutable derivative upload with SHA-256 verification and exact JPEG metadata;
- [x] enforce `public, max-age=31536000, immutable` for public variants;
- [x] refuse replacement of an existing key with different content;
- [x] implement exact object and validated asset-prefix cleanup with bounded pagination and partial-publication recovery;
- [x] build public URLs only from a configured trusted HTTPS origin base URL;
- [x] preserve owner-opaque canonical asset paths and strict content-hashed named variant keys.

Validation:

- [x] add deterministic signing and private-storage conformance coverage for expiry, MIME and size binding, missing objects, bounded reads, duplicate writes, idempotent exact deletion, namespace isolation, checksum mismatch, malformed metadata, and secret non-disclosure;
- [x] extend conformance coverage for immutable publication, strict XML parsing, bounded prefix enumeration and deletion, pagination, prefix isolation, cleanup replay, and partial-publication recovery;
- [x] retain deterministic in-memory providers for unit and PostgreSQL integration tests;
- [x] keep CI independent of real credentials and network calls.

Acceptance criteria:

- [x] storage and delivery concrete providers are selected only in the composition root;
- [x] provider credentials and complete settings do not enable managed-media product behavior;
- [x] unsafe or incomplete enabled production configuration remains fail-closed;
- [x] provider-specific HTTP and XML payloads do not enter routes, domain DTOs, public descriptors, mobile contracts, logs, or diagnostics;
- [x] existing approval transitions, state versions, leases, retries, manual review, appeals, retention, legal holds, cleanup claims, and append-only audit remain unchanged.

No credential, real provider call, provider account, bucket, public ACL, CDN, DNS, deployment, worker activation, public upload activation, or production environment change was performed.

## Phase P2 — production worker entrypoints and orchestration

Status: source-complete and merged.

Merged evidence:

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
- all exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

Acceptance criteria:

- [x] bounded one-shot and continuous runtime with deterministic aggregate output and exit codes;
- [x] graceful shutdown between individual operations and abortable idle polling;
- [x] cleanup, derivative-delivery, moderation, recovery, and stale-upload expiry process entrypoints;
- [x] strict versioned worker readiness without database access, provider calls, provider identities, endpoints, secrets, IDs, object keys, OCR text, or media bytes;
- [x] provider-level versus process-level retry ownership documented and tested;
- [x] bounded external restart backoff without in-process retry multiplication;
- [x] lease budgets and heartbeat decisions recorded for every operation;
- [x] disabled-by-default systemd unit/timer and manual Docker Compose templates;
- [x] process ordering, duplicate-process, crash-recovery, rollout, rollback, emergency-disable, and capability-enable runbook;
- [x] deterministic source tests for readiness, strict parsing, privacy, gating, timers, restart behavior, and template commands;
- [x] no worker started or scheduled in any environment during source implementation.

P2 source completion does not imply infrastructure readiness or activation. No credential, provider account, real provider call, bucket, CDN, DNS, deployment, migration execution outside CI, unit installation, timer enablement, Docker worker startup, public upload activation, or production environment change was performed.

## Phase P3 — classifier, OCR, and provider transport readiness

Status: source-complete and merged. Transport, classifier/OCR contracts and runtimes, strict backend-only configuration, composition-root factories, production source support, privacy-safe readiness, and deterministic conformance are complete. External activation and calibration remain open.

Merged evidence:

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
- all five exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

Provider-neutral runtime:

- [x] add a bounded backend HTTPS transport with abortable timeout, caller cancellation, response-size limits, strict status handling, and redacted errors;
- [x] perform exactly one transport attempt so existing provider runners retain bounded retry ownership;
- [x] parse bounded standard and interoperable rate-limit metadata;
- [x] block automatic redirects and reject unsafe URLs, credentials, fragments, headers, methods, and sizes;
- [x] add optional bounded circuit containment without provider identity, endpoint state, or hidden configuration failures;
- [x] add deterministic transport conformance for timeout, cancellation, network failure, malformed metadata, declared/streamed overflow, rate limiting, retryable and terminal statuses, unsafe requests, circuit behavior, and secret non-disclosure;
- [x] validate the selected classifier response through a strict moderation-model-v7 parser;
- [x] map validated classifier categories into existing internal signals without changing deterministic domain policy;
- [x] compose the classifier request/parser through trusted endpoint construction, service-correct signing, exactly one shared transport attempt, bounded circuit containment, and the existing provider-result mapping;
- [x] validate and map the selected OCR provider through its own strict versioned parser;
- [x] retain bounded classifier provider/model/latency output while preserving runner-owned parser, policy, attempt, and aggregate-latency metadata without raw responses;
- [x] retain equivalent bounded OCR provider/model/parser metadata without raw responses or OCR plaintext;
- [x] complete classifier conformance for unknown category, duplicate result, malformed JSON, retryable/terminal HTTP outcomes, timeout, circuit-open state, runner-owned retries, model drift, and secret non-disclosure;
- [x] complete equivalent OCR adapter conformance, including OCR-plaintext non-disclosure, while preserving existing worker stale-result behavior.

Provider-specific adapters:

- [x] select and document Amazon Rekognition `DetectModerationLabels` as the classifier provider API contract;
- [x] implement the selected classifier request builder and strict response parser;
- [x] add a trusted region-derived Rekognition endpoint and service-correct SigV4 signing;
- [x] integrate the classifier through one shared provider HTTP transport attempt and bounded circuit containment while preserving runner-owned retries;
- [x] select and document Amazon Rekognition `DetectText` as the OCR provider API contract;
- [x] implement the selected OCR request builder, strict response parser, approved-operation signing, and one-attempt runtime adapter;
- [x] compose selected adapters only in the backend application root through a shared bounded transport and independent circuit instances;
- [x] update production source-support validation only for the complete selected adapters, with incomplete or unsafe enabled configuration rejected;
- [x] define credentials only as backend runtime environment inputs; no credential values are committed or exposed through summaries, capabilities, readiness, or logs;
- [x] keep safe defaults and product flags disabled; credentials/configuration alone do not enable managed-media capabilities, and staging activation remains external.

No API key or real provider call was required for P3 source implementation. Both adapters, strict configuration, composition-root factories, production source support, and privacy-safe readiness are complete; provider-account access, real-call evidence, staging calibration, and product activation remain external gates.

No credential, provider account, network call, deployment, worker activation, public upload activation, or production environment change was performed.

P3 activation boundary:

- no credential values, provider accounts, real calls, deployment, worker activation, public uploads, or production environment changes were performed;
- complete settings may make the source runtime configured and ready, but do not prove account access, quotas, latency, or moderation quality;
- managed-media product flags remain disabled unless explicitly enabled later;
- P4 aggregate calibration evidence and authorized staging validation are required before any production activation decision.

## Phase P4 — moderation calibration harness

Status: autonomous source preparation is complete and merged. Representative authorized execution and calibration evidence remain external.

Merged evidence:

- backend PR #107 exact green head: `ce50efbd088200c572116b62bf627dc25e026b11`;
- backend PR #107 merge: `db5ee5ab50c760619dfa254618b5f2de64f2e044`;
- backend PR #108 exact green head: `e13d8f53e9eefad9e9f9ea6513b986a40a9e2760`;
- backend PR #108 merge: `a0f97680189b6daa05a2b5fc22a469d687df23c9`;
- backend PR #109 exact green head: `d3b6a1599352a79a4dd2bb8d361148d605de3ec3`;
- backend PR #109 merge: `c8d315113881e81f7b6c8522bfb5b439b4b36972`;
- all three exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

- [x] add the strict versioned manifest and provider-injected calibration core;
- [x] add an internal CLI with strict bounded arguments and deterministic aggregate process states/exit codes;
- [x] enforce canonical local corpus containment, bounded manifest/JPEG validation, symlink/path-escape rejection, and safe configured-provider composition;
- [x] report only bounded aggregate category, decision, mismatch, false-positive/false-negative, undetermined, and failure counts;
- [x] exclude case IDs, roots/paths, media bytes/hashes, OCR plaintext, signed URLs, credentials, identity, provider payloads/messages/identifiers, endpoints, free text, and exception details from reports, process output, and operator evidence;
- [x] support deterministic aggregate-only JSON/CSV output with explicit paths, exclusive no-overwrite mode `0600`, synchronization, and rollback after partial failure;
- [x] preserve provider-runner attempt/timeout ownership and bounded interruption before the next case;
- [x] add deterministic filesystem, CLI, text-policy, output, composition, interruption, redaction, and no-network coverage;
- [x] add an operator-facing non-production runbook covering exact invocation, fail-closed preflight, corpus authorization/provenance/access/retention/deletion, aggregate review ownership, threshold-decision boundaries, private evidence, cleanup verification, and accidental-media incident response;
- [ ] run the harness against a representative authorized non-production corpus with explicit approval, real provider access, reviewed aggregate evidence, and documented deletion verification;
- [ ] complete provider-account, quota, latency, moderation-quality, threshold/policy, and activation review before any production claim or enablement.

No corpus, real media, credential values, provider account, real provider call, threshold/policy change, route, database schema, deployment, worker scheduling, environment activation, product enablement, public upload, OTA, native build, or calibration claim was added or performed during autonomous source work.

## Phase P5 — password-reset product and delivery readiness

Status: source-complete. Backend token/session behavior, selected Resend contract/runtime/configuration/composition/readiness, localized mobile forgot/reset flow, and production app/universal-link source preparation are merged. Provider accounts, credentials, domains, association files, deployment, real delivery, native builds, physical-device validation, and activation remain external.

Merged evidence:

- backend PR #60 exact head: `af192c4fbe48c82f1d8e3ac5c7f020c294e9fe72f`;
- backend PR #60 merge: `5aa7fa35b0d3e89fe1e824266fd659d1296a61a3`;
- mobile PR #200 exact head: `5ff6cdb50fe04e35d7294d241f37ea46924c06c2`;
- mobile PR #200 merge: `1b77802bb765a1a3db6b8dcd1f081c210049a2d0`;
- backend PR #110 exact green head: `54fe3bcf57745caddb1177ef6c75453befed407f`;
- backend PR #110 merge: `2c683c95274409aa5958033e96cb8acf67ca8b56`;
- backend PR #111 exact green head: `1f0d08ff6eccec676c94bd231e974ad98cdd5176`;
- backend PR #111 merge: `ecd8a2e425b032be323b9852ba9e60221a1ca968`;
- backend PR #112 exact green head: `ef779e42f6d28f4c8c103a4a2961d1ee8c26b436`;
- backend PR #112 merge: `44604b216bef723680fdd12f3a5d9d100bb70e3b`;
- mobile PR #383 exact green head: `4e596dd3f6abd44284e0baf8509f19296c24178b`;
- mobile PR #383 merge: `ef048d41f47487fe079afb1b5ac4b49edea36d76`;
- the exact backend heads passed full Backend CI;
- the exact mobile PR #383 head passed repository and changed-file line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.

Mobile:

- [x] add localized capability-gated `Forgot password` and `Reset password` source routes with strict API states;
- [x] preserve the generic accepted response so account existence is not disclosed;
- [x] retain strict password validation, invalid/expired-token handling, success state, session cleanup, and forced return to sign-in;
- [x] complete fail-closed production app/universal-link source configuration for the exact HTTPS reset route;
- [x] reject broad hosts/paths/schemes and duplicate, malformed, padded, short, or long token parameters before reset submission;
- [x] remove rejected or completed token material from navigation state and keep tokens out of ordinary persisted state, logs, diagnostics, analytics, and user-visible copy;
- [x] retain source-level accessibility labels, localized copy, strict request/response parser coverage, and deterministic link/token configuration tests;
- [ ] perform authorized native-build and physical-device deep-link validation after domain association and environment configuration exist.

Backend delivery:

- [x] preserve hashed one-time tokens, cooldown, expiry, replay rejection, undelivered-token invalidation, password replacement, and all-session revocation;
- [x] select and document Resend `POST /emails` as the concrete provider API contract;
- [x] add bounded EN/RU plain-text and HTML template source with expiry and security guidance;
- [x] construct links only from an exact trusted HTTPS application reset-route base;
- [x] add fixed bounded request construction, non-token idempotency identity, strict success parsing, and contract-level redaction tests;
- [x] add the production-shaped Resend runtime through the shared bounded provider HTTP transport;
- [x] add explicit bounded retry ownership and terminal/transient provider failure mapping;
- [x] compose the complete adapter in the backend application root behind the explicit `resend` selector;
- [x] update production validation and password-reset configured/ready state only for complete safe composition;
- [x] preserve token invalidation when final delivery fails;
- [x] retain password-reset capability gating in the backend contract and pre-auth mobile navigation.

P5 source completion does not constitute operational readiness. External activation requires:

- a Resend account, API key, verified sender identity/domain, and approved secret-store configuration;
- one owned HTTPS link domain configured identically in backend and mobile build environments;
- deployed Apple App Site Association and Android Digital Asset Links files scoped to `/auth/reset-password`;
- backend migration execution and deployment in an explicitly targeted non-production environment;
- a new native build carrying the associated-domain entitlement and verified intent filter;
- real non-production delivery, expiry, replay, invalidation, reauthentication, cold-start, warm-navigation, and physical-device evidence;
- explicit password-reset capability enablement only after those gates pass.

No provider account, credential, sender/domain, DNS, association-file deployment, real email, backend deployment, migration execution outside CI, OTA/EAS publication, native build/install, device validation, or activation was performed during source preparation.

## Phase P6 — deployment configuration, policies, and runbooks

Status: active. Environment templates, the staging/production configuration matrix, and provider-neutral storage/CDN policy templates are source-complete. Sender-domain and link-domain infrastructure documentation is next.

Merged evidence:

- backend PR #113 exact green head: `3e366e803f91d4d563d0b1e70cc189381534cd18`;
- backend PR #113 merge: `bad69c42325e7156215e7fdba45962ade3372ef1`;
- backend PR #114 exact green head: `9e9408ec87a6c6fc0786cd66c8272b502dbb5790`;
- backend PR #114 merge: `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`;
- both exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

- [x] expand `.env.example` without adding secrets;
- [x] document staging and production configuration matrices and required secret names;
- [x] prepare private bucket, public-delivery bucket or namespace, CORS, lifecycle, encryption, public-access, and CDN-origin policy templates;
- [ ] document sender-domain DNS, link-domain association, and provider callback requirements where applicable;
- [ ] define migration order, backend rollout order, worker startup order, capability enablement order, and rollback order;
- [ ] add smoke scripts for configuration validation, signed upload, processing, delivery, deletion, password reset, and capability status using non-production fixtures;
- [ ] document key rotation, provider outage, emergency media disable, cleanup pause, legal hold, and rollback procedures;
- [ ] keep all commands non-destructive by default and require explicit environment targeting.

Completed storage and immutable-delivery policy boundary:

- separate private quarantine/moderation-master and immutable public-delivery resources or enforceable namespaces;
- blocked anonymous origin access with HTTPS, encryption at rest, least-privilege identities, exact CORS origins, and CDN-mediated public reads;
- exact adapter-aligned prefixes, metadata, bounded sizes, conditional no-overwrite writes, SHA-256 content addressing, immutable JPEG caching, and read-only CDN methods;
- application-owned deletion, retention, appeals, and legal holds; no independent age-based expiry; placeholder-only staging/production translation with deterministic secret-free coverage.

Next bounded slice — sender and link-domain infrastructure documentation:

- document placeholder-only sender-domain DNS ownership, verification, rotation, and rollback requirements;
- document AASA and `assetlinks.json` hosting, path scope, application identifiers, signing fingerprints, caching, and environment separation;
- document only required provider callbacks, disabled by default; domain/DNS changes, verification, association deployment, real email, native builds, and device validation remain external.

## Phase P7 — explicit sync conflict-choice contract

Backend first:

- [ ] define ownership-safe, revisioned, idempotent conflict-resolution operations;
- [ ] support `keep_local` and `keep_server` only with exact expected conflict and entity revisions;
- [ ] permit `merge` only for domains with an explicitly documented deterministic merge contract;
- [ ] reject stale, already resolved, foreign, malformed, or incompatible choices;
- [ ] persist immutable bounded resolution audit without raw entity payloads;
- [ ] define rollback or compensating behavior before destructive resolution is exposed.

Mobile second:

- [ ] add conflict detail and choice UI only after the backend contract is merged;
- [ ] show bounded domain, timestamps, and consequences without raw local or server payload values;
- [ ] require explicit confirmation for destructive choices;
- [ ] preserve offline retry and exact idempotency identity.

Do not implement client-only overwrite or merge behavior.

## Phase P8 — diagnostics, release gate, and Android source preparation

Diagnostics:

- [ ] complete privacy-safe auth-refresh and API failure categories;
- [ ] add aggregate provider readiness, worker, retry, and cleanup status without secrets or user content;
- [ ] add bounded user-facing recovery copy only where an actionable recovery exists.

Release gate:

- [ ] define a cross-repository compatibility manifest containing exact mobile and backend SHAs plus contract versions;
- [ ] make the gate fail closed on mismatched SHAs or incompatible contract versions;
- [ ] document minimum repository-token scope and secret setup;
- [ ] keep actual token configuration and release-gate execution outside autonomous source work.

Android source preparation:

- [ ] audit permissions, image-picker configuration, app links, network security, environment injection, release profiles, native modules, and build-time validation;
- [ ] verify source configuration through Expo export and Expo Doctor;
- [ ] do not claim Android runtime completion without an authorized native build and physical-device test.

## Phase P9 — privacy, legal, and analytics prerequisites

- [ ] produce a technical data inventory for media, moderation, appeals, evidence, retention, legal holds, email delivery, and provider subprocessors;
- [ ] document current deletion and retention behavior as implemented rather than aspirational behavior;
- [ ] prepare engineering drafts for Privacy Policy, Terms of Service, Community Guidelines additions, acceptable-use rules, and appeal wording;
- [ ] mark third-party provider names and final jurisdictions as placeholders until provider selection and legal review;
- [ ] define analytics consent, identity separation, event taxonomy, retention, deletion, and account-cleanup requirements before adding an analytics SDK;
- [ ] preserve the prohibition on health values, body values, calories, macros, limitations, exercise values, food names, email, tokens, revealing IDs, and free text in analytics.

Engineering drafts do not constitute legal approval.

## Execution order

1. P6 deployment policies, configuration templates, smoke scripts, and runbooks.
2. P7 explicit sync conflict-choice contract.
3. P8 diagnostics, fixed-SHA release gate, and Android source preparation.
4. P9 technical privacy, legal, and analytics prerequisites.

A phase may be divided into bounded backend, mobile, and docs pull requests. After each backend slice, synchronize the canonical mobile roadmap documents.

## Source-preparation definition of done

The source-preparation program is complete when:

- production provider adapters and factories exist behind strict configuration;
- CI uses deterministic providers and provider conformance tests without real credentials;
- production refuses incomplete enabled configuration;
- capabilities prevent mobile exposure of unavailable operations;
- worker entrypoints, service templates, smoke scripts, and runbooks exist but are not activated;
- password reset is source-complete on backend and mobile, including deep links and templates;
- calibration tooling exists without claiming real calibration;
- destructive sync conflict choices are backend-owned and auditable before mobile exposure;
- release and privacy diagnostics remain content-free and secret-free;
- Android and cross-repository release source configuration is prepared;
- all exact heads pass blocking CI and are merged.

## Work that remains external after source completion

- confirm operational use of the selected classifier contract and select final OCR, storage, CDN, and email providers where not already chosen;
- create accounts, buckets, domains, CDN distributions, sender identities, and DNS records;
- add credentials and repository tokens;
- execute migrations and deploy backend changes;
- start and schedule workers;
- run authorized staging integration and moderation calibration;
- perform iOS and Android native builds and physical-device matrices;
- rehearse rollout and rollback;
- obtain legal approval;
- explicitly enable capabilities, media uploads, and public release.

## Prohibited activation boundary

Do not perform or claim any of the following without a direct request:

- credential or secret changes;
- real provider calls or account configuration;
- backend deployment or migration execution outside CI;
- worker scheduling in an environment;
- staging or production activation;
- OTA/EAS publish;
- native build or device installation;
- public media upload enablement;
- production password-reset email activation.
