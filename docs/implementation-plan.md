# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical execution plan for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`. Detailed provider and release-readiness gates live in `docs/roadmap/provider-readiness.md`.

## Verified baseline

Baseline before this documentation-only synchronization slice:

- mobile `main`: `fd2257950df254968b85e476fc2ad3291b908cc0`;
- backend `main`: `5803ccc79feb96b0d58fa0c12d7eb762cecabbf2`;
- open mobile pull requests: none;
- open backend pull requests: none after backend PR #134 merged;
- all public provider-backed capabilities remain disabled;
- no real provider/staging evidence, deployment, worker scheduling, native build, OTA/EAS publication, or production activation has been performed.

Always re-check exact `main`, open pull requests, `AGENTS.md`, this plan, and relevant architecture/operations documents before another slice.

## Product and architecture baseline

Smart Fitness remains an Expo / React Native offline-first mobile application backed by the existing Fastify/PostgreSQL service.

The reviewed local-state evidence and decision remain canonical in `docs/architecture/local-state-performance-decision.md`.

Approved boundaries:

- the single AsyncStorage `AppState` snapshot remains the accepted local persistence architecture;
- private data remains revision-aware and restart-safe through existing sync, conflict, tombstone, retry, and refresh-token contracts;
- Coach flows remain deterministic, structured, and explicit-confirmation based;
- Social includes profiles, graph, posts, reactions, comments, notifications, reports, moderation, review, appeals, retention, cleanup, managed avatars, and workout-post media;
- media remains private through quarantine, validation, moderation, derivative generation, delivery, expiry, recovery, and deletion boundaries;
- the mobile client never stores provider credentials or calls object storage, CDN, classifier, OCR, email, or model providers directly;
- unavailable provider-backed operations remain hidden or fail closed through strict capability contracts.

`docs/architecture/app-context-consumer-inventory.md` records no remaining production `useAppContext` consumers. There is no remaining approved autonomous source-refactor phase.

## Program order

1. **P6 — Provider deployment configuration, source-prepared staging evidence, and operational runbooks.**
2. **P7 — Backend-owned explicit sync-conflict resolution contract, then mobile UI.**
3. **P8 — Diagnostics, exact-SHA release gates, and Android source preparation.**
4. **P9 — Technical privacy, legal, consent, retention, and analytics prerequisites.**

Do not start a later phase merely because an earlier source slice is blocked by external authorization. Continue only with an independent source-only slice that preserves existing contracts.

## Phase status

### P0 — Provider configuration and capability contracts

**Source-complete.** Provider selectors/factories, configured/ready/enabled states, fail-closed production validation, privacy-safe capability DTOs, strict mobile parsing, and unavailable-operation gating are implemented.

### P1 — Private object storage and immutable delivery

**Source-complete.** Private quarantine storage, conditional immutable writes, exact deletion, owner-opaque content-hashed public variants, metadata/checksum/prefix handling, pagination, cleanup, and replay behavior are implemented.

### P2 — Worker entrypoints and orchestration

**Source-complete.** Cleanup, upload expiry, moderation, moderation recovery, derivative delivery, and delivery recovery have bounded entrypoints, readiness contracts, graceful shutdown, explicit retry ownership, and deployment templates.

### P3 — Classifier and OCR providers

**Source-complete for selected contracts.** Amazon Rekognition classifier/OCR adapters implement bounded transport, retry, timeout, parsing, redaction, and conformance contracts. No quality, quota, or production-readiness claim exists without authorized evidence.

### P4 — Moderation calibration tooling

**Source-complete.** Aggregate-only calibration tooling, fail-closed corpus/output handling, provider injection, role separation, and deterministic offline coverage are implemented.

### P5 — Password reset

**Source-complete across backend and mobile.** Hashed one-time tokens, cooldown, expiry, replay rejection, delivery-failure invalidation, password replacement, all-session revocation, generic accepted responses, Resend templates, trusted reset route, capability-gated mobile flows, associated-domain/app-link source configuration, and placeholder association templates are implemented.

Operational password reset still requires externally authorized provider/DNS/domain/deployment/native-build/device evidence and explicit enablement.

## P6 — Current provider and staging-readiness program

### Completed backend chain

The source-prepared P6 chain is complete through backend PR #134:

| PR | Exact green head | Merge SHA | Result |
|---|---|---|---|
| #118 | `b91cd1feef7b3ff494e86ba133ac95037fbea677` | `64c04872e0ede26f87dd6017877e15ab218bccc1` | Fail-closed staging runner foundation |
| #119 | `2d2ae0aca373ce471ade00c9e721b3c3f2557643` | `15c1a939df06d84a38525f1558a2fa7a4ae2754f` | Synthetic auth/session scenario |
| #120 | `ccbb98c164efada298a9768d329f9150757ecbf1` | `1de40eb713a810bdc8875acebccd61d3b8f8d059` | Private-quarantine lifecycle core |
| #121 | `786f2e750b64ece2e7f591b5579dc706322f794b` | `a2b89e7942683a867ebc4632968ddfe3df55f232` | Exact-owner operational adapter and bounded signed upload |
| #122 | `1c5cdadfd39e63eacff479e416ddd3bbe8c093e4` | `bd7f4499a455252b663c8687dda1e5f4a4d5f327` | Managed-media composition core |
| #123 | `822a2ce030457c6914dd5ce224150cdddd7b6827` | `06c955ff57a75ea73921fd8e676787a4ebc2e0ae` | Callback-form auth/session lease |
| #124 | `cc6760f43184db7919334d45da189ab5b7257b16` | `e527693b817a3bba2b3b1c8c509f9f5911e3741b` | Redacted CLI and production-shaped runtime binding |
| #125 | `01c0e210d57f83ce9034840f88bd79f471d93771` | `ebf48cbb3004f105fe00048a729a771bcd204f64` | Replay-verified private-quarantine lease |
| #126 | `3023d189ad6f1fce358eb1a4f606ddb1b16e793a` | `f20fd85de5cae3bfbbb45018ec4c5cc1246780ff` | Exact-owner moderation processing/replay core |
| #127 | `51915512a05d8aa2bc7f81cfac33867145454d7f` | `4af6db678ef7d7457ab5221157524363605635ba` | Configured moderation runtime and owner-bound adapter |
| #129 | `e84ea28f2d6ab5f8e3bd8a0a6a13250615f6ebf3` | `d810e32c28a082d32e889923b66ae7e07a27fb5c` | Configured auth/quarantine/moderation lifecycle composition |
| #130 | `127938a3ad167b12f9c1f31ad478d4a72c6b2754` | `400063df9107c3f1bbf914cfa799c21ad7dcbff5` | Exact-owner expired-processing recovery service/runtime/evidence |
| #131 | `82674b3e4e2d4d74d38446f7f6af65cb5156b42b` | `2c7a1801b9bf24d6f16fbe2db4c0345bf19cffbb` | Exact-owner bounded processing lease, expiry wait, and full recovery composition |
| #132 | `4a90e88fc30a1b3c16fc025ef6542d189a0a5ad5` | `58f5cd45c9ea7a302e01c31ea93e8e419beb9fd2` | Exact-owner derivative-delivery processing, replay, descriptor, and readback evidence |
| #133 | `55b2c06892b35addc8855b84cf110495d4853abb` | `740bff09e3145ff6e8a64f7832340140efcd5c19` | Configured production-shaped delivery runtime binding |
| #134 | `0a0dd115043da36b3b9999f8e8046d6a3da7592e` | `5803ccc79feb96b0d58fa0c12d7eb762cecabbf2` | Exact-owner expired-delivery recovery service/runtime/evidence |

Backend PR #134 CI run #970 passed lint, formatting, TypeScript build, production configuration validation, migrations/idempotency, migrated-schema integration, PostgreSQL Social integration, the complete Vitest suite, and production startup with `/health` verification.

The derivative-delivery source now has separate exact-owner processing, configured runtime, and expired-lease recovery boundaries. No global ready-list, processing batch, expired-row list, or global recovery method is used by synthetic evidence.

### Completed mobile managed-media composition

Mobile PRs #396–#400 established shared upload composition, shared bounded polling, and the evidence-based stop condition against speculative generic abstraction.

Do not create a generic React upload hook, universal draft store, or universal cleanup policy without a concrete third consumer or demonstrated defect.

### Active next P6 slice

**Add exact-owner bounded delivery-lease preparation and full recovery composition.**

Required source behavior:

1. inspect the existing `SocialMediaDeliveryRepository.claimOwned`, configured delivery runtime, exact-owner recovery adapter/core, synthetic auth/quarantine/moderation composition, and cleanup leases before editing;
2. claim only one known approved synthetic-owned asset through the existing owner/asset/state-version CAS;
3. generate a fresh processing token and monotonic bounded lease where `leaseExpiresAt > now`; never backdate a lease to manufacture expiry;
4. inject a bounded wait and advance only after the exact claimed lease has actually expired;
5. invoke the existing exact-owner delivery recovery core, then verify recovered state, immutable-prefix cleanup, replay stability, owner readback, and public capabilities remaining disabled;
6. compose the flow after synthetic auth, private quarantine, validation/normalization, and moderation allow using one configured provider runtime and database pool;
7. perform mandatory asset cleanup, account cleanup, session revocation, and resource close through existing boundaries on success and failure;
8. never call `listReady`, `processReadyBatch`, `listExpiredProcessing`, or `recoverExpiredProcessing` when unrelated staging rows may be selected;
9. emit fixed aggregate evidence only and keep CI deterministic/offline through injected clock, wait, token, repository, storage, delivery, and cleanup dependencies;
10. preserve persistence schema, public routes/DTOs, lifecycle states/reasons, delivery keys/descriptors, moderation policy, retry, retention, and cleanup policy;
11. perform no real provider/staging request, deployment, capability mutation, migration outside CI, worker scheduling, native build, OTA/EAS publication, or production action.

Keep claim/expiry preparation and full resource-owning composition in separate bounded PRs if the coherent diff would become too large.

### Ordered remaining P6 backlog

After exact-owner delivery recovery composition:

1. immutable delivery observation and replay evidence;
2. stale-upload expiry evidence;
3. cleanup-worker evidence, including bounded partial failure and replay;
4. authorized worker-order composition using only synthetic-owned work;
5. password-reset staging composition and redacted evidence;
6. consolidated operational runbooks and evidence checklist;
7. real non-production provider/staging execution only after direct authorization and required accounts, credentials, infrastructure, deployment, ownership, quota, and evidence destinations are available.

Global batch/recovery methods must not be used in synthetic scenarios when they may select unrelated staging rows.

## P7 — Explicit sync-conflict resolution

**Not started.**

Required order:

1. backend-owned conflict-choice contract with strict validation, authorization, idempotency, and revision semantics;
2. minimum authenticated API after the backend contract is stable;
3. strict mobile parsing and account-scoped presentation/UI;
4. preserve automatic merge/retry for non-user-resolvable conflicts;
5. restart, stale-choice, tombstone, and concurrent-update coverage.

Do not start with mobile UI or infer conflict semantics in the client.

## P8 — Diagnostics and release preparation

**Not started.** Planned work includes privacy-safe diagnostics, exact artifact provenance, backend/mobile SHA matching, Android package/link audit, and rollback verification.

Native builds, installation, TestFlight/Play distribution, OTA/EAS publication, and store submission remain external actions requiring direct authorization.

## P9 — Privacy, legal, consent, retention, and analytics prerequisites

**Not started.** Planned work includes data inventory, purpose mapping, consent/withdrawal contracts where required, retention/deletion/legal-hold alignment, analytics minimization, user-facing privacy/account-deletion requirements, and technical evidence for legal/policy review.

Source completion alone is not a legal-compliance determination.

## Permanent authorization boundaries

Do not perform any of the following without a direct user request for that exact action:

- create/change provider accounts, credentials, secrets, buckets, CDN distributions, DNS, sender domains, or callback configuration;
- deploy backend/workers, run migrations outside CI, change worker schedules, or activate capabilities;
- execute real staging/provider smoke scenarios;
- perform native builds, install builds on devices, publish OTA/EAS updates, submit stores, or activate production;
- use production user data, unrelated staging data, or unbounded/global worker selection for synthetic evidence;
- run destructive rollback, down migration, data deletion, legal-hold removal, audit deletion, or generic credential revocation.

## Validation policy for every source PR

- start from current exact `main`;
- keep one coherent slice and preserve public contracts unless explicitly changed by the phase;
- maintain repository line limits;
- add deterministic tests for changed behavior and failure paths;
- run complete repository CI on the exact final head;
- inspect review threads, reviews, and comments;
- merge only the exact green head;
- update the canonical roadmaps when phase status or the active ordered backlog changes.
