# Smart Fitness Active Implementation Plan

Updated: 2026-08-04

This is the canonical execution plan for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`. Detailed provider and release-readiness gates live in `docs/roadmap/provider-readiness.md`.

## Verified baseline

Baseline before this documentation-only synchronization slice:

- mobile `main`: `13ad534e9d96b2ad4a3d3407a155fd898ad5614f`;
- backend `main`: `adc02a73344949c08ac2d454ee7da2bc0e72535e`;
- open mobile pull requests: none;
- open backend pull requests: none after backend PR #142 merged;
- backend P6 source readiness is complete through PR #142;
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

1. **P6 — Source-complete; real non-production provider/staging evidence remains authorization-gated.**
2. **P7 — Active next autonomous source phase: backend-owned explicit sync-conflict resolution contract, then mobile UI.**
3. **P8 — Diagnostics, exact-SHA release gates, and Android source preparation.**
4. **P9 — Technical privacy, legal, consent, retention, and analytics prerequisites.**

Do not start an external P6 execution without direct authorization. Because that action is externally blocked, independent P7 source work may proceed while preserving all P6 capability-disabled and deployment boundaries.

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

## P6 — Provider and staging readiness

### Status

**Source-complete through backend PR #142.**

The program now has strict plan/confirmation handling, secret-safe synthetic authentication, exact-owner managed-media processing/recovery/observation/expiry/cleanup evidence, recovery-first worker-order composition, password-reset staging composition, and a consolidated operator runbook.

No source claim implies that provider accounts, quotas, deliverability, classifier quality, CDN behavior, DNS/link routing, deployment, worker scheduling, or production readiness has been evidenced.

### Completed backend chain

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
| #130 | `127938a3ad167b12f9c1f31ad478d4a72c6b2754` | `400063df9107c3f1bbf914cfa799c21ad7dcbff5` | Exact-owner expired-moderation recovery |
| #131 | `82674b3e4e2d4d74d38446f7f6af65cb5156b42b` | `2c7a1801b9bf24d6f16fbe2db4c0345bf19cffbb` | Bounded moderation lease/expiry and full recovery composition |
| #132 | `4a90e88fc30a1b3c16fc025ef6542d189a0a5ad5` | `58f5cd45c9ea7a302e01c31ea93e8e419beb9fd2` | Exact-owner derivative-delivery processing/replay evidence |
| #133 | `55b2c06892b35addc8855b84cf110495d4853abb` | `740bff09e3145ff6e8a64f7832340140efcd5c19` | Configured production-shaped delivery runtime binding |
| #134 | `0a0dd115043da36b3b9999f8e8046d6a3da7592e` | `5803ccc79feb96b0d58fa0c12d7eb762cecabbf2` | Exact-owner expired-delivery recovery |
| #135 | `ffd1689b91f9ec0b0f24ca45c8f526ee169263a6` | `74fdb95fd103de36a9cb5920d5722f1b854f7a13` | Exact-owner bounded delivery-lease preparation |
| #136 | `5aced0e850311ed41123e8b30cdf74fecaf110e2` | `6d9dbb8ca0e3145e19271bbf18863b66b3054e5d` | Full auth-to-delivery recovery lifecycle composition |
| #137 | `3eeca20d266927d16e26785b396a3afbb1fc990b` | `771e126c7b3962bbb7aa75d4f9a30ea08c09c1b7` | Immutable delivery observation, replay, leakage, and deletion evidence |
| #138 | `bec58d2fce0f6ad8faa21d73aa23bc1ae13fd845` | `caa7a9cc51c6ec9c3255cf396ce4c30970ddf1b7` | Exact-owner stale upload expiry evidence |
| #139 | `26e209e8bc9e7bf835a41f8b98544f1038d901cb` | `055883325f2bf410365a1a33d35e651fb0a81a2c` | Exact-owner private-origin/delivery cleanup evidence |
| #140 | `f024b5ed6700d3eb8e439bd12e414a2029f9c52c` | `05df0f0d7c1138393294e6a7d51ccad4f82ff7c7` | Recovery-first exact-owner worker-order composition |
| #141 | `c5bf63993daa0a4cc6c9525d467eb2eee9f06efd` | `b8c129506a7f5b6408df063990dd2235db954869` | Password-reset staging composition and redacted evidence |
| #142 | `383348e2db07feacf8685200d6838f9fc774c342` | `adc02a73344949c08ac2d454ee7da2bc0e72535e` | Consolidated provider staging-readiness runbook and validation |

Backend CI runs #977, #982, #990, #995, #1005, #1010, #1016, and #1018 passed on the exact final heads for PRs #135–#142. Each passed lint, formatting, TypeScript build, production configuration validation, migrations/idempotency, migrated-schema integration, PostgreSQL Social integration, the complete Vitest suite, and production startup with `/health` verification.

### Completed source behavior

The final P6 source state proves, through deterministic injected tests:

1. strict staging-only targets, exact SHA/change confirmation, bounded response handling, and create-only redacted evidence;
2. synthetic auth/session creation, refresh, account cleanup, and session-revocation evidence;
3. private-quarantine upload, validation, normalization, replay, and deletion;
4. exact-owner moderation processing, naturally expired lease recovery, replay, readback, and cleanup;
5. exact-owner derivative-delivery processing, naturally expired lease recovery, immutable-prefix cleanup, descriptor/readback replay, and disabled capabilities;
6. trusted-host immutable delivery observation, cache/content identity, private/signed-scope leakage rejection, deletion, and post-delete unavailability;
7. exact-owner stale upload expiry and exact-owner deleted-asset cleanup;
8. recovery-first operation order without global selection of unrelated staging rows;
9. password-reset token/link validation, old access/refresh revocation, replay rejection, old-password rejection, new login, account deletion, cleanup, and resource close;
10. consolidated authorization, preflight, evidence, stop, cleanup, rollback, and emergency-disable guidance.

Mobile PRs #396–#400 remain the accepted managed-media composition boundary. Do not create a generic React upload hook, universal draft store, or universal cleanup policy without a concrete third consumer or demonstrated defect.

### Remaining P6 action — external authorization gate

The only remaining P6 work is a real isolated non-production evidence run. It may begin only after a direct user request for that exact action and all required fields are known:

- target environment and trusted hostnames;
- exact deployed backend/mobile SHAs;
- provider accounts/projects and approved staging-only resources;
- credential delivery, rotation, and incident owners;
- storage/CDN/sender/reset-link domains and configuration owners;
- deployment and worker-schedule owners;
- approved synthetic fixtures/corpus/mailbox;
- budget/quota limits and observation window;
- rollback owner and stop criteria;
- privacy/security/reviewer approval;
- create-only evidence destination and retention period.

A real run must use `docs/operations/provider-staging-readiness-runbook.md`, keep all public provider-backed capabilities disabled during pre-enablement evidence, use only exact synthetic-owned work, stop on the first failed invariant, complete bounded cleanup, and seal aggregate evidence.

Do not perform this action autonomously.

## P7 — Explicit sync-conflict resolution

**Active next autonomous source phase.**

### First slice — backend-owned conflict-choice contract

Required order:

1. audit the current sync conflict payloads, persistence/revision/tombstone contracts, authorization boundaries, retry behavior, and mobile conflict presentation before editing;
2. define the smallest strict backend-owned choice contract for only genuinely user-resolvable conflicts;
3. derive ownership from authentication and never accept arbitrary user ownership from the client;
4. require conflict identity, expected authoritative revision/version, bounded choice enum, and idempotency key;
5. reject stale, already-resolved, unauthorized, malformed, deleted/tombstoned, or non-user-resolvable conflicts;
6. preserve automatic merge/retry for conflicts that do not require user choice;
7. apply the selected resolution atomically and return a strict versioned result;
8. make replay idempotent and concurrent choices deterministic;
9. add PostgreSQL/integration coverage for ownership, stale choice, replay, concurrent choice, tombstone, and restart-safe behavior;
10. do not add mobile UI until the backend contract and minimum authenticated API are merged and stable.

Keep the first PR contract/repository/service focused. Add the authenticated route as a separate bounded slice if necessary.

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
