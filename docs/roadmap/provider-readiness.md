# Provider and Release Readiness Roadmap

Updated: 2026-08-03

## Purpose

Prepare Smart Fitness provider integrations and release operations so later activation is limited to explicitly authorized accounts, credentials, infrastructure, deployment, staging evidence, native builds, and capability enablement.

This roadmap covers source preparation only. It does not authorize or claim provider-account creation, secrets, DNS, infrastructure changes, deployment, migrations outside CI, worker scheduling, real provider calls, native builds, device validation, capability activation, or public release.

## Program invariants

- Mobile remains provider-neutral and calls only the Smart Fitness backend.
- Provider credentials alone never enable product behavior.
- Production fails closed when an enabled capability has incomplete or unsafe configuration.
- In-memory and unavailable providers remain test/development fallbacks.
- Product enablement, provider configuration, and worker scheduling are separate actions.
- Exact staging or production targeting is required at every mutating boundary.
- Migrations precede the new backend; backend health precedes worker startup; workers and smoke evidence precede managed-media enablement.
- Disable capabilities before worker shutdown or backend code rollback.
- Code rollback requires current-schema compatibility; otherwise use a forward fix.
- Automatic down migration, destructive rollback, data deletion, legal-hold removal, audit deletion, and claim/state-token clearing are prohibited as generic rollback actions.
- Evidence is bounded, aggregate, privacy-safe, and free of credentials, tokens, email, signed URLs, object keys, OCR text, media bytes, raw identifiers, and provider payloads.
- Every new hand-written source or architecture file remains at or below 500 physical lines.
- Every merged slice requires complete blocking CI, review-thread inspection, and exact-green-head merge.

## Phase P0 — provider configuration and capability foundation

Status: source-complete.

Completed:

- [x] provider-neutral selectors for private object storage, immutable media delivery, media classifier, OCR, and password-reset delivery;
- [x] composition-root provider factories;
- [x] explicit configured, ready, and enabled states;
- [x] strict fail-closed production validation;
- [x] privacy-safe authenticated and pre-auth capability contracts;
- [x] strict mobile parser with unsupported-version and inconsistent-state rejection;
- [x] mobile controls blocked until capability readiness is confirmed;
- [x] text-only workout-post publication preserved while image capability is unavailable.

Operational gaps remain external: provider selection where unfinished, accounts, credentials, quotas, deployment, staging evidence, and activation.

## Phase P1 — private storage and immutable delivery

Status: source-complete.

Completed:

- [x] S3-compatible private quarantine storage adapter;
- [x] exact presigned uploads and signed metadata reads;
- [x] bounded private reads and idempotent exact deletion;
- [x] conditional immutable private writes;
- [x] S3-compatible immutable delivery adapter;
- [x] canonical owner-opaque asset prefixes and content-hashed JPEG variants;
- [x] strict SHA-256, MIME, length, metadata, cache-control, no-overwrite, prefix, pagination, cleanup, and replay rules;
- [x] deterministic no-network conformance coverage.

Readiness remains separate from product enablement.

## Phase P2 — worker entrypoints and orchestration

Status: source-complete.

Completed:

- [x] bounded one-shot and continuous worker runtime;
- [x] cleanup worker;
- [x] derivative-delivery process and recovery workers;
- [x] moderation process and recovery workers;
- [x] stale-upload expiry worker;
- [x] privacy-safe readiness manifest and read-only CLI;
- [x] explicit retry ownership and bounded process-manager backoff;
- [x] documented lease budgets and no-heartbeat decision;
- [x] source-prepared systemd and manual Docker Compose templates;
- [x] sentinel-based worker activation boundary;
- [x] graceful stop, crash recovery, duplicate-process, and emergency-disable documentation.

Worker installation, sentinel creation, timer/service enablement, scheduling, and environment startup remain external.

## Phase P3 — classifier and OCR transport

Status: source-complete for the selected contracts.

Completed:

- [x] strict provider-neutral classifier and OCR interfaces;
- [x] bounded shared provider HTTP transport;
- [x] Amazon Rekognition classifier adapter;
- [x] Amazon Rekognition OCR adapter;
- [x] strict request construction, parsing, timeout, retry, and redaction behavior;
- [x] composition-root selection and readiness validation;
- [x] deterministic no-network conformance tests.

Real provider quality, latency, quota, region, and policy evidence remain external.

## Phase P4 — moderation calibration

Status: autonomous source preparation complete.

Completed:

- [x] provider-injected aggregate calibration core;
- [x] bounded CLI and canonical local filesystem contract;
- [x] private no-overwrite reporting;
- [x] fail-closed commit, build, configuration, corpus, and output preflight;
- [x] interruption, retry, and privacy-safe redaction behavior;
- [x] separate corpus-owner, operator, reviewer, policy-owner, deletion-verifier, and incident-owner roles;
- [x] lawful-purpose, provenance, minimization, access, retention, secure-deletion, and accidental-media requirements;
- [x] explicit prohibition on treating synthetic tests as provider-quality evidence.

Remaining external:

- [ ] authorized representative non-production corpus;
- [ ] real provider access and account validation;
- [ ] aggregate quality, latency, quota, and deletion evidence;
- [ ] threshold or policy proposal and review;
- [ ] production activation decision.

## Phase P5 — password-reset product and delivery readiness

Status: source-complete.

Backend and mobile completed:

- [x] generic accepted response that does not disclose account existence;
- [x] hashed one-time tokens, cooldown, expiry, replay rejection, undelivered-token invalidation, password replacement, and all-session revocation;
- [x] selected Resend request contract and bounded EN/RU HTML/plain-text templates;
- [x] exact trusted HTTPS application reset route;
- [x] fixed bounded request construction, non-token idempotency identity, strict success parsing, and provider-message discard;
- [x] bounded runtime retry and failure mapping;
- [x] composition-root selection behind an explicit `resend` provider;
- [x] production configuration and privacy-safe configured/ready state;
- [x] localized capability-gated mobile forgot/reset flows;
- [x] strict deep-link token parsing, navigation-state cleanup, session cleanup, and forced return to sign-in;
- [x] source-prepared iOS associated domain and Android verified app link;
- [x] placeholder-only Resend DKIM/SPF/MX, Apple AASA, and Android Digital Asset Links templates;
- [x] exact `/auth/reset-password` path and `com.dzahard28.smartfitnessapp` application identifier;
- [x] send-only callback boundary with no webhook route, secret, or event persistence.

External operational gates:

- [ ] Resend account, API key, and verified sender;
- [ ] owned HTTPS reset-link domain;
- [ ] deployed AASA and Digital Asset Links files;
- [ ] backend migration/deployment in an explicit non-production environment;
- [ ] matching native mobile build;
- [ ] real non-production delivery, expiry, replay, invalidation, reauthentication, cold-start, and warm-navigation evidence;
- [ ] authorized physical-device validation;
- [ ] explicit password-reset capability enablement.

## Phase P6 — deployment configuration, policies, smoke scripts, and runbooks

Status: active. Configuration, policy, rollout/rollback ordering, the fail-closed runner, and the secret-safe synthetic auth/session scenario are source-complete. Managed-media scenario contracts are next.

### Merged evidence

- backend PR #113 exact green head `3e366e803f91d4d563d0b1e70cc189381534cd18`, merge `bad69c42325e7156215e7fdba45962ade3372ef1`;
- backend PR #114 exact green head `9e9408ec87a6c6fc0786cd66c8272b502dbb5790`, merge `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`;
- backend PR #116 exact green head `12ba41f2176079fbb4fbe13fc07e3016c16f5049`, merge `288425d9e8608c56f814af74274301c3940a371c`;
- backend PR #117 exact green head `ce0555570c7686fd22306d5ac6769c9cafd81e0c`, merge `17cf1f7d4b9345dc0aca463cedc030e1a6b2bad1`;
- backend PR #118 exact green head `b91cd1feef7b3ff494e86ba133ac95037fbea677`, merge `64c04872e0ede26f87dd6017877e15ab218bccc1`;
- backend PR #119 exact green head `2d2ae0aca373ce471ade00c9e721b3c3f2557643`, merge `15c1a939df06d84a38525f1558a2fa7a4ae2754f`;
- all exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

### Checklist

- [x] expand `.env.example` without adding secrets;
- [x] document staging and production configuration matrices and required secret names;
- [x] prepare private bucket, public-delivery namespace, CORS, lifecycle, encryption, public-access, and CDN-origin policy templates;
- [x] document sender-domain DNS, link-domain association, and current send-only callback requirements;
- [x] define migration order, backend rollout order, worker startup order, capability enablement order, verification, disablement, and rollback order;
- [x] add the fail-closed staging smoke-runner foundation with exact target/change/SHA confirmation, strict disabled-capability verification, synthetic mutation boundaries, and privacy-safe evidence;
- [x] add a secret-safe synthetic auth/session scenario with register-conflict replay cleanup, refresh, account deletion, and revoked-session verification;
- [ ] add managed-media signed upload, processing, delivery, deletion, cleanup, replay, and idempotency scenarios using synthetic non-production fixtures;
- [ ] add password-reset delivery, expiry, invalid/replayed token, password replacement, and session-revocation scenarios using approved non-production fixtures;
- [ ] document key rotation, provider outage, emergency media disable, cleanup pause, legal hold, and consolidated rollback procedures;
- [ ] make operational wrappers non-destructive by default and require explicit environment targeting.

### Completed rollout and rollback boundary

Backend PR #117 added a placeholder-only machine-readable template and human-readable runbook covering:

- explicit target environment, change ID, exact mobile/backend SHAs, rollout owner, migration owner, rollback owner, and observer;
- staging rehearsal before a separately approved production rollout;
- preflight and forward-compatible migration approval;
- migrations before backend deployment;
- backend deployment with `SOCIAL_MEDIA_UPLOADS_ENABLED=false` and `PASSWORD_RESET_DELIVERY_ENABLED=false`;
- privacy-safe health and configured/ready/disabled capability verification;
- worker readiness while schedules remain disabled and the sentinel is absent;
- recovery-first worker startup:
  1. upload expiry;
  2. cleanup;
  3. delivery recovery;
  4. moderation recovery;
  5. moderation processing;
  6. derivative delivery processing;
- pre-enablement smoke evidence;
- one capability at a time, using password-reset delivery before managed-media uploads for the selected staged order;
- observation between capabilities;
- rollback by disabling capabilities before worker shutdown and schema-compatible backend code rollback;
- preservation of pending, reviewed, rejected, appealed, failed, held, retention, cleanup, and audit state;
- credential rotation/revocation only after traffic is stopped and evidence is preserved, and only for a confirmed security/provider need;
- prohibition on automatic or destructive down migration, data deletion, legal-hold removal, audit deletion, claim-token clearing, and provider-data destruction as generic rollback.

Deterministic tests lock phase order, worker order, capability gates, rollback order, secret-free placeholders, privacy-safe evidence, and destructive-command exclusions.

### Completed smoke-runner foundation

Backend PR #118 exact green head `b91cd1feef7b3ff494e86ba133ac95037fbea677`, merge `64c04872e0ede26f87dd6017877e15ab218bccc1`, completed:

- [x] explicit `staging` target, trusted HTTPS API hostname, approved synthetic fixture namespace, change ID, exact backend SHA, and separate confirmation;
- [x] production, localhost, IP, HTTP, credential-bearing, mismatched, unsafe-path, excessive-step, and excessive-timeout rejection;
- [x] exactly one strict `GET /v1/capabilities` verification with a 64 KiB response limit and all product capabilities required disabled;
- [x] synthetic namespace enforcement for every mutation;
- [x] sequential stop-on-first-failure execution with no automatic retry;
- [x] bounded privacy-safe JSON evidence and redacted CLI failures;
- [x] deterministic offline CI coverage through injected transports and fixtures;
- [x] explicit documentation that the foundation does not itself prove end-to-end provider flows.

### Completed synthetic auth/session scenario

Backend PR #119 exact green head `2d2ae0aca373ce471ade00c9e721b3c3f2557643`, merge `15c1a939df06d84a38525f1558a2fa7a4ae2754f`, completed:

- [x] exact staging plan confirmation before secret parsing or network access;
- [x] synthetic-fixture-scoped email and device identity;
- [x] released-route register, controlled existing-account login, `/me`, refresh, refreshed `/me`, account deletion, and revoked-session verification;
- [x] strict bounded auth and `/me` response parsing;
- [x] memory-only email, password, access/refresh tokens, and dynamic user/device/session identifiers;
- [x] interrupted-run replay cleanup without treating register conflict as success;
- [x] fixed evidence fields with no secrets, dynamic identifiers, request bodies, response bodies, or raw errors;
- [x] deterministic offline tests included in the canonical `tests/**/*.test.ts` suite;
- [x] explicit documentation that no standalone CLI or real staging execution is included yet.

### Next bounded slice — managed-media staging scenario contracts

Required source behavior:

- [ ] compose generic capability verification and synthetic authentication through one bounded execution/evidence contract;
- [ ] strict memory-only capture of access token, asset ID, state version, signed upload URL/headers, and immutable public descriptor;
- [ ] released `POST /v1/social/media/uploads` creation with exact synthetic idempotency and controlled replay;
- [ ] bounded external signed `PUT` of one approved synthetic JPEG/PNG fixture without redirect or evidence leakage;
- [ ] released upload-completion call and strict owner-asset parsing;
- [ ] bounded polling over documented asset states with no unbounded wait or provider retry;
- [ ] processing/recovery, immutable delivery, exact deletion, stale-upload expiry, cleanup, and replay/idempotency checks;
- [ ] disabled-capability verification before and after applicable pre-enablement execution;
- [ ] privacy-safe evidence containing no token, email, password, asset ID, signed URL, headers, object key, public URL, provider payload, OCR text, or media bytes;
- [ ] deterministic no-network tests through injected API, upload, time, and fixture transports;
- [ ] no invented route, production target, provider account mutation, deployment, worker scheduling, native build, or activation command.

Password-reset scenario composition remains a separate subsequent P6 slice. Actual provider staging execution remains external and requires direct authorization.

### Remaining P6 operational runbooks

- [ ] key rotation by provider and dependency;
- [ ] provider authentication, quota, latency, and regional outage response;
- [ ] emergency managed-media disable;
- [ ] cleanup pause without deleting or losing eligible work;
- [ ] legal-hold preservation and release ownership;
- [ ] partial password-reset outage;
- [ ] partial storage, delivery, classifier, OCR, or worker outage;
- [ ] backend regression with current-schema compatibility review;
- [ ] suspected credential compromise;
- [ ] rehearsed re-enable after a forward fix.

## Phase P7 — explicit sync conflict-choice contract

Status: not started.

Backend first:

- [ ] define ownership-safe, revisioned, idempotent conflict-resolution operations;
- [ ] support `keep_local` and `keep_server` only with exact conflict and entity revisions;
- [ ] permit `merge` only for domains with an explicit deterministic merge contract;
- [ ] reject stale, resolved, foreign, malformed, or incompatible choices;
- [ ] persist immutable bounded resolution audit without raw entity payloads;
- [ ] define compensation and rollback behavior before destructive resolution is exposed.

Mobile second:

- [ ] add conflict detail and choice UI only after the backend contract is merged;
- [ ] show bounded domain, timestamps, and consequences without raw local/server payload values;
- [ ] require explicit confirmation for destructive choices;
- [ ] preserve offline retry and exact idempotency identity.

Do not implement client-only overwrite or merge behavior.

## Phase P8 — diagnostics, fixed-SHA release gate, and Android source preparation

Status: not started.

Diagnostics:

- [ ] complete privacy-safe auth-refresh and API failure categories;
- [ ] add aggregate provider readiness, worker, retry, and cleanup status;
- [ ] add bounded user-facing recovery copy only where an actionable recovery exists.

Release gate:

- [ ] define a cross-repository compatibility manifest containing exact mobile/backend SHAs and contract versions;
- [ ] fail closed on mismatched SHAs or incompatible contract versions;
- [ ] document minimum repository-token scope and secret setup;
- [ ] keep token configuration and gate execution outside autonomous source work.

Android source preparation:

- [ ] audit permissions, image-picker configuration, app links, network security, environment injection, release profiles, native modules, and build-time validation;
- [ ] verify source configuration through Expo export and Expo Doctor;
- [ ] do not claim runtime completion without an authorized native build and physical-device test.

## Phase P9 — privacy, legal, and analytics prerequisites

Status: not started.

- [ ] produce a technical data inventory for media, moderation, appeals, evidence, retention, legal holds, email delivery, and provider subprocessors;
- [ ] document implemented deletion and retention behavior rather than aspirational behavior;
- [ ] prepare engineering drafts for Privacy Policy, Terms, Community Guidelines, acceptable use, and appeals;
- [ ] mark final providers and jurisdictions as placeholders pending selection and legal review;
- [ ] define analytics consent, identity separation, event taxonomy, retention, deletion, and account cleanup before adding an analytics SDK;
- [ ] prohibit health values, body values, calories, macros, limitations, exercise values, food names, email, tokens, revealing IDs, and free text in analytics.

Engineering drafts do not constitute legal approval.

## Source-preparation definition of done

The program is source-complete only when:

- provider adapters and factories exist behind strict configuration;
- CI remains deterministic and does not require real credentials or network access;
- production refuses incomplete enabled configuration;
- capability contracts block unavailable mobile operations;
- worker entrypoints, templates, smoke scripts, and runbooks exist but are not activated;
- password reset is source-complete across backend and mobile;
- destructive sync choices are backend-owned and auditable before mobile exposure;
- release and diagnostics evidence remains privacy-safe;
- Android and fixed-SHA release source preparation is complete;
- both repositories contain exact fully green merged heads.

## External work after source completion

- final provider selection where still open;
- provider accounts, credentials, buckets, namespaces, CDN, sender identities, and DNS;
- migration execution and backend deployment;
- worker installation and scheduling;
- real staging integration and moderation calibration;
- iOS and Android native builds and physical-device matrices;
- rollout and rollback rehearsal;
- legal approval;
- explicit product capability enablement and public release.

## Prohibited activation boundary

Do not perform or claim without a direct request:

- credential or secret changes;
- provider-account or infrastructure changes;
- real provider calls;
- backend deployment or migration execution outside CI;
- worker scheduling or environment activation;
- public media upload enablement;
- production password-reset delivery;
- OTA/EAS publication;
- native build, installation, or device validation;
- production rollout or rollback execution.
