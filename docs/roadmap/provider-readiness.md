# Provider and Release Readiness Roadmap

Updated: 2026-08-02

## Objective

Prepare the mobile application and backend so later activation is limited to provider selection, credentials, infrastructure creation, deployment, staging validation, native builds, and feature-flag changes.

This is an approved autonomous source program. It does not authorize connecting real providers, changing credentials, deploying backend changes, running migrations outside CI, publishing OTA updates, creating or installing native builds, or enabling public media uploads.

## Verified starting baseline

Before this documentation synchronization slice:

- mobile `main`: `c969c7b76a3a331953510181e68f97e1a505eade`;
- backend `main`: `1eefe77d7260721fc7f3b5a2c0f85e6a962583c8`;
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

Status: active next phase.

- [ ] add bounded one-shot CLI entrypoints for media moderation, derivative delivery, retention cleanup, expired-upload recovery, and retryable failed operations;
- [ ] add optional continuous worker mode without changing the underlying claim and lease contracts;
- [ ] support graceful shutdown, abort signals, bounded concurrency, lease heartbeat where required, retry backoff, maximum attempts, and deterministic exit codes;
- [ ] preserve oldest-due claims, stale-worker recovery, exact state-version revalidation, legal-hold blocking, and dependency-ordered tombstone purge;
- [ ] expose privacy-safe worker readiness and aggregate operation status without asset owner IDs, object keys, OCR text, or media bytes;
- [ ] add systemd unit and timer templates plus Docker Compose service templates;
- [ ] document process ordering, crash recovery, duplicate process behavior, and emergency disable procedures;
- [ ] do not start or schedule these workers in any environment during source implementation.

## Phase P3 — classifier, OCR, and provider transport readiness

Provider-neutral runtime:

- [ ] add a bounded backend HTTP transport for provider adapters with abortable timeouts, response-size limits, retry classification, rate-limit handling, and redacted errors;
- [ ] add circuit-breaking or equivalent bounded failure containment without hiding persistent configuration failures;
- [ ] validate every external response through strict versioned parsers;
- [ ] map provider categories into the existing internal classifier and OCR signals rather than changing domain policy per provider;
- [ ] retain parser, provider, model, policy, and attempt version metadata without raw responses or OCR plaintext;
- [ ] add a reusable provider conformance suite for timeout, malformed response, unknown category, duplicate result, cancellation, retryable failure, non-retryable failure, and stale-worker behavior.

Provider-specific adapters:

- [ ] implement the selected classifier adapter after the provider API is chosen;
- [ ] implement the selected OCR adapter after the provider API is chosen;
- [ ] keep credentials supplied only by backend environment variables or the deployment secret store;
- [ ] keep adapters disabled until explicit staging configuration.

No API key is required to implement adapters and parsers against documented request and response contracts. Provider selection is required before final provider-specific parsing can be completed.

## Phase P4 — moderation calibration harness

- [ ] add an internal CLI that reads a local manifest of representative test images and expected outcomes;
- [ ] run selected classifier and OCR adapters through the existing deterministic fitness-aware policy;
- [ ] report aggregate allow, review, reject, false-positive, false-negative, timeout, malformed, and unavailable counts;
- [ ] group results by bounded categories such as ordinary gym photos, sportswear, bodybuilding stages, progress photos, possible minors, sexual context, violence, text overlays, prohibited content, and ambiguous cases;
- [ ] exclude raw images, OCR plaintext, signed URLs, credentials, owner identity, and provider payloads from reports;
- [ ] support JSON and CSV aggregate output suitable for threshold review;
- [ ] document corpus handling, access, retention, and deletion requirements;
- [ ] do not claim calibration until the harness is run against a representative authorized staging corpus.

## Phase P5 — password-reset product and delivery readiness

Mobile:

- [ ] complete the localized `Forgot password` and `Reset password` release boundary against an operational delivery provider;
- [ ] preserve the generic accepted response so account existence is not disclosed;
- [ ] retain strict password validation, invalid or expired token handling, success state, and forced return to sign-in;
- [ ] complete validated app-link or universal-link configuration for reset tokens;
- [ ] keep reset tokens out of ordinary persisted application state, logs, analytics, and navigation history after completion;
- [ ] complete accessibility and strict API parser coverage for the activated flow.

Backend delivery:

- [ ] add a production password-reset delivery adapter for the selected mail provider or an approved generic transport;
- [ ] add plain-text and HTML templates with expiry and security guidance in English and Russian;
- [ ] construct links only from a configured trusted application-link base URL;
- [ ] preserve token invalidation when delivery fails;
- [ ] add timeout, provider rejection, malformed response, duplicate request, cooldown, replay, expiry, and redacted-log tests;
- [x] add password-reset capability gating to the backend contract so the mobile flow can appear only when delivery is operationally ready;
- [x] gate pre-auth mobile navigation and direct reset requests through the strict capability response.

External activation later requires a verified sender domain, DNS records, provider credentials, backend deployment, deep-link domain configuration, and physical-device validation.

## Phase P6 — deployment configuration, policies, and runbooks

- [ ] expand `.env.example` without adding secrets;
- [ ] document staging and production configuration matrices and required secret names;
- [ ] prepare private bucket, public-delivery bucket or namespace, CORS, lifecycle, encryption, public-access, and CDN-origin policy templates;
- [ ] document sender-domain DNS, link-domain association, and provider callback requirements where applicable;
- [ ] define migration order, backend rollout order, worker startup order, capability enablement order, and rollback order;
- [ ] add smoke scripts for configuration validation, signed upload, processing, delivery, deletion, password reset, and capability status using non-production fixtures;
- [ ] document key rotation, provider outage, emergency media disable, cleanup pause, legal hold, and rollback procedures;
- [ ] keep all commands non-destructive by default and require explicit environment targeting.

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

1. P2 production worker entrypoints and orchestration.
2. P3 provider transport plus selected classifier and OCR adapters.
3. P4 moderation calibration harness.
4. P5 password-reset mobile, deep-link, template, and delivery readiness.
5. P6 deployment policies, configuration templates, smoke scripts, and runbooks.
6. P7 explicit sync conflict-choice contract.
7. P8 diagnostics, fixed-SHA release gate, and Android source preparation.
8. P9 technical privacy, legal, and analytics prerequisites.

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

- select final classifier, OCR, storage, CDN, and email providers where not already chosen;
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
