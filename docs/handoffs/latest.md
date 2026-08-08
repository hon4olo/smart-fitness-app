# Latest Handoff

Updated: 2026-08-08

## Checkpoint

- Mobile repo: `ivangemini/smart-fitness-app`
- Mobile `main` at RUI-3 start: `ad5976f9c068c5661afb0ebd4b7b8cf164cab1b6` (PR #461 — RUI-2 merge checkpoint)
- Active mobile branch: `ui/rui3-active-session` (RUI-3A)
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

## RUI-2 — merged

PR #460 merged to `main` as `740ae06d24c895e882a37e715b59ce47e599ab5d`.

It delivered:

1. Home uses `getFloatingTabBarBottomClearance(...)` instead of `safeAreaInsets.bottom + 120`.
2. Home content has `flexGrow: 1` for short-screen reachability.
3. Home header title can shrink while the profile button keeps its 44x44 touch target.
4. Home summary hero can wrap; its calories badge and text no longer force horizontal overflow.
5. Home summary/stat/snapshot copy has explicit shrink behavior for narrow width and long localization.
6. Progress uses the same floating-tab clearance helper instead of `+120`.
7. Progress content has `flexGrow: 1`.
8. Progress weight hero can wrap its action rather than compress metric copy.
9. Progress measurement rows explicitly share width between long labels and values.
10. `LiquidGlassTabBar` consumes `FLOATING_TAB_BAR_HEIGHT` and `FLOATING_TAB_BAR_MIN_BOTTOM_OFFSET`, removing duplicated `64`/`12` runtime geometry from the component.
11. Roadmap/current-status/handoff are synchronized around RUI-1/RUI-2 completion and the RUI-3 next step.

Exact-head Mobile CI #1832 passed repository/changed-file line audits, TypeScript, the full regression suite, expanded sync model smoke, Expo export and Expo Doctor.

## RUI-3A — current package

The audit found two concrete high-frequency layout failures:

- `SessionSetTable` had a preferred/fixed width of **358 px**, wider than the content area available on common narrow phones after active-session screen padding;
- Workout Session Finish used `paddingBottom: insets.bottom + 176` as an independent guess for an absolute Save/Share footer whose real height can change with safe area, localization and Dynamic Type.

Implemented on `ui/rui3-active-session`:

1. The set table is now `width: '100%'` with `maxWidth: 358`, preserving the established wide-screen geometry.
2. Previous/weight/reps consume the remaining width proportionally; Set and completion retain fixed bounded columns and the existing intentional gaps.
3. Header cells and set rows use the same flexible ownership so labels and inputs remain aligned.
4. RPE badge positioning is moved inward so the badge remains attached to the reps cell as that cell narrows.
5. Active-session `ScrollView` uses automatic keyboard insets plus interactive keyboard dismissal.
6. Exercise titles allow two lines; collapsed set copy owns flexible width instead of competing with fixed markers/menu controls.
7. Session-header back/timer controls have usable bounded touch widths; Finish can grow vertically/horizontally instead of clipping localized text; stat labels/values can shrink within their own columns.
8. Workout Session Finish is wrapped in `KeyboardAvoidingView` so Save/Share move with the usable viewport while inputs are active.
9. Finish footer height is measured with `onLayout`; scroll content reserves that measured height plus spacing instead of `176`.
10. Finish header, info rows, integration rows, inputs and action labels have explicit shrink/min-width rules under text pressure.
11. No workout/session persistence, save/discard semantics, routing, sync, calculations or completed-history behavior changed.

## Validation required for RUI-3A

Run exact-head Mobile CI:

- repository and changed-file line limits;
- TypeScript;
- full regression suite;
- expanded sync-intent smoke;
- Expo export;
- Expo Doctor.

Do not claim physical-device proof from CI. Narrow/short-device, accessibility text size, software-keyboard, iPhone safe-area and Android navigation-inset evidence remains physical/runtime validation.

## Next package after RUI-3A — RUI-3B

Audit and remediate:

- New Routine;
- Workout Builder plus workout picker/editor modals;
- Program Detail;
- Exercise Library/detail.

Priorities:

- keyboard reachability;
- short-screen scrolling;
- sticky-footer measurement rather than screen-local guessed clearance;
- long exercise/workout/program names;
- safe-area ownership;
- preserving FlatList virtualization in Exercise Library;
- preserving workout/program persistence and route semantics.

## Later responsive packages

- RUI-4: auth, onboarding, settings and Nutrition forms.
- RUI-5: remaining secondary Coach/Social/Progress surfaces.
- RUI-6: focused automated guardrails for proven responsive regressions after the remediation inventory stabilizes.

## Backend/P9-D continuity

Backend P9-D remains independent of this UI program.

Backend #192–#196 provide audit/idempotency, durable request persistence, preparation integration, bounded assembly execution and deterministic JSON artifact generation. Export remains fail closed and not product-available.

Backend PR #197 is the active source-contract package for private owner-scoped export storage/delivery lifecycle and authorization semantics. Do not overlap it from mobile responsive work and do not activate provider/storage infrastructure implicitly.

## Prohibited implicit actions

Do not perform backend deployment, production migration execution, provider/storage activation, production data access, public/default export-route activation, real object-storage writes, OTA/EAS publication, native build/install, credential/DNS changes, destructive production cleanup or store submission without direct authorization.
