# Latest Handoff

Updated: 2026-08-08

## Checkpoint

- Mobile repo: `ivangemini/smart-fitness-app`
- Mobile `main`: `2ff71de222a0cc393ed41806978cce859c98b306` (PR #459 — RUI-1)
- Active mobile branch: `ui/responsive-primary-tabs` (RUI-2)
- Backend repo: `ivangemini/smart-fitness-backend`
- Backend `main`: `431998bfa85bf169fd68e98a7e46651f70cfa2d9` (PR #196)
- Backend PR #197 is open for secure private export storage/delivery source contracts.

The responsive UI program changes layout/presentation behavior only. Do not change business logic, persistence schemas, synchronization contracts, routes, completed workout data, or backend APIs as part of these packages.

## Canonical responsive contract

`docs/architecture/responsive-mobile-ui.md`

The contract intentionally does **not** ban all fixed pixel values. Fixed component geometry remains valid for icons, controls, touch targets, bounded media and the floating tab panel. The prohibited pattern is screen/device-specific pixel positioning of primary layout/actions.

## RUI-1 — merged

PR #459 merged to `main` as `2ff71de222a0cc393ed41806978cce859c98b306`.

It delivered:

1. `src/components/navigation/floatingTabBarLayout.ts` with shared floating-tab and sticky-action clearance calculations.
2. Focused unit tests for safe-area/minimum-offset/sticky-action/invalid-input behavior.
3. Nutrition diary clearance based on the floating tab bar rather than only `bottomInset + 24`.
4. Coach and Profile removal of independent `safeArea.bottom + 120` clearances.
5. Workouts Start/Resume CTA positioning from safe-area/navigation geometry.
6. Workouts scroll-content reservation for the sticky CTA.
7. Bounded shrink/wrap hardening on touched Workouts/Profile/Coach surfaces.
8. Phase 10 / RUI-1..RUI-6 in the canonical roadmap.

Exact-head Mobile CI #1830 passed line audits, TypeScript, **1392/1392 regression tests**, expanded sync smoke, Expo export and Expo Doctor.

## RUI-2 — current package

Implemented on `ui/responsive-primary-tabs`:

1. Home uses `getFloatingTabBarBottomClearance(...)` instead of `safeAreaInsets.bottom + 120`.
2. Home content has `flexGrow: 1` for short-screen reachability.
3. Home header title can shrink while the profile button keeps its 44x44 touch target.
4. Home summary hero can wrap; its calories badge and text no longer force horizontal overflow.
5. Home summary/stat/snapshot copy has explicit shrink behavior for narrow width and long localization.
6. Progress uses the same floating-tab clearance helper instead of `+120`.
7. Progress content has `flexGrow: 1`.
8. Progress weight hero can wrap its action rather than compress metric copy.
9. Progress measurement rows explicitly share width between long labels and values.
10. `LiquidGlassTabBar` now consumes `FLOATING_TAB_BAR_HEIGHT` and `FLOATING_TAB_BAR_MIN_BOTTOM_OFFSET`, removing duplicated `64`/`12` runtime geometry from the component.
11. Roadmap/current-status/handoff are synchronized with the merged RUI-1 baseline and current RUI-2 scope.

## Validation required for RUI-2

Run exact-head Mobile CI:

- repository file line audit;
- changed-file line limit;
- TypeScript;
- full regression suite;
- expanded sync model smoke;
- Expo export;
- Expo Doctor.

Do not claim physical-device proof from CI. Narrow/short-device, accessibility text size, software-keyboard, iPhone safe-area and Android navigation-inset evidence remains physical/runtime validation.

## Next mobile package — RUI-3

After RUI-2 validation/merge, audit and remediate:

- Workout Session;
- Workout Session Finish;
- New Routine;
- Workout Builder;
- Program Detail;
- Exercise Library/detail.

Priorities:

- keyboard overlap;
- short-screen reachability;
- set-table column compression;
- sticky bottom actions;
- long exercise names;
- safe-area ownership;
- preserving active workout/session persistence and existing workout business logic.

## Backend/P9-D continuity

Backend P9-D remains independent of this UI package.

Backend #192–#196 provide audit/idempotency, durable request persistence, preparation integration, bounded assembly execution and deterministic JSON artifact generation. Export remains fail closed and not product-available.

Backend PR #197 is the active source-contract package for private owner-scoped export storage/delivery lifecycle and authorization semantics. Do not overlap it from this mobile branch and do not activate provider/storage infrastructure implicitly.

## Prohibited implicit actions

Do not perform backend deployment, production migration execution, provider/storage activation, production data access, public/default export-route activation, real object-storage writes, OTA/EAS publication, native build/install, credential/DNS changes, destructive production cleanup or store submission without direct authorization.
