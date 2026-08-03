# Provider and Release Readiness Roadmap

Updated: 2026-08-03

This document tracks provider, staging, deployment, diagnostics, native-release, privacy, and analytics readiness after the core application source program. `docs/implementation-plan.md` remains the canonical phase-order document.

## Current baseline

- mobile `main` before this documentation slice: `1ff31e0ca92a7b94808eef36694a756e9fb24473`;
- backend `main`: `4af6db678ef7d7457ab5221157524363605635ba`;
- backend provider-readiness source is complete through PR #127;
- mobile managed-media composition is complete through PR #400;
- all public provider-backed capabilities remain disabled;
- no real provider or staging evidence has been collected by autonomous source work;
- no provider account, credential, storage, CDN, DNS, sender domain, deployment, worker schedule, native build, device installation, OTA/EAS publication, or production activation has been performed.

## Capability readiness model

Every provider-backed capability must retain separate states:

1. **source supported** — application contracts and implementation exist;
2. **configured** — required environment fields and provider selection are present;
3. **ready** — configuration has passed strict local/runtime validation;
4. **enabled** — product behavior may expose the capability;
5. **evidenced** — authorized non-production evidence exists for the exact deployed SHA and configuration;
6. **production approved** — named owners accepted rollout, observation, rollback, privacy, and operational obligations.

`configured` or `ready` must never imply `enabled`. Source completion must never imply provider quality, quota, deliverability, legal compliance, or production approval.

## Source-complete provider areas

### Private object storage

Implemented:

- S3-compatible provider selection and strict environment parsing;
- private quarantine object operations;
- conditional writes, exact deletion, checksums, metadata, prefixes, pagination, and cleanup;
- bounded signed upload transport;
- public capability separation from internal pre-enablement execution;
- privacy-safe readiness summaries.

External requirements:

- owned non-production and production accounts/buckets;
- credentials and rotation ownership;
- encryption, lifecycle, CORS, public-access, logging, quota, and incident settings applied to actual infrastructure;
- authorized evidence for upload, read, delete, replay, expiry, and cleanup.

### Immutable media delivery

Implemented:

- owner-opaque content-hashed variant keys;
- immutable conditional writes and exact deletion;
- delivery descriptors and strict mobile parsing;
- derivative delivery/recovery worker source boundaries;
- CDN-origin policy templates.

External requirements:

- owned CDN/distribution and origin configuration;
- cache and invalidation policy;
- trusted public hostname and TLS;
- authorized derivative, replay, recovery, observation, and deletion evidence.

### Media classifier and OCR

Implemented:

- provider-neutral contracts;
- Amazon Rekognition adapters;
- bounded requests, retries, timeouts, parsing, redaction, and conformance tests;
- configured/ready/disabled runtime summaries;
- moderation-worker composition.

External requirements:

- credentials, region, quota, budget, and incident ownership;
- representative approved non-production corpus;
- aggregate-only calibration and reviewer sign-off;
- evidence for timeout, retryable failure, invalid response, threshold behavior, and provider outage.

### Content moderation

Implemented:

- deterministic policy and versioned outcomes;
- provider-neutral text moderation;
- idempotent persistence and stale-result handling;
- classifier/OCR/text composition in the media worker;
- review-required, rejected, unavailable, timeout, retryable-failure, and invalid-result paths.

External requirements:

- policy owner, reviewer owner, escalation path, appeal operations, retention, and incident response;
- provider configuration where selected;
- authorized calibration and end-to-end evidence.

### Password-reset delivery

Implemented:

- hashed one-time tokens, expiry, cooldown, replay rejection, delivery-failure invalidation, password replacement, and all-session revocation;
- generic accepted responses;
- bounded EN/RU Resend templates;
- trusted HTTPS reset route;
- capability-gated mobile forgot/reset flows;
- iOS associated-domain and Android app-link source configuration;
- placeholder-only AASA and Digital Asset Links templates.

External requirements:

- Resend account and credential;
- verified sender domain and DNS records;
- owned reset-link domain with deployed association files;
- deployed backend and matching native builds;
- deliverability, replay, expiry, revocation, link-routing, physical-device, and rollback evidence;
- explicit enablement.

## Completed P6 source evidence chain

### General deployment and policy contracts

- backend PR #113 — environment templates and environment matrix;
- backend PR #114 — storage, delivery, CORS, lifecycle, encryption, public-access, and CDN-origin policy templates;
- backend PR #116 — sender DNS classes, AASA, Digital Asset Links, reset route, and send-only callback boundary;
- backend PR #117 — rollout, worker ordering, staged enablement, rollback, repeated confirmation, and evidence contracts.

### Fail-closed staging execution foundations

- backend PR #118 — strict staging runner, exact backend SHA confirmation, synthetic-only mutations, disabled-capability verification, and aggregate evidence;
- backend PR #119 — secret-safe synthetic auth/session scenario with account cleanup and revoked-session verification;
- backend PR #120 — pre-enablement private-quarantine managed-media lifecycle;
- backend PR #121 — one-owner internal operational adapter and bounded signed upload transport;
- backend PR #122 — managed-media staging composition core;
- backend PR #123 — callback-form synthetic auth/session lease;
- backend PR #124 — confirmation-first redacted managed-media CLI and production-shaped runtime binding;
- backend PR #125 — callback-form replay-verified private-quarantine lease;
- backend PR #126 — exact-owner moderation processing/replay core and refreshed deletion CAS;
- backend PR #127 — configured-ready moderation runtime plus exact-owner processing/readback adapter.

Exact latest backend evidence:

- PR #127 green head: `51915512a05d8aa2bc7f81cfac33867145454d7f`;
- PR #127 merge: `4af6db678ef7d7457ab5221157524363605635ba`;
- Backend CI run #928: passed lint, formatting, TypeScript build, production configuration validation, migrations/idempotency, migrated-schema integration, PostgreSQL Social integration, complete Vitest, and production startup/health.

### Mobile managed-media composition

- mobile PR #396 — composition analysis and domain/reuse boundary;
- mobile PR #397 — shared upload composition for workout-post media;
- mobile PR #398 — shared upload composition for managed avatars;
- mobile PR #399 — shared bounded polling;
- mobile PR #400 — residual duplication audit and stop conditions.

No further generic mobile media abstraction is approved without a concrete third consumer or demonstrated defect.

## Active P6 source slice

### Configured moderation composition

Compose the existing pieces without introducing a second lifecycle or provider path:

```text
strict plan + exact confirmation
→ released capability-disabled verification
→ synthetic auth/session lease
→ configured-ready moderation runtime
→ replay-verified private-quarantine lease
→ exact-owner moderation processing and replay
→ exact-owner readback
→ refreshed-CAS mandatory deletion and replay
→ account cleanup and revoked-session verification
→ fixed aggregate evidence
→ resource close
```

Acceptance criteria:

- no external file, credential, fixture, provider, database, or network access before exact confirmation;
- synthetic owner derived only inside the auth lease;
- storage, classifier, and OCR required configured and ready while public capabilities remain disabled;
- only the leased asset ID may be processed;
- no `processReadyBatch` or unscoped repository selection;
- existing strict DTOs and state invariants reused;
- processing replay remains idempotent;
- cleanup runs after callback failure where existing leases require it;
- database/provider resources close on every construction/execution path;
- evidence contains only fixed phase outcomes and counts;
- deterministic offline tests cover success, capability regression, runtime unready, owner drift, processing failure, cleanup failure, callback failure, and resource cleanup;
- no real staging/provider execution in CI.

## Remaining P6 source backlog

### 1. Exact-owner moderation recovery

Add a repository/service operation that can recover one known synthetic-owned expired processing lease. Do not invoke global `recoverExpiredProcessing` where unrelated rows may be selected.

Evidence must cover:

- exact owner/asset binding;
- expired lease validation;
- compare-and-set/state-version behavior;
- retry/terminal transition;
- idempotent replay;
- owner readback;
- mandatory cleanup;
- fixed aggregate output.

### 2. Derivative delivery and recovery

Add exact-owner processing and expired-delivery recovery boundaries before composition.

Evidence must cover:

- approved moderation prerequisite;
- immutable derivative creation;
- descriptor publication only after successful immutable write;
- replay without duplicate public objects;
- recovery after expired claim;
- deletion/cleanup behavior;
- public capabilities remaining disabled until explicit enablement.

### 3. Immutable delivery observation

Add bounded observation over the exact synthetic asset and trusted hostname:

- expected descriptor shape;
- immutable cache headers where observable;
- content identity/replay invariants;
- no signed/private scope leakage;
- deletion behavior where policy requires it.

### 4. Upload expiry and cleanup evidence

Add synthetic-owned evidence for:

- stale `upload_pending` expiry;
- private object deletion;
- tombstone/state transition;
- idempotent replay;
- cleanup partial failure and bounded retry;
- no unrelated row selection.

### 5. Worker-order composition

Only after exact-owner operations exist, compose the approved recovery-first sequence:

1. upload expiry;
2. cleanup;
3. delivery recovery;
4. moderation recovery;
5. moderation processing;
6. derivative delivery processing.

The source composition must be synthetic-owned and bounded. Actual worker scheduling remains an external deployment action.

### 6. Password-reset staging composition

Compose exact confirmation, synthetic account, capability-disabled verification, send-only callback/provider runtime, token/link handling, password reset, old-session rejection, cleanup, and aggregate evidence.

Do not expose account existence, email, token, URL query, provider response, or raw error in output/evidence.

### 7. Consolidated runbooks

Produce operator-facing runbooks for:

- preflight and owner confirmation;
- evidence paths and retention;
- provider/account/credential prerequisites;
- exact deployed SHA verification;
- capability-disabled pre-enablement checks;
- one-at-a-time enablement;
- observation windows and stop criteria;
- rollback/freeze ordering;
- incident escalation;
- synthetic cleanup verification.

## Real non-production evidence gates

No real staging/provider action may begin until all applicable fields are known and explicitly authorized:

- target environment and trusted hostnames;
- exact backend and mobile SHAs;
- provider account/project identifiers;
- credential delivery and rotation owner;
- storage/CDN/sender/link domains;
- deployment owner and worker-schedule owner;
- approved synthetic fixtures/corpus;
- budget/quota limits;
- observation window;
- rollback owner and stop criteria;
- privacy/security/reviewer approval where applicable;
- evidence destination and retention period.

Execution must stop if confirmation, target, SHA, capability state, provider readiness, synthetic ownership, cleanup, evidence write, or rollback prerequisites differ from the approved plan.

## Rollout order

1. approve exact plan, owners, targets, and SHAs;
2. validate environment and provider configuration without enabling capabilities;
3. apply approved migrations;
4. deploy backend with all provider-backed capabilities disabled;
5. validate worker readiness without scheduling production work;
6. execute bounded synthetic pre-enablement evidence;
7. resolve every failure and re-run on the exact candidate SHA;
8. enable one capability only after explicit approval;
9. observe the approved window and stop criteria;
10. continue to the next capability only after evidence review.

Password-reset delivery and managed-media uploads require independent approval and observation.

## Rollback and emergency boundaries

Approved rollback order:

1. freeze new changes;
2. disable affected capabilities;
3. stop relevant worker scheduling;
4. preserve state and evidence;
5. roll back only to a schema-compatible backend;
6. rotate/revoke credentials or alter provider infrastructure only under provider-specific incident ownership;
7. verify disabled capabilities and system health.

Prohibited automatic actions:

- down migrations or destructive schema/data rollback;
- deletion of audit, moderation, appeal, legal-hold, or incident evidence;
- clearing claims/state tokens to force retries;
- broad credential revocation without provider/incident-owner approval;
- production data use for smoke tests;
- global worker/recovery selection for synthetic evidence;
- native build, OTA/EAS publication, store submission, or production activation.

## P7–P9 release prerequisites

### P7 — Explicit sync conflicts

Backend contract first, then mobile UI. Requires authorization, idempotency, revision semantics, stale-choice handling, tombstone behavior, concurrent-update tests, strict mobile parsing, and restart-safe presentation.

### P8 — Diagnostics and fixed-SHA release gates

Requires privacy-safe diagnostics, exact artifact provenance, backend/mobile SHA matching, Android package/link audit, and rollback verification. Native builds and distribution remain external.

### P9 — Privacy, legal, consent, retention, and analytics

Requires data inventory, purpose mapping, consent/withdrawal where applicable, retention/deletion/legal-hold alignment, analytics minimization, user-facing privacy/account-deletion requirements, and legal/policy review. Source completion alone is not a compliance determination.

## Validation standard

Every source-only readiness PR must:

- start from current exact `main`;
- preserve existing public contracts unless the slice explicitly changes them;
- use injected deterministic dependencies and make no real provider/staging call in CI;
- cover failure, replay, cleanup, redaction, and resource-close paths;
- keep hand-written files within repository line limits;
- pass complete repository CI on the exact final head;
- have no unresolved review threads;
- merge only the exact green head;
- update this roadmap when phase status or the active ordered backlog changes.
