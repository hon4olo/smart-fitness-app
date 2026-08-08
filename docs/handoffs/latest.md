# Latest Handoff

Updated: 2026-08-08

## Checkpoint

- Mobile repo: `ivangemini/smart-fitness-app`
- Mobile `main` at branch start: `60edb23de9cab90bbc4d4e23466a481bef2b94e6` (PR #458)
- Active mobile branch: `ui/responsive-layout-foundation`
- Backend repo: `ivangemini/smart-fitness-backend`
- Backend `main`: `431998bfa85bf169fd68e98a7e46651f70cfa2d9` (PR #196)
- Backend PR #197 is open for secure private export storage/delivery source contracts.

This handoff now covers the first explicit responsive mobile UI hardening package. The package changes layout/presentation behavior only; it does not change business logic, persistence schemas, synchronization contracts, routes, completed workout data, or backend APIs.

## RUI-1 package

Canonical responsive contract:

`docs/architecture/responsive-mobile-ui.md`

Implemented on the current branch:

1. Added `src/components/navigation/floatingTabBarLayout.ts` with bounded calculations for:
   - floating tab-bar bottom clearance;
   - sticky-action scroll-content clearance.
2. Added focused unit tests for safe-area/minimum-offset/sticky-action/invalid-input behavior.
3. Nutrition diary now reserves space for the floating tab bar instead of only `bottomInset + 24`.
4. Coach and Profile no longer use independent `safeArea.bottom + 120` bottom-clearance constants.
5. Workouts Start/Resume CTA now sits above the floating tab bar using safe-area/navigation geometry rather than `bottom: 0` plus a separate inset padding.
6. Workouts ScrollView/FlatList reserve enough bottom space for both floating navigation and the sticky CTA.
7. Touched Workouts/Profile/Coach text-heavy rows now allow bounded shrink/wrap behavior on narrow layouts.
8. The canonical roadmap now tracks Responsive Mobile UI Hardening as Phase 10 with RUI-1 through RUI-6.

## Audit finding that motivated the phase

Safe-area hooks were already present on many important screens, but navigation clearance had no single contract. Different screens compensated independently, including `+120`, `BottomTabInset + 84`, and `+24` patterns.

Do not replace those patterns with a blanket ban on fixed pixel values. Fixed dimensions remain valid for intentional component geometry such as icons, controls, touch targets, media aspect ratios and the floating tab panel. The prohibited pattern is device-specific pixel positioning of primary layout/actions.

## Next mobile package — RUI-2

After RUI-1 exact-head validation/review:

- Home: replace independent bottom navigation magic number and test header/card copy under narrow width and large text.
- Progress: replace independent bottom navigation magic number and test metric/action rows under width and text pressure.
- Re-check Nutrition final-row visibility and Workouts sticky-action clearance on a matching runtime.

Then continue RUI-3 for the active workout and creation flows:

- Workout Session;
- Workout Session Finish;
- New Routine;
- Workout Builder;
- Program Detail;
- Exercise Library/detail.

RUI-3 priorities are keyboard overlap, short-screen reachability, set-table compression, sticky actions, long exercise names and safe-area ownership.

## Validation required for RUI-1

Run exact-head Mobile CI:

- repository/changed-file line limits;
- TypeScript;
- full regression suite;
- expanded sync-intent smoke runner;
- Expo export;
- Expo Doctor.

Also review the responsive validation matrix in `docs/architecture/responsive-mobile-ui.md`.

Do not claim physical-device proof from CI. Narrow/short-device, accessibility text size, software-keyboard, iPhone safe-area and Android navigation-inset evidence remains physical/runtime validation.

## Backend/P9-D continuity

Backend P9-D remains independent of this UI package.

Backend #192–#196 provide audit/idempotency, durable request persistence, preparation integration, bounded assembly execution and deterministic JSON artifact generation. Export remains fail closed and not product-available.

Backend PR #197 is the active source-contract package for private owner-scoped export storage/delivery lifecycle and authorization semantics. Do not overlap it from this mobile branch and do not activate provider/storage infrastructure implicitly.

## Prohibited implicit actions

Do not perform backend deployment, production migration execution, provider/storage activation, production data access, public/default export-route activation, real object-storage writes, OTA/EAS publication, native build/install, credential/DNS changes, destructive production cleanup or store submission without direct authorization.
