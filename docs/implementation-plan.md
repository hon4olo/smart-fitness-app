# Smart Fitness Active Implementation Plan

Updated: 2026-08-03

This is the canonical execution plan for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`. Detailed provider and release-readiness gates live in `docs/roadmap/provider-readiness.md`. Completed implementation detail belongs in merged pull requests and focused architecture or operations documents rather than repeated historical prose here.

## Verified baseline

Baseline before this documentation-only synchronization slice:

- mobile `main`: `1ff31e0ca92a7b94808eef36694a756e9fb24473`;
- backend `main`: `4af6db678ef7d7457ab5221157524363605635ba`;
- open mobile pull requests: none;
- open backend pull requests: none after backend PR #127 merged;
- public managed-media uploads, provider-backed media processing, immutable public delivery, and password-reset delivery remain disabled;
- no source-complete item implies provider account setup, credentials, infrastructure, deployment, worker scheduling, DNS changes, native builds, staging execution, capability activation, or production activation.

Always re-check exact `main`, open pull requests, `AGENTS.md`, this plan, and relevant architecture or operations documents before another slice.

## Product and architecture baseline

Smart Fitness remains an Expo / React Native offline-first mobile application backed by the existing Fastify/PostgreSQL service.

The reviewed local-state evidence and decision remain canonical in `docs/architecture/local-state-performance-decision.md`.

Approved boundaries:

- the single AsyncStorage `AppState` snapshot remains the accepted local persistence architecture;
- private data remains revision-aware and restart-safe through the existing sync, conflict, tombstone, retry, and refresh-token contracts;
- Coach flows remain deterministic, structured, and explicit-confirmation based;
- Social source boundaries include profiles, graph, posts, reactions, comments, notifications, reports, moderation, review, appeals, retention, cleanup, managed avatars, and workout-post media;
- media remains private through quarantine, validation, moderation, derivative generation, delivery, expiry, recovery, and deletion boundaries;
- the mobile client never stores provider credentials or calls object storage, CDN, classifier, OCR, email, or model providers directly;
- unavailable provider-backed operations remain hidden or fail closed through strict capability contracts.

`docs/architecture/app-context-consumer-inventory.md` records no remaining production `useAppContext` consumers. There is no approved general application-state refactor phase.

## Program order

1. **P6 — Provider deployment configuration, source-prepared staging evidence, and operational runbooks.**
2. **P7 — Backend-owned explicit sync-conflict resolution contract, then mobile UI.**
3. **P8 — Diagnostics, exact-SHA release gates, and Android source preparation.**
4. **P9 — Technical privacy, legal, consent, retention, and analytics prerequisites.**

Do not start a later phase merely because an earlier source slice is blocked by external authorization. Record the block and continue only with an independent source-only slice that preserves existing contracts.

## Phase status

### P0 — Provider configuration and capability contracts

**Source-complete.**

Provider-neutral selectors and factories, configured/ready/enabled states, fail-closed production validation, privacy-safe backend capability DTOs, strict mobile parsing, and unavailable-operation gating are implemented.

### P1 — Private object storage and immutable delivery

**Source-complete.**

S3-compatible private quarantine storage, conditional immutable writes, exact deletion, owner-opaque content-hashed public variants, strict metadata/checksum/prefix handling, pagination, cleanup, and replay behavior are implemented.

### P2 — Worker entrypoints and orchestration

**Source-complete.**

Cleanup, upload expiry, moderation, moderation recovery, derivative delivery, and delivery recovery have bounded entrypoints, readiness contracts, graceful shutdown, explicit retry ownership, and deployment templates.

### P3 — Classifier and OCR providers

**Source-complete for selected contracts.**

Amazon Rekognition classifier and OCR adapters implement bounded transport, retry, timeout, parsing, redaction, and conformance contracts. No quality, quota, or production-readiness claim exists without authorized non-production evidence.

### P4 — Moderation calibration tooling

**Source-complete.**

Aggregate-only calibration tooling, fail-closed corpus/output handling, provider injection, role separation, and deterministic offline coverage are implemented. Threshold or policy changes remain explicit decisions.

### P5 — Password reset

**Source-complete across backend and mobile.**

Hashed one-time tokens, cooldown, expiry, replay rejection, delivery-failure invalidation, password replacement, all-session revocation, generic accepted responses, Resend templates, trusted reset route, capability-gated mobile flows, iOS associated-domain source configuration, Android app-link source configuration, and placeholder association templates are implemented.

Operational password reset still requires externally authorized provider/DNS/domain/deployment/native-build/device evidence and explicit enablement.

## P6 — Current provider and staging-readiness program

### Completed backend foundations

| PR | Exact green head | Merge SHA | Result |
|---|---|---|---|
| #113 | `3e366e803f91d4d563d0b1e70cc189381534cd18` | `bad69c42325e7156215e7fdba45962ade3372ef1` | Environment templates and staging/production configuration matrix |
| #114 | `9e9408ec87a6c6fc0786cd66c8272b502dbb5790` | `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5` | Storage, delivery, CORS, lifecycle, encryption, public-access, and CDN-origin policies |
| #116 | `12ba41f2176079fbb4fbe13fc07e3016c16f5049` | `288425d9e8608c56f814af74274301c3940a371c` | Resend DNS classes, AASA, Digital Asset Links, trusted reset route, and send-only callback boundary |
| #117 | `ce0555570c7686fd22306d5ac6769c9cafd81e0c` | `17cf1f7d4b9345dc0aca463cedc030e1a6b2bad1` | Rollout, worker ordering, staged enablement, rollback, and evidence contracts |
| #118 | `b91cd1feef7b3ff494e86ba133ac95037fbea677` | `64c04872e0ede26f87dd6017877e15ab218bccc1` | Fail-closed staging smoke-runner foundation |
| #119 | `2d2ae0aca373ce471ade00c9e721b3c3f2557643` | `15c1a939df06d84a38525f1558a2fa7a4ae2754f` | Secret-safe synthetic auth/session scenario |
| #120 | `ccbb98c164efada298a9768d329f9150757ecbf1` | `1de40eb713a810bdc8875acebccd61d3b8f8d059` | Private-quarantine managed-media lifecycle core |
| #121 | `786f2e750b64ece2e7f591b5579dc706322f794b` | `a2b89e7942683a867ebc4632968ddfe3df55f232` | Exact-owner staging operational adapter and bounded signed upload transport |
| #122 | `1c5cdadfd39e63eacff479e416ddd3bbe8c093e4` | `bd7f4499a455252b663c8687dda1e5f4a4d5f327` | Managed-media staging composition core |
| #123 | `822a2ce030457c6914dd5ce224150cdddd7b6827` | `06c955ff57a75ea73921fd8e676787a4ebc2e0ae` | Callback-form synthetic auth/session lease |
| #124 | `cc6760f43184db7919334d45da189ab5b7257b16` | `e527693b817a3bba2b3b1c8c509f9f5911e3741b` | Confirmation-first redacted managed-media CLI and production-shaped runtime binding |
| #125 | `01c0e210d57f83ce9034840f88bd79f471d93771` | `ebf48cbb3004f105fe00048a729a771bcd204f64` | Callback-form replay-verified private-quarantine lease |
| #126 | `3023d189ad6f1fce358eb1a4f606ddb1b16e793a` | `f20fd85de5cae3bfbbb45018ec4c5cc1246780ff` | Exact-owner moderation processing/replay core composed with quarantine cleanup |
| #127 | `51915512a05d8aa2bc7f81cfac33867145454d7f` | `4af6db678ef7d7457ab5221157524363605635ba` | Configured-ready moderation runtime and exact-owner operational adapter |

PR #127 full Backend CI passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, the complete Vitest suite, and production startup with `/health` verification.

### Completed mobile managed-media composition

| PR | Exact green head | Merge SHA | Result |
|---|---|---|---|
| #396 | `aeacf4af597f61e03e87dd4b15467fc9f0456a19` | `e6b8773e7fe9ac0c1e2f87444cfdf8bb99b43ea7` | Managed-avatar/workout-post composition analysis and dependency direction |
| #397 | `057b5331a7f7c2658ca1726f8ac7c8ee8668e2ae` | `d7b20506363c6be65b7ea7a2bd10b79f01038b23` | Shared upload composition adopted by workout-post media |
| #398 | `ea6b3094807b8ad751200659e5b594d0c484104f` | `146cfd36808d37f49810eca4ec46d2e084c8d6d6` | Shared upload composition adopted by managed avatars |
| #399 | `9aaff9fe2cd4d1a67dc85605b03e1712b4df3ffb` | `e9c923056bbc04a26db7061dcb892d56e6ab0c73` | Shared bounded managed-media polling |
| #400 | `10aae4a0ff074193ce5a9e5016694cd25e719fbc` | `1ff31e0ca92a7b94808eef36694a756e9fb24473` | Residual composition audit and stop conditions |

Mobile composition stops here unless a concrete third consumer or demonstrated defect justifies another shared boundary. Do not create a generic React upload hook, universal draft store, or universal cleanup policy speculatively.

### Active next P6 slice

**Compose the configured moderation runtime with the replay-verified private-quarantine lease and the exact-owner moderation processing core.**

Required source behavior:

1. accept only the strict staging plan and exact confirmation already used by the managed-media command;
2. verify released public capabilities disabled before runtime or provider access;
3. obtain the synthetic owner only through the existing auth/session lease;
4. create the configured moderation runtime only after storage/classifier/OCR readiness and disabled-capability checks pass;
5. pass the quarantine lease asset only to the exact-owner moderation adapter;
6. validate processing, idempotent replay, owner readback, capability disablement, and mandatory deletion through existing cores;
7. close configured resources on every success/failure path;
8. emit fixed aggregate evidence only;
9. keep CI deterministic and offline through injected dependencies;
10. perform no global `processReadyBatch`, global recovery scan, real provider request, real staging request, deployment, capability mutation, or worker scheduling.

### Ordered remaining P6 backlog

After the active composition slice, continue in small independent PRs:

1. exact-owner expired-processing recovery contract and implementation;
2. derivative-delivery processing and exact-owner recovery evidence;
3. immutable delivery observation and replay evidence;
4. stale-upload expiry evidence;
5. cleanup-worker evidence, including bounded partial failure and replay;
6. authorized worker-order composition using only synthetic-owned work;
7. password-reset staging composition and redacted evidence;
8. consolidated operational runbooks and evidence checklist;
9. real non-production provider/staging execution only after direct authorization and required accounts, credentials, infrastructure, deployment, and ownership are available.

Global batch or recovery methods must not be used in a synthetic scenario when they may select unrelated staging rows. Add an exact-owner repository/service contract first.

## P7 — Explicit sync-conflict resolution

**Not started.**

Required order:

1. define a backend-owned conflict-choice contract with strict validation, authorization, idempotency, revision semantics, and deterministic tests;
2. expose only the minimum authenticated API after the backend contract is stable;
3. add mobile strict parsing and account-scoped presentation/UI;
4. preserve current automatic merge and retry behavior for non-user-resolvable conflicts;
5. add restart, stale-choice, tombstone, and concurrent-update coverage.

Do not start with mobile UI or infer conflict semantics in the client.

## P8 — Diagnostics and release preparation

**Not started.**

Planned source work:

- privacy-safe diagnostics and operator evidence without secrets, raw provider payloads, media, OCR text, tokens, or user identifiers;
- exact mobile/backend SHA release gates and artifact provenance;
- Android package/link configuration audit and source preparation;
- release rollback verification that preserves schema/data compatibility.

Native builds, installation, TestFlight/Play distribution, OTA/EAS publication, and store submission remain external actions requiring direct authorization.

## P9 — Privacy, legal, consent, retention, and analytics prerequisites

**Not started.**

Planned source work:

- data inventory and processing-purpose mapping;
- consent and withdrawal contracts where required;
- retention/deletion/appeal/legal-hold alignment;
- analytics event minimization and identifier policy;
- user-facing privacy and account-deletion requirements;
- technical evidence needed by legal/policy review.

No legal-compliance claim may be made from source implementation alone.

## Permanent authorization boundaries

Do not perform any of the following without a direct user request for that exact action:

- create or change provider accounts, credentials, secrets, buckets, CDN distributions, DNS, sender domains, or callback configuration;
- deploy backend or workers, run migrations outside CI, change worker schedules, or activate capabilities;
- execute real staging/provider smoke scenarios;
- perform native builds, install builds on devices, publish OTA/EAS updates, submit stores, or activate production;
- use production user data, unrelated staging data, or unbounded/global worker selection for synthetic evidence;
- run destructive rollback, down migration, data deletion, legal-hold removal, audit deletion, or generic credential revocation.

## Validation policy for every source PR

- start from current exact `main`;
- keep one coherent slice and preserve public contracts unless the phase explicitly changes them;
- maintain the repository line-limit policy;
- add deterministic tests for changed behavior and failure paths;
- run the repository’s complete CI on the exact final head;
- inspect review threads, reviews, and comments;
- merge only the exact green head;
- record the exact head and merge SHA in the canonical roadmap when the slice changes phase status.
