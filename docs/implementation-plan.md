# Smart Fitness — Implementation Plan

Updated: 2026-08-08

This file is the **canonical forward roadmap**. PR-by-PR history and exact validation detail belong in `docs/current-status.md` and `docs/handoffs/latest.md`. Keep this plan focused on capability status, active blockers, architectural invariants, and execution order.

## Current verified mobile checkpoint

- Mobile repo: `ivangemini/smart-fitness-app`
- Mobile `main`: `3473520ae1ad66b1474b015296c5593a0f14b314` (PR #465 — RUI-4B)
- Active mobile UI branch: `ui/rui5-secondary-surfaces`
- Open mobile PR #466 is a draft **RUI-6 test-only guardrail package** based on the pre-RUI-5 main. It must be revalidated after RUI-5 lands.
- Backend implementation is a separate workstream. The mobile UI execution order below must not inspect, edit, merge, deploy, or otherwise advance backend work.

Release readiness remains lower than source completeness because staging/provider/physical-device/native-release/production evidence is separately gated.

## Operating rules

- Re-check exact mobile `main`, open mobile PRs, `AGENTS.md`, this roadmap, current status, and handoff before new mobile work.
- Prefer one bounded package that closes adjacent safe UI items over one micro-PR per visual nudge.
- Preserve routes, IDs, persistence schemas, synchronization contracts, calculations, auth/session semantics, workout/program lifecycle, completed history, and backend API contracts unless a task explicitly changes them.
- Do not claim provider, production, physical-device, native-release, OTA, or deployment evidence unless it actually ran.
- Do not perform backend work, production migrations, provider activation, production data access, OTA/EAS publication, native build/install, credential/DNS changes, destructive production cleanup, or store submission without direct authorization.
- Keep analytics/telemetry collection disabled until the P9-C consent/evidence gate is explicitly satisfied.
- Preserve the reviewed local-state decision in `docs/architecture/local-state-performance-decision.md`; do not replace the current AsyncStorage architecture without new measured evidence and a separately reviewed decision.
- There is no remaining approved autonomous source-refactor phase; responsive UI hardening is a bounded product-quality phase and does not reopen the completed storage/state refactor program.
- For mobile UI work, follow `docs/architecture/responsive-mobile-ui.md`; use shared navigation/safe-area geometry instead of screen-local magic-number clearances.
- Fixed dimensions remain valid for intentional control/touch/media geometry. The prohibited pattern is device-specific positioning, guessed clearance, or arbitrary pixel nudging used to make primary layout fit one viewport.

---

# Phase status

## Phase 1 — cleanup and migration foundation

**Status: complete.**

Legacy/demo ownership cleanup, migration/repository foundations, canonical sync-capable entities, migration idempotency and schema verification are complete.

## Phase 2 — backend auth/session/account foundation

**Status: complete for the established source contract.**

Registration, login, refresh, current-user, sessions, password reset/change, account deletion and restart-safe deletion recovery exist. Further backend work is owned outside the current mobile UI stream.

## Phase 3 — mobile auth + durable sync

**Status: complete for current source scope.**

Authenticated shell, session restoration, ownership-safe sync, durable outbox/retry/idempotency/conflict handling, current entity coverage, rehydration and logout/account-delete cleanup boundaries are complete.

Remaining work is physical-device/staging release evidence, not another source refactor pass.

## Phase 4 — product domain convergence

**Status: complete for current source scope.**

Workouts/Programs/session logging, Nutrition diary/targets/library/templates, Progress history and Profile/account settings are converged on the current architecture.

## Phase 5 — deterministic Coach

**Status: complete for current planned source scope.**

Nutrition, Strength, Safety & Recovery and Combined Coach flows use deterministic/versioned inputs and outputs with explicit review/confirmation boundaries.

## Phase 6 — provider-neutral agent foundation

**Status: source-complete with safe disabled defaults.**

Provider-neutral interfaces, validation, provenance/audit metadata, bounded retries/errors and capability gates exist. Provider activation remains evidence/authorization-gated.

## Phase 7 — Social foundation

**Status: complete for current planned source scope.**

Profiles, graph, feed, workout posts, reactions, comments, notifications, moderation/reporting/restrictions and managed-media governance source contracts exist. Operational provider/storage activation remains separate and gated.

## Phase 8 — privacy/security hardening

**Status: substantially complete for current source scope.**

Data/retention inventories, account deletion, auth/sync/moderation/export privacy exclusions and fail-closed provider/analytics defaults are in source. Exact environment/runtime evidence remains a release/privacy gate.

---

# Phase 9 — release, privacy evidence and data access

Phase 9 remains a cross-repository/release program. It is **not part of the current autonomous mobile UI workstream** except where a separately authorized mobile product surface is explicitly requested.

## P9-A — release evidence

**Status: source checks exist; physical/release evidence remains authorization-gated.**

Still required when explicitly authorized:

- standalone runtime on real devices;
- production-scheme/native build evidence;
- OTA/EAS channel and rollback verification;
- store/release checklist and rollback evidence.

CI/source compilation does not substitute for these checks.

## P9-B — privacy/retention evidence

**Status: source inventories exist; exact provider/environment evidence remains external.**

Activated providers/environments must prove bounded retention lifetime, access, expiry/deletion behavior, failure monitoring, account-deletion behavior and exceptional/legal-hold behavior where applicable. Generic provider documentation is insufficient.

## P9-C — analytics and consent

**Status: collection remains disabled.**

Before activation: define purpose/region policy, exact provider/environment, retention/deletion/ownership semantics, event/property allowlists, consent persistence/UX, disclosure/localization/accessibility and explicit activation approval.

## P9-D — authenticated data-access export

**Status: backend/source work is separate; product availability remains fail closed until the full reviewed chain exists.**

Do not infer product availability from source-only backend pieces. Mobile UI work must not activate backend export routes, providers, storage or credentials implicitly.

A complete product path still requires the separately reviewed storage/delivery/status/download lifecycle plus an explicitly authorized mobile export surface and release evidence. Large-account handling must be explicit rather than silently relaxing bounded payload limits.

---

# Phase 10 — Responsive Mobile UI Hardening

Canonical contract: `docs/architecture/responsive-mobile-ui.md`.

This phase is layout/product-quality hardening, not a business-logic redesign. Preserve routes, persistence, sync, calculations, workout state and data contracts while correcting viewport, safe-area, keyboard and text-pressure behavior.

## RUI-1 — responsive layout foundation

**Status: complete.**

PR #459 merged as `2ff71de222a0cc393ed41806978cce859c98b306`.

Completed scope:

- shared floating-tab bottom-clearance geometry;
- Nutrition/Profile/Coach/Workouts moved away from independent guessed tab clearances;
- Workouts scroll content reserves sticky action space;
- touched horizontal/text rows gained bounded shrink/wrap ownership;
- canonical responsive rules were documented.

## RUI-2 — primary tabs

**Status: complete.**

PR #460 merged as `740ae06d24c895e882a37e715b59ce47e599ab5d`.

Completed scope:

- Home and Progress use shared floating-tab clearance;
- short-screen root content can grow and scroll naturally;
- Home/Progress high-pressure rows can wrap/shrink without changing base typography or touch targets;
- `LiquidGlassTabBar` consumes the shared runtime geometry constants.

## RUI-3A — active Workout Session + Finish

**Status: complete.**

PR #462 merged as `2219213a9b1ba3800d10e343bebe7fad7b13080f`.

Completed scope:

- active set table keeps 358 px as preferred maximum rather than required viewport width;
- Previous/weight/reps compress proportionally while Set/completion controls remain bounded;
- active-session inputs are keyboard-aware;
- long exercise names/header labels can reflow;
- Workout Session Finish measures its actual sticky-footer height instead of guessing `176` px;
- Save/Share remain reachable with the keyboard.

## RUI-3B — workout creation/detail flows

**Status: complete.**

PR #463 merged as `5c9ac4bf96e2ecb2c1c4a07b4b09de0521f4edc8`.

Completed scope:

- Exercise Library keeps `FlatList` virtualization and reserves its measured Add-footer height rather than `insets.bottom + 128`;
- Program workout picker and New Routine exercise picker use bounded virtualized lists instead of growing `.map()`/ScrollView collections;
- New Routine, Workout Builder and editor flows are keyboard-aware;
- touched workout creation/detail headers, names and actions have explicit shrink/wrap ownership;
- Program Detail/Exercise Detail were changed only where audit evidence required it.

## RUI-4A — auth/onboarding/account-security forms

**Status: complete.**

PR #464 merged as `4a631101c11630787e046fabc84343a3b6350d0e`.

Completed scope:

- shared login/register, forgot/reset password and onboarding scroll surfaces use automatic keyboard insets/dismissal;
- localized choice/action groups can wrap instead of forcing one row;
- Change Password/Delete Account over-full-screen sheets account for keyboard/safe-area behavior;
- auth/session/account semantics remain unchanged.

## RUI-4B — Profile/Nutrition editable surfaces

**Status: complete.**

PR #465 merged as `3473520ae1ad66b1474b015296c5593a0f14b314`.

Completed scope:

- editable Profile goals are keyboard-aware while preserving floating-tab clearance;
- Nutrition Add Food is keyboard-aware on short screens;
- Food Portion over-full-screen sheet is keyboard-aware while preserving save/delete semantics.

## RUI-5 — secondary Coach/Social/Progress surfaces

**Status: active on `ui/rui5-secondary-surfaces`; exact-head CI not yet complete.**

Audit findings being remediated:

- `weight-entry` still had legacy `safeAreaInsets.bottom + 120` clearance;
- User Limitations and Recovery Check-In had editable fields without automatic keyboard insets/dismissal;
- Social Profile Editor, Share Workout caption and Workout Post Detail comments had the same keyboard-reachability gap;
- touched Social headers/comment actions/switch rows needed explicit bounded text ownership for localization/Dynamic Type pressure.

Current bounded implementation:

- replace weight-entry `+120` with actual safe-area spacing;
- automatic keyboard insets and interactive/on-drag dismissal across the audited editable secondary surfaces;
- `flexGrow: 1` where short-screen content must remain scroll-reachable;
- `minWidth: 0`, `flexShrink` and wrapping only on touched high-pressure Social rows;
- preserve visual tokens, touch-target geometry, validation, API behavior, local persistence and synchronization semantics.

**Merge gate:** full exact-head Mobile CI. Do not mark RUI-5 complete before the validated head merges.

## RUI-6 — focused responsive regression guardrails

**Status: draft PR #466 exists; queued behind RUI-5.**

After RUI-5 merges:

1. revalidate/rebase #466 against the resulting `main`;
2. ensure its assertions protect proven failure modes rather than implementation trivia;
3. include newly fixed RUI-5 secondary editable surfaces where useful;
4. do not add blanket regex bans on legitimate fixed control dimensions or intentional overlays;
5. merge only after exact-head Mobile CI is green.

---

# Mobile UI execution order from this checkpoint

1. Finish RUI-5 source review and documentation sync.
2. Open one bounded RUI-5 PR against exact current `main`.
3. Run the complete exact-head Mobile CI gate and fix only concrete failures.
4. Merge only the validated RUI-5 head.
5. Update/revalidate existing RUI-6 PR #466 against post-RUI-5 `main`; merge only its validated exact head.
6. Run physical responsive evidence only when explicitly authorized: narrow/small-height device, Dynamic Type, open keyboard, iPhone safe areas, Android navigation/system insets, long localization and dense/empty states.
7. Keep OTA/EAS/native/release actions separately authorization-gated.

Backend execution is intentionally absent from this mobile UI sequence.

# Validation policy

For runtime/code PRs, use repository-required exact-head Mobile CI:

- repository and changed-file line limits;
- TypeScript;
- full regression suite and relevant source contracts;
- expanded sync smoke;
- Expo export;
- Expo Doctor.

Responsive UI packages must also be reviewed against `docs/architecture/responsive-mobile-ui.md`. CI does not substitute for physical-device evidence.

For docs-only synchronization, verify diff/ancestry; workflows may intentionally ignore Markdown-only changes.

# Definition of done for Phase 10

Phase 10 source/CI hardening is complete only when:

- RUI-1 through RUI-5 are merged on validated heads;
- focused RUI-6 guardrails are merged on a validated post-remediation head;
- the roadmap/status/handoff agree with actual Git history;
- no known audited high-risk magic clearance, keyboard reachability, unbounded growing picker, or text-pressure defect remains in the scoped mobile surfaces.

Physical-device responsive/release evidence remains a separate gate and must not be inferred from source/CI completion.