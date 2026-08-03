# Provider and Release Readiness Roadmap

Updated: 2026-08-03

This document tracks provider, staging, deployment, diagnostics, native-release, privacy, and analytics readiness. `docs/implementation-plan.md` remains the canonical phase-order document.

## Current baseline

- mobile `main` before this documentation slice: `de6c8eecdc81fbd6d38b6719f03bd604db5732ee`;
- backend `main`: `2c7a1801b9bf24d6f16fbe2db4c0345bf19cffbb`;
- backend provider-readiness source is complete through PR #131;
- mobile managed-media composition is complete through PR #400;
- all public provider-backed capabilities remain disabled;
- no real provider or staging evidence has been collected by autonomous source work;
- no provider account, credential, storage, CDN, DNS, sender domain, deployment, worker schedule, native build, device installation, OTA/EAS publication, or production activation has been performed.

## Capability readiness model

Every provider-backed capability retains separate states:

1. **source supported** — application contracts and implementation exist;
2. **configured** — required environment fields and provider selection are present;
3. **ready** — configuration passed strict local/runtime validation;
4. **enabled** — product behavior may expose the capability;
5. **evidenced** — authorized non-production evidence exists for the exact deployed SHA/configuration;
6. **production approved** — named owners accepted rollout, observation, rollback, privacy, and operational obligations.

`configured` or `ready` never implies `enabled`. Source completion never implies provider quality, quota, deliverability, legal compliance, or production approval.

## Source-complete provider areas

### Private object storage

Implemented:

- S3-compatible provider selection and strict environment parsing;
- private quarantine object operations;
- conditional writes, exact deletion, checksums, metadata, prefixes, pagination, and cleanup;
- bounded signed upload transport;
- public capability separation from internal pre-enablement execution;
- privacy-safe readiness summaries.

External requirements remain owned non-production/production accounts, credentials, encryption/lifecycle/CORS/public-access/logging/quota settings, incident ownership, and authorized upload/read/delete/replay/expiry/cleanup evidence.

### Immutable media delivery

Implemented:

- owner-opaque content-hashed variant keys;
- immutable conditional writes and exact deletion;
- delivery descriptors and strict mobile parsing;
- derivative delivery/recovery worker source boundaries;
- CDN-origin policy templates.

External requirements remain owned CDN/origin configuration, trusted hostname/TLS, cache/invalidation policy, and authorized derivative/replay/recovery/observation/deletion evidence.

### Media classifier, OCR, and content moderation

Implemented:

- provider-neutral contracts;
- Amazon Rekognition adapters;
- bounded requests, retries, timeouts, parsing, redaction, and conformance tests;
- deterministic moderation policy and versioned outcomes;
- idempotent persistence and stale-result handling;
- classifier/OCR/text composition;
- configured/ready/disabled runtime summaries;
- exact-owner moderation processing, bounded processing-lease preparation, expired-processing recovery, replay, readback, cleanup, and full resource-owning composition.

External requirements remain provider credentials/region/quota/budget/incident ownership, representative approved corpus, aggregate-only calibration, policy/reviewer ownership, escalation/appeal/retention operations, and authorized end-to-end evidence.

### Password-reset delivery

Implemented:

- hashed one-time tokens, expiry, cooldown, replay rejection, delivery-failure invalidation, password replacement, and all-session revocation;
- generic accepted responses;
- bounded EN/RU Resend templates;
- trusted HTTPS reset route;
- capability-gated mobile forgot/reset flows;
- iOS associated-domain and Android app-link source configuration;
- placeholder-only AASA and Digital Asset Links templates.

External requirements remain Resend account/credential, verified sender DNS, owned reset-link domain, deployed backend/native builds, deliverability/replay/expiry/revocation/link-routing/device/rollback evidence, and explicit enablement.

## Completed P6 source evidence chain

### General deployment and policy contracts

- backend PR #113 — environment templates and environment matrix;
- backend PR #114 — storage, delivery, CORS, lifecycle, encryption, public-access, and CDN-origin policy templates;
- backend PR #116 — sender DNS classes, AASA, Digital Asset Links, reset route, and send-only callback boundary;
- backend PR #117 — rollout, worker ordering, staged enablement, rollback, repeated confirmation, and evidence contracts.

### Fail-closed staging and exact-owner managed-media chain

- PR #118 — strict staging runner and exact confirmation;
- PR #119 — synthetic auth/session scenario;
- PR #120 — private-quarantine lifecycle;
- PR #121 — owner-bound internal adapter and bounded signed upload;
- PR #122 — managed-media composition core;
- PR #123 — callback-form auth/session lease;
- PR #124 — redacted CLI and production-shaped runtime binding;
- PR #125 — replay-verified quarantine lease;
- PR #126 — exact-owner moderation processing/replay core;
- PR #127 — configured-ready moderation runtime and owner-bound adapter;
- PR #129 — one resource-owning auth/quarantine/moderation composition;
- PR #130 — exact-owner expired-processing recovery service/runtime/evidence;
- PR #131 — exact-owner monotonic bounded processing claim, expiry wait, recovery composition, mandatory asset/account cleanup, and configured resource close.

Latest exact backend evidence:

- PR #131 green head: `82674b3e4e2d4d74d38446f7f6af65cb5156b42b`;
- PR #131 merge: `2c7a1801b9bf24d6f16fbe2db4c0345bf19cffbb`;
- Backend CI run #957: lint, formatting, TypeScript build, production configuration validation, migrations/idempotency, migrated-schema integration, PostgreSQL Social integration, complete Vitest, and production startup/health passed.

### Mobile managed-media composition

Mobile PRs #396–#400 established composition boundaries, shared upload/polling, and the stop condition against speculative generic abstractions. No further generic mobile media abstraction is approved without a concrete third consumer or demonstrated defect.

## Active P6 source slice

### Derivative-delivery processing and exact-owner expired-delivery recovery

Inspect and extend the existing delivery worker/repository boundaries without introducing a second lifecycle:

```text
approved exact-owner moderated asset
→ owner/asset-scoped derivative delivery claim
→ normalized private source read
→ deterministic derivative generation
→ owner-opaque content-hashed immutable write
→ exact delivery descriptor publication
→ owner readback + idempotent replay
→ bounded exact-owner delivery lease preparation
→ bounded wait until exact lease expiry
→ exact-owner delivery recovery
→ recovery replay + owner readback
→ mandatory cleanup through existing lease boundaries
→ fixed aggregate evidence
```

Acceptance criteria:

- no global ready-list or expired-delivery selection for synthetic evidence;
- only the known synthetic owner/asset may be claimed, delivered, expired, or recovered;
- approved moderation/source prerequisites remain mandatory;
- existing row-level claim/complete/recovery CAS operations are reused;
- immutable writes remain conditional and content-addressed;
- delivery descriptor publishes only after successful immutable write;
- replay creates no duplicate public object or descriptor drift;
- exact-owner recovery accepts only the expected next-state replay after a concurrent CAS winner;
- public capabilities remain disabled before and after evidence;
- no persistence schema, public route, DTO, moderation policy, retention, or cleanup-policy change;
- deterministic offline tests inject storage, delivery, image processing, clock/wait, repository, and failure paths;
- no real staging/provider execution in CI.

Split processing, recovery, runtime binding, and full composition into bounded PRs where needed.

## Remaining P6 source backlog

### 1. Immutable delivery observation

Add bounded observation for the exact synthetic asset and trusted hostname: descriptor shape, immutable cache behavior where observable, content identity/replay, no private/signed-scope leakage, and policy-required deletion behavior.

### 2. Upload expiry and cleanup evidence

Add synthetic-owned evidence for stale `upload_pending` expiry, private object deletion, tombstone/state transition, replay, cleanup partial failure, bounded retry, and no unrelated-row selection.

### 3. Worker-order composition

After all exact-owner operations exist, compose the recovery-first sequence using only synthetic-owned work:

1. upload expiry;
2. cleanup;
3. delivery recovery;
4. moderation recovery;
5. moderation processing;
6. derivative delivery processing.

Actual worker scheduling remains an external deployment action.

### 4. Password-reset staging composition

Compose exact confirmation, synthetic account, disabled-capability verification, send-only callback/provider runtime, token/link handling, password reset, old-session rejection, cleanup, and aggregate evidence. Do not expose account existence, email, token, URL query, provider response, or raw error.

### 5. Consolidated runbooks

Produce operator-facing preflight, owner confirmation, evidence retention, provider/account/credential prerequisites, exact deployed SHA, capability-disabled checks, one-at-a-time enablement, observation/stop criteria, rollback/freeze, escalation, and synthetic-cleanup runbooks.

## Real non-production evidence gates

No real staging/provider action may begin until all applicable fields are known and explicitly authorized:

- target environment and trusted hostnames;
- exact backend/mobile SHAs;
- provider account/project identifiers;
- credential delivery and rotation owner;
- storage/CDN/sender/link domains;
- deployment and worker-schedule owners;
- approved synthetic fixtures/corpus;
- budget/quota limits;
- observation window;
- rollback owner and stop criteria;
- privacy/security/reviewer approval;
- evidence destination and retention period.

Execution stops if confirmation, target, SHA, capability state, provider readiness, synthetic ownership, cleanup, evidence write, or rollback prerequisites differ from the approved plan.

## Rollout order

1. approve exact plan, owners, targets, and SHAs;
2. validate configuration while capabilities remain disabled;
3. apply approved migrations;
4. deploy backend with provider-backed capabilities disabled;
5. validate worker readiness without scheduling production work;
6. execute bounded synthetic pre-enablement evidence;
7. resolve failures and rerun on the exact candidate SHA;
8. enable one capability only after explicit approval;
9. observe the approved window and stop criteria;
10. continue only after evidence review.

Password reset and managed-media uploads require independent approval/observation.

## Rollback and prohibited actions

Approved rollback order: freeze changes, disable affected capabilities, stop relevant worker scheduling, preserve state/evidence, roll back only to schema-compatible backend, perform provider-specific credential/infrastructure action only under incident ownership, then verify disabled capabilities and health.

Prohibited automatic actions:

- destructive/down migrations or data rollback;
- deletion of audit, moderation, appeal, legal-hold, or incident evidence;
- clearing claims/state tokens to force retries;
- broad credential revocation without provider/incident-owner approval;
- production data use for smoke tests;
- global worker/recovery selection for synthetic evidence;
- native build, OTA/EAS publication, store submission, or production activation.

## P7–P9 prerequisites

- **P7:** backend-owned explicit sync-conflict contract first, then strict mobile UI.
- **P8:** privacy-safe diagnostics, fixed-SHA artifact provenance, Android package/link audit, rollback verification; native distribution remains external.
- **P9:** data inventory, purpose mapping, consent/withdrawal where applicable, retention/deletion/legal-hold alignment, analytics minimization, user-facing privacy/account-deletion requirements, and legal/policy review.

Source completion alone is not a compliance determination.

## Validation standard

Every source-only readiness PR must start from exact `main`, preserve public contracts unless explicitly changed, use deterministic injected dependencies, make no real provider/staging call in CI, cover failure/replay/cleanup/redaction/resource-close paths, respect line limits, pass complete CI on the exact final head, have no unresolved review threads, merge only that green head, and update this roadmap when phase status changes.
