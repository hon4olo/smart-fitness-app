# Smart Fitness Current Status

Updated: 2026-08-08

## Verified mobile baseline

- Mobile repo: `ivangemini/smart-fitness-app`
- Mobile `main`: `3473520ae1ad66b1474b015296c5593a0f14b314` (PR #465 — RUI-4B)
- Active UI branch: `ui/rui5-secondary-surfaces`
- Open mobile PR #466 is a **test-only RUI-6 draft** based on the current pre-RUI-5 main. Do not treat its description as proof that RUI-5 is merged; revalidate it after RUI-5 lands.
- Backend work is a separate workstream and is intentionally out of scope for the current mobile UI pass.

The mobile architecture remains unchanged: Expo/React Native, focused state boundaries, offline-first persistence, durable sync, deterministic Coach surfaces, and existing Social source contracts. Responsive work changes presentation/layout only; it must not alter routes, persistence schemas, synchronization contracts, calculations, workout ownership/history, auth/session semantics, or backend APIs.

## Responsive UI hardening

Canonical contract: `docs/architecture/responsive-mobile-ui.md`.

### RUI-1 — complete

PR #459 merged as `2ff71de222a0cc393ed41806978cce859c98b306`.

Delivered shared floating-tab/safe-area geometry, primary Workouts sticky-action geometry, bounded text reflow and the responsive architecture contract. Exact-head Mobile CI #1830 passed the full required gate.

### RUI-2 — complete

PR #460 merged as `740ae06d24c895e882a37e715b59ce47e599ab5d`.

Delivered shared Home/Progress bottom clearance, short-screen flex growth, bounded primary-tab reflow and one runtime geometry source for `LiquidGlassTabBar`. Exact-head Mobile CI #1832 passed the full required gate.

### RUI-3A — complete

PR #462 merged as `2219213a9b1ba3800d10e343bebe7fad7b13080f`.

Delivered the responsive active-session five-column set grid, keyboard-aware workout inputs, long-name handling, and runtime-measured Workout Session Finish footer clearance. Exact-head Mobile CI #1836 passed line audits, TypeScript, 1392/1392 regression tests, expanded sync smoke, Expo export and Expo Doctor.

### RUI-3B — complete

PR #463 merged as `5c9ac4bf96e2ecb2c1c4a07b4b09de0521f4edc8`.

Delivered:

- measured Exercise Library sticky-footer clearance;
- virtualized/bounded Program Workout and New Routine exercise pickers;
- keyboard-aware New Routine, Workout Builder and workout editor flows;
- bounded long-text/action layout across workout creation/detail surfaces;
- no workout/program persistence, ordering, routing, sync or completed-history semantics changed.

### RUI-4A — complete

PR #464 merged as `4a631101c11630787e046fabc84343a3b6350d0e`.

Delivered keyboard/safe-area hardening for shared sign-in/register, forgot/reset password, onboarding, Change Password and Delete Account surfaces without changing auth/session/account semantics. Exact-head Mobile CI #1840 passed the full required gate.

### RUI-4B — complete

PR #465 merged as `3473520ae1ad66b1474b015296c5593a0f14b314`.

Delivered keyboard-aware editable Profile goals, Nutrition Add Food and Food Portion surfaces while preserving profile/nutrition calculations and persistence semantics.

### RUI-5 — active package

Branch: `ui/rui5-secondary-surfaces`.

The source audit found remaining concrete secondary-surface defects rather than treating RUI-5 as a no-op:

- `weight-entry` still used legacy `safeAreaInsets.bottom + 120` clearance;
- User Limitations and Recovery Check-In contained editable fields but lacked automatic keyboard inset/dismissal behavior;
- Social Profile Editor, Share Workout caption and Workout Post Detail comments had the same keyboard-reachability gap;
- touched Social header/action rows needed explicit `minWidth: 0`, `flexShrink` or wrapping ownership for long localized text.

Current RUI-5 implementation:

- removes the `+120` weight-entry positioning hack and uses actual safe-area spacing;
- adds automatic keyboard insets and platform-appropriate interactive/on-drag dismissal to the audited editable secondary surfaces;
- makes short-screen content flex-grow so final actions remain reachable by scrolling;
- hardens touched Social headers, comment actions, preview fields and switch rows against localization/Dynamic Type pressure;
- preserves touch-target geometry, dark visual language, API calls, validation, persistence and sync behavior.

RUI-5 is **not complete until exact-head Mobile CI is green and the validated head is merged**.

### RUI-6 — queued after RUI-5

PR #466 already exists as a draft test-only guardrail package. It must be revalidated against the post-RUI-5 `main`; do not merge it based on stale continuity text or an old base result.

Its intended scope is focused regression protection for failure patterns that actually occurred: shared tab clearance, measured sticky footers, virtualized growing pickers, keyboard-aware editable surfaces and localized choice/action reflow. It must not become a blanket ban on legitimate fixed control dimensions or overlay positioning.

## Remaining mobile UI evidence

Source/CI hardening is not physical-device proof. Release evidence still needs, when explicitly authorized:

- narrow/small-height iPhone behavior;
- Dynamic Type / enlarged system text;
- open-keyboard reachability;
- notch/Dynamic Island/Home Indicator safe areas;
- Android navigation/system insets;
- long localization and dense/empty states.

No OTA/EAS publication or native build/install is implied by source/CI completion.

## Current execution order for the UI workstream

1. Finish the bounded RUI-5 source diff and documentation sync.
2. Open one RUI-5 PR and run full exact-head Mobile CI.
3. Fix only concrete CI failures; merge only the exact validated head.
4. Rebase/revalidate the existing test-only PR #466 on the resulting `main` and merge only if its exact-head Mobile CI is green.
5. Keep physical-device/release evidence separate and authorization-gated.

Backend implementation/deployment is not part of this UI workstream.

## Actions not performed

No backend code/deployment, production migration, provider activation, production data access, OTA/EAS publication, native build/install, credential/DNS change, destructive production cleanup or store submission is performed by this responsive UI workstream.