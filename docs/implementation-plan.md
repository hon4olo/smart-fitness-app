# Smart Fitness — Implementation Plan

Updated: 2026-08-08

This file is the **canonical forward roadmap**. Historical PR-by-PR detail belongs in `docs/current-status.md` and `docs/handoffs/latest.md`; keep this plan focused on completed capability groups, remaining blockers, and execution order.

## Current verified baseline

- Mobile repo: `ivangemini/smart-fitness-app`
- Mobile `main` at responsive-UI branch start: `60edb23de9cab90bbc4d4e23466a481bef2b94e6` (PR #458)
- Backend repo: `ivangemini/smart-fitness-backend`
- Backend `main`: `431998bfa85bf169fd68e98a7e46651f70cfa2d9` (through backend PR #196)
- Backend PR #197 is open and is scoped to secure private export storage/delivery source contracts.

Planning estimate before the newly added responsive-UI remediation scope was approximately **92% of the existing engineering roadmap source-complete**. Release readiness remains lower because provider/staging/physical-device/production evidence is separately gated. Responsive UI hardening is now tracked explicitly rather than being treated as incidental polish.

## Operating rules

- Re-check both `main` branches, open PRs, `AGENTS.md`, this roadmap, current status, and handoff before new work.
- Prefer one bounded package that closes several adjacent safe roadmap items over one micro-PR per turn.
- Do not claim provider, production, physical-device, native-release, OTA, or deployment evidence unless it actually ran.
- Do not perform backend deployment, production migrations, provider activation, production data access, OTA/EAS publication, native build/install, credential/DNS changes, destructive production cleanup, or store submission without direct authorization.
- Keep analytics/telemetry collection disabled until the P9-C consent/evidence gate is explicitly satisfied.
- For mobile UI work, follow `docs/architecture/responsive-mobile-ui.md`; use shared navigation/safe-area geometry instead of screen-local magic-number clearances.

---

# Phase status

## Phase 1 — cleanup and migration foundation

**Status: complete.**

Legacy/demo ownership cleanup, migration/repository foundations, canonical sync-capable entities, migration idempotency and schema verification are complete.

## Phase 2 — backend auth/session/account foundation

**Status: complete.**

Registration, login, refresh, current-user, sessions, password reset/change, account deletion and restart-safe deletion-receipt recovery are source-complete.

## Phase 3 — mobile auth + durable sync

**Status: complete for current source scope.**

Authenticated app shell, session restoration, ownership-safe sync, durable outbox/retry/idempotency/conflict resolution, full current entity coverage, rehydration and logout/account-delete cleanup boundaries are complete.

Remaining work is physical-device/staging release evidence.

## Phase 4 — product domain convergence

**Status: complete for current source scope.**

Workouts/Programs/session logging, Nutrition diary/targets/library/templates, Progress history and Profile/account settings are converged on the current architecture.

## Phase 5 — deterministic Coach

**Status: complete.**

Nutrition, Strength, Safety & Recovery and Combined Coach flows have deterministic versioned input/output and explicit review/confirmation boundaries.

## Phase 6 — provider-neutral agent foundation

**Status: source-complete with safe disabled defaults.**

Provider-neutral interfaces, validation, provenance/audit metadata, bounded retries/errors and capability gates are implemented. Provider activation remains evidence/authorization-gated.

## Phase 7 — Social foundation

**Status: complete for the current planned source scope.**

Profiles, graph, feed, posts, reactions, comments, notifications, moderation/reporting/restrictions and managed-media governance/review/appeals/evidence/cleanup source contracts are implemented.

Operational provider/storage activation remains gated.

## Phase 8 — privacy/security hardening

**Status: substantially complete.**

Executable data/retention inventories, account deletion, auth/sync/moderation/export privacy exclusions and fail-closed provider/analytics defaults are in source.

Remaining evidence is concentrated in P9-B3 and production/runtime operations.

---

# Phase 9 — release, privacy evidence and data access

## P9-A — release evidence

**Status: source checks exist; physical/release evidence remains authorization-gated.**

Still required when explicitly authorized:
- standalone runtime on real device;
- production-scheme/native build evidence;
- OTA/EAS channel/rollback verification;
- store/release checklist and rollback evidence.

Do not infer these from CI or source compilation.

## P9-B1/B2 — technical and retention inventories

**Status: source-complete for current backend surfaces.**

Keep inventories synchronized when schema/provider/storage behavior changes.

## P9-B3 — provider/environment retention evidence

**Status: externally blocked.**

Exact selected provider/environment evidence must prove maximum retained lifetime, access, expiry/deletion behavior, failure monitoring, account-deletion behavior and bounded exceptional/legal-hold behavior where applicable. Generic provider documentation is not sufficient.

## P9-C — analytics and consent

**Status: source guardrails exist; collection remains disabled.**

Before activation: define purpose/region policy, select exact provider/environment, prove retention/deletion/ownership semantics, review event/property allowlists, implement consent persistence/UX, review disclosure/localization/accessibility, and separately approve activation.

## P9-D — authenticated data-access export

**Status: source chain substantially complete; storage/delivery/UI remain.**

### Completed source boundaries

Backend PRs #192–#196 now provide a continuous bounded chain:

1. **Audit/idempotency semantics**
   - canonical request fingerprint;
   - optional strict 8–128-character printable idempotency key;
   - account-scoped SHA-256 key identity instead of raw-key storage;
   - committed-response-loss replay;
   - deterministic same-key/different-request conflict;
   - no implicit unkeyed deduplication;
   - secret-free bounded audit metadata.

2. **Durable audit/idempotency persistence**
   - `data_access_export_requests` and migration `0038`;
   - owner FK with `ON DELETE CASCADE`;
   - globally unique opaque request reference;
   - account-scoped keyed uniqueness;
   - owner-scoped reads and concurrency-safe create/replay/conflict;
   - schema/format/surface/hash/time constraints;
   - operational metadata remains notice-only rather than export payload.

3. **Preparation → durable audit integration**
   - optional `Idempotency-Key` validation;
   - auth/body/header/rate-limit gates before re-verification;
   - same-invocation current-password re-verification;
   - no audit write before successful re-verification;
   - durable create/replay/conflict after verification;
   - bounded errors without internal identity leakage;
   - successful new/replayed request still ends `409 DATA_EXPORT_NOT_AVAILABLE`.

4. **Seven complete ownership-safe candidate projections**
   - `profile_and_account_metadata`;
   - `workouts_programs_and_exercises`;
   - `nutrition_and_meal_data`;
   - `progress_measurements_and_weight`;
   - `limitations_recovery_and_safety_context`;
   - `coach_reviews_proposals_and_run_history`;
   - `social_relationships_and_account_activity`.

   Received Social notifications remain excluded. Managed media and sync/operational metadata remain notice-only.

5. **Deterministic multi-surface assembly**
   - candidate-only selection;
   - canonical surface order;
   - loader preflight;
   - returned contract validation;
   - all-or-nothing failure with no partial projection payload.

6. **Bounded audited execution**
   - consumes audited metadata rather than an arbitrary public request;
   - exact UTF-8 `JSON.stringify` size accounting;
   - hard maximum **8 MiB** serialized JSON;
   - callers may lower but never raise the ceiling;
   - invalid policy/notice-only surface rejected before loaders;
   - loader/contract/serialization/oversize failures return no assembly.

7. **Deterministic JSON artifact generation**
   - consumes only successful bounded execution;
   - fixed filename `smart-fitness-data-export.json`;
   - `application/json` UTF-8 bytes;
   - regenerated byte length must equal execution measurement;
   - lowercase SHA-256 digest of exact bytes;
   - metadata excludes internal owner ID, request reference, fingerprint, idempotency identity, password, reusable authorization, object key and download credential;
   - bytes remain in-memory sensitive user export content and must not be logged.

### Current fail-closed product state

Still true after backend #196:
- default `createApp()` does not compose the optional export route;
- `/prepare` does not invoke assembly execution or artifact generation;
- new/replayed preparation remains `DATA_EXPORT_NOT_AVAILABLE`;
- no one-cross-surface PostgreSQL snapshot is claimed;
- no pagination/chunking exists for accounts exceeding the hard size ceiling;
- no artifact persistence/database record exists;
- no object-storage write exists;
- no status/download route exists;
- no expiring/revocable download authorization exists;
- no mobile export UI exists;
- no provider/storage environment is selected or activated;
- no production migration/deployment was performed by these source PRs.

### Next P9-D implementation boundary

Before any provider or route activation, define a separately reviewed **secure storage/delivery contract** covering:
- private owner-scoped artifact identity;
- lifecycle states;
- explicit retention/expiry/deletion;
- account-deletion behavior;
- expiring and revocable download authorization;
- SHA-256 verification across persistence/download;
- orphan/failure cleanup;
- no public object URLs or reusable bearer credentials.

Provider selection, object writes, public/default route activation and production execution remain explicit authorization boundaries.

If real-data evidence shows complete export JSON can exceed 8 MiB, design explicit pagination/chunking instead of relaxing the safety ceiling implicitly.

---

# Phase 10 — responsive mobile UI hardening

**Status: in progress; RUI-1 foundation implemented on the responsive-UI branch.**

Canonical contract: `docs/architecture/responsive-mobile-ui.md`.

This phase is product-quality hardening, not a business-logic redesign. Preserve routes, persistence, sync, calculations, workout state, and data contracts while fixing layout behavior.

## RUI-1 — responsive layout foundation

**Status: implemented in the current package; CI/device validation pending.**

Scope:
- shared floating-tab bottom-clearance calculation with unit coverage;
- Nutrition bottom clearance moved off the insufficient screen-local inset;
- Coach and Profile moved off independent `safeArea.bottom + 120` constants;
- Workouts sticky Start/Resume action positioned from actual safe-area + floating-tab geometry;
- Workouts scroll content reserves space for the sticky action;
- touched horizontal/text rows gain bounded shrink/wrap behavior;
- responsive rules and initial audit are documented.

## RUI-2 — remaining primary tab screens

**Status: next mobile UI package.**

- Home: remove independent bottom navigation magic number and validate header/card text on narrow/large-text layouts.
- Progress: remove independent bottom navigation magic number and validate metric/action rows under width/text pressure.
- Re-check Nutrition last-row visibility and Workouts sticky action behavior after RUI-1 on a matching runtime.

## RUI-3 — workout creation and active-session flows

**Status: queued.**

Audit and remediate:
- active Workout Session;
- Workout Session Finish;
- New Routine;
- Workout Builder;
- Program Detail;
- Exercise Library/detail.

Priorities: keyboard overlap, short-screen reachability, sticky actions, set-table column compression, long exercise names, and safe-area ownership.

## RUI-4 — auth/onboarding/settings/Nutrition forms

**Status: queued.**

Audit every form for keyboard reachability, Safe Area ownership, short-height scrolling, large-text wrapping, and primary-action reachability.

## RUI-5 — secondary Coach/Social/Progress surfaces

**Status: queued after high-frequency flows.**

Apply the same responsive contract to secondary screens without mixing unrelated product redesign.

## RUI-6 — automated regression guardrails

**Status: deferred until the remediation inventory is clean enough to avoid false positives.**

Add focused source/interaction checks for proven failure patterns. Do not add a blanket regex rule that prohibits legitimate fixed control dimensions or legitimate overlay positioning.

---

# Execution order from this checkpoint

1. Keep mobile/backend roadmap and inventories synchronized as source behavior changes.
2. Complete and validate RUI-1; then continue RUI-2 and RUI-3 in bounded mobile UI packages.
3. In parallel, continue P9-D secure storage-delivery source work without provider activation; avoid overlapping backend PR #197.
4. Separately design large-account export pagination/chunking if evidence requires it.
5. P9-B3: collect exact provider/environment retention evidence when a provider/environment is selected.
6. P9-C: keep analytics/consent behind disabled defaults until policy/evidence is complete.
7. Continue RUI-4/RUI-5, then add RUI-6 guardrails after the failure inventory stabilizes.
8. Run authorized staging/provider/physical-device/release evidence, including responsive viewport/accessibility checks.
9. Only after explicit approval: production migrations/deployment/provider activation/OTA/native release actions.

# Validation policy

For runtime/code PRs, use repository-required exact-head CI plus relevant focused suites. Responsive UI packages additionally require review against the validation matrix in `docs/architecture/responsive-mobile-ui.md`; CI does not substitute for physical-device evidence. For docs-only roadmap synchronization, verify diff and branch ancestry; CI may intentionally not run because workflows ignore `docs/**` and Markdown-only changes.

# Definition of done

The current roadmap is not complete until secure export storage/delivery and product UI are reviewed, responsive UI hardening is complete across primary and secondary mobile flows, provider/environment evidence exists for activated external systems, consent requirements are satisfied if telemetry is enabled, authorized staging/physical-device/release evidence passes, and deployment/migration/rollback procedures are proven for the intended release path.
