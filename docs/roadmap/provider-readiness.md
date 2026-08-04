# Provider and Release Readiness Roadmap

Updated: 2026-08-04

This document tracks provider, staging, deployment, diagnostics, native-release, privacy, and analytics readiness. `docs/implementation-plan.md` remains the canonical phase-order document.

## Current baseline

- mobile `main` before this documentation slice: `13ad534e9d96b2ad4a3d3407a155fd898ad5614f`;
- backend `main`: `adc02a73344949c08ac2d454ee7da2bc0e72535e`;
- backend P6 provider/staging-readiness source is complete through PR #142;
- mobile managed-media composition remains complete through PR #400;
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
- exact-owner upload-expiry and cleanup evidence;
- privacy-safe readiness summaries.

External requirements remain owned non-production/production accounts, credentials, encryption/lifecycle/CORS/public-access/logging/quota settings, incident ownership, and authorized upload/read/delete/replay/expiry/cleanup evidence.

### Immutable media delivery

Implemented:

- owner-opaque content-hashed variant keys;
- immutable conditional writes and exact deletion;
- delivery descriptors and strict mobile parsing;
- derivative delivery/recovery worker source boundaries;
- exact-owner derivative processing, bounded lease preparation, naturally expired recovery, replay, owner readback, and immutable-prefix cleanup;
- trusted-host observation of descriptor shape, immutable cache behavior, content identity, private/signed-scope leakage rejection, replay, deletion, and post-delete unavailability;
- CDN-origin policy templates.

External requirements remain owned CDN/origin configuration, trusted hostname/TLS, cache/invalidation policy, quota/incident ownership, and authorized real derivative/replay/recovery/observation/deletion evidence.

### Media classifier, OCR, and content moderation

Implemented:

- provider-neutral contracts;
- Amazon Rekognition adapters;
- bounded requests, retries, timeouts, parsing, redaction, and conformance tests;
- deterministic moderation policy and versioned outcomes;
- idempotent persistence and stale-result handling;
- classifier/OCR/text composition;
- configured/ready/disabled runtime summaries;
- exact-owner moderation processing, bounded processing-lease preparation, naturally expired recovery, replay, readback, cleanup, and full resource-owning composition;
- recovery-first worker-order composition that never selects unrelated staging rows.

External requirements remain provider credentials/region/quota/budget/incident ownership, representative approved corpus, aggregate-only calibration, policy/reviewer ownership, escalation/appeal/retention operations, and authorized end-to-end evidence.

### Password-reset delivery

Implemented:

- hashed one-time tokens, expiry, cooldown, replay rejection, delivery-failure invalidation, password replacement, and all-session revocation;
- generic accepted responses;
- bounded EN/RU Resend templates and send-only runtime;
- trusted HTTPS reset route;
- capability-gated mobile forgot/reset flows;
- iOS associated-domain and Android app-link source configuration;
- placeholder-only sender DNS, AASA, and Digital Asset Links templates;
- staging composition for reset-link validation, old access/refresh rejection, replay rejection, old-password rejection, new login, account deletion, fallback cleanup, and resource close.

External requirements remain Resend account/credential, verified sender DNS, owned reset-link domain, deployed backend/native builds, deliverability/link-routing/device/rollback evidence, and explicit enablement.

## P6 source-readiness status

**Source-complete through backend PR #142.**

### General deployment and policy contracts

- backend PR #113 — environment templates and environment matrix;
- backend PR #114 — storage, delivery, CORS, lifecycle, encryption, public-access, and CDN-origin policy templates;
- backend PR #116 — sender DNS classes, AASA, Digital Asset Links, reset route, and send-only callback boundary;
- backend PR #117 — rollout, worker ordering, staged enablement, rollback, repeated confirmation, and evidence contracts.

### Fail-closed staging and exact-owner evidence chain

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
- PR #129 — resource-owning auth/quarantine/moderation composition;
- PR #130 — exact-owner expired-moderation recovery service/runtime/evidence;
- PR #131 — monotonic moderation lease preparation, natural expiry wait, recovery composition, mandatory cleanup, and resource close;
- PR #132 — exact-owner derivative-delivery processing, replay, descriptor publication, and owner readback;
- PR #133 — configured production-shaped derivative-delivery runtime;
- PR #134 — exact-owner expired-delivery recovery with immutable-prefix cleanup;
- PR #135 — exact-owner bounded delivery-lease preparation;
- PR #136 — full auth/quarantine/moderation/delivery recovery lifecycle composition;
- PR #137 — immutable delivery observation, replay, leakage rejection, deletion, and post-delete evidence;
- PR #138 — exact-owner stale upload expiry evidence;
- PR #139 — exact-owner private-origin and delivery cleanup evidence;
- PR #140 — recovery-first exact-owner worker-order composition;
- PR #141 — password-reset staging composition and redacted evidence;
- PR #142 — consolidated provider staging-readiness runbook and validation.

### Exact evidence for final P6 slices

| PR | Exact green head | Merge SHA | Backend CI |
|---|---|---|---|
| #135 | `ffd1689b91f9ec0b0f24ca45c8f526ee169263a6` | `74fdb95fd103de36a9cb5920d5722f1b854f7a13` | #977 passed |
| #136 | `5aced0e850311ed41123e8b30cdf74fecaf110e2` | `6d9dbb8ca0e3145e19271bbf18863b66b3054e5d` | #982 passed |
| #137 | `3eeca20d266927d16e26785b396a3afbb1fc990b` | `771e126c7b3962bbb7aa75d4f9a30ea08c09c1b7` | #990 passed |
| #138 | `bec58d2fce0f6ad8faa21d73aa23bc1ae13fd845` | `caa7a9cc51c6ec9c3255cf396ce4c30970ddf1b7` | #995 passed |
| #139 | `26e209e8bc9e7bf835a41f8b98544f1038d901cb` | `055883325f2bf410365a1a33d35e651fb0a81a2c` | #1005 passed |
| #140 | `f024b5ed6700d3eb8e439bd12e414a2029f9c52c` | `05df0f0d7c1138393294e6a7d51ccad4f82ff7c7` | #1010 passed |
| #141 | `c5bf63993daa0a4cc6c9525d467eb2eee9f06efd` | `b8c129506a7f5b6408df063990dd2235db954869` | #1016 passed |
| #142 | `383348e2db07feacf8685200d6838f9fc774c342` | `adc02a73344949c08ac2d454ee7da2bc0e72535e` | #1018 passed |

Each listed run passed lint, formatting, TypeScript build, production configuration validation, migrations/idempotency, migrated-schema integration, PostgreSQL Social integration, the complete Vitest suite, and production startup with `/health` verification.

### Mobile managed-media composition

Mobile PRs #396–#400 established composition boundaries, shared upload/polling, and the stop condition against speculative generic abstractions. No further generic mobile media abstraction is approved without a concrete third consumer or demonstrated defect.

## Remaining P6 action — real non-production evidence

The only remaining P6 work is external execution, not autonomous source development.

A real isolated non-production run may begin only after a direct request for that exact action and all applicable fields are known:

- target environment and trusted hostnames;
- exact deployed backend/mobile SHAs;
- provider account/project identifiers and staging-only resources;
- credential delivery, rotation, and incident owners;
- storage/CDN/sender/reset-link domains;
- deployment and worker-schedule owners;
- approved synthetic fixtures/corpus/mailbox;
- budget/quota limits and observation window;
- rollback owner and stop criteria;
- privacy/security/reviewer approval;
- create-only evidence destination and retention period.

The authorized operator must use `docs/operations/provider-staging-readiness-runbook.md`, keep public provider-backed capabilities disabled during pre-enablement evidence, execute only exact synthetic-owned work, stop on the first failed invariant, complete bounded cleanup, close resources, and seal aggregate evidence.

Autonomous work must not perform this run.

## Active autonomous source phase — P7

### Backend-owned explicit sync-conflict resolution

Required order:

1. audit current sync conflict payloads, persistence/revision/tombstone contracts, authorization, retry behavior, and mobile presentation;
2. define the smallest strict backend-owned choice contract only for genuinely user-resolvable conflicts;
3. derive ownership from authentication and never accept arbitrary user ownership from the client;
4. require conflict identity, expected authoritative revision/version, bounded choice enum, and idempotency key;
5. reject stale, already-resolved, unauthorized, malformed, deleted/tombstoned, or non-user-resolvable conflicts;
6. preserve automatic merge/retry for conflicts that do not require user choice;
7. apply the selected resolution atomically and return a strict versioned result;
8. make replay idempotent and concurrent choices deterministic;
9. cover ownership, stale choice, replay, concurrent choice, tombstone, and restart-safe behavior in PostgreSQL/integration tests;
10. add the minimum authenticated API only after the repository/service contract is stable;
11. add strict mobile parsing and account-scoped UI only after the backend API is merged.

Do not infer conflict semantics in the mobile client.

## Real non-production rollout order

Only after direct authorization:

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

Password reset and managed-media uploads require independent approval and observation.

## Rollback and prohibited actions

Approved rollback order: freeze changes, disable affected capabilities, stop relevant worker scheduling, preserve state/evidence, roll back only to a schema-compatible backend, perform provider-specific credential/infrastructure actions only under incident ownership, then verify disabled capabilities and health.

Prohibited automatic actions:

- destructive/down migrations or data rollback;
- deletion of audit, moderation, appeal, legal-hold, or incident evidence;
- clearing claims/state tokens to force retries;
- broad credential revocation without provider/incident-owner approval;
- production data use for smoke tests;
- global worker/recovery selection for synthetic evidence;
- provider account, credential, storage, CDN, DNS, sender-domain, callback, deployment, worker-schedule, or capability changes;
- native build, device installation, OTA/EAS publication, store submission, or production activation.

## P8–P9 prerequisites

- **P8:** privacy-safe diagnostics, fixed-SHA artifact provenance, Android package/link audit, rollback verification; native distribution remains external.
- **P9:** data inventory, purpose mapping, consent/withdrawal where applicable, retention/deletion/legal-hold alignment, analytics minimization, user-facing privacy/account-deletion requirements, and legal/policy review.

Source completion alone is not a compliance determination.

## Validation standard

Every source-only readiness PR must start from exact `main`, preserve public contracts unless explicitly changed, use deterministic injected dependencies, make no real provider/staging call in CI, cover failure/replay/cleanup/redaction/resource-close paths, respect line limits, pass complete CI on the exact final head, have no unresolved review threads, merge only that green head, and update canonical roadmaps when phase status changes.
