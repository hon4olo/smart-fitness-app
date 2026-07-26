# Visual UX and information architecture roadmap

Updated: 2026-07-26

## Product principles

- Keep the five primary tabs focused on daily actions: Home, Workouts, Nutrition, Progress, and Coach.
- Keep Profile available from the Home header instead of spending a permanent bottom-tab slot.
- Keep Profile focused on user summary, goal planning, and the Settings entry point.
- Keep Progress focused on recorded outcomes, trends, measurements, and recovery history.
- Keep every AI Coach action on the dedicated Coach screen.
- Keep account creation before plan onboarding; do not let signed-out users enter the normal app shell.
- Collect stable registration inputs once, then avoid duplicate editors in Coach.
- Never communicate disabled state through opacity alone; show the blocking reason or validation message.
- Localize all user-facing copy in English and Russian.
- Preserve persistence schemas, sync payloads, and backend boundaries while restructuring presentation.

## Completed information architecture

- [x] Profile is removed from the public bottom tab bar.
- [x] A Profile control is available in the top-right of Home.
- [x] Coach replaces Profile as the fifth public tab.
- [x] Goal and plan editing moved from Progress to Profile.
- [x] Progress no longer renders goal or Coach planning controls.
- [x] The obsolete explanatory block was removed from Profile.
- [x] AI Coach actions moved to the dedicated Coach screen.
- [x] Height and training experience were removed from the Coach editor and moved into registration.
- [x] First launch now presents Create account / Sign in before onboarding.
- [x] Post-registration onboarding collects age in years, current weight, explained activity level, goal, and training days.
- [x] Goal saving requires confirmation that activity recommendations and nutrition targets will be recalculated.
- [x] Progress weight history uses a compact grid-and-column chart treatment.
- [x] Weight outbox identity lookup fails soft when cached session restoration is temporarily unavailable.
- [x] New auth, onboarding, Profile, Progress, and Coach copy is localized in English and Russian.

## P0 — release validation

- Run TypeScript, the complete test suite, Expo Doctor, and export validation.
- Verify the first-launch authentication choice on a clean install.
- Verify registration persists height and training experience before onboarding.
- Verify onboarding cannot be opened while signed out.
- Verify an existing signed-in user with completed onboarding enters Home without seeing registration again.
- Verify Profile opens from the Home header and is absent from the bottom bar.
- Verify Coach is the fifth tab and every Coach route remains reachable.
- Verify goal save confirmation, nutrition-target recalculation, and persistence after relaunch.
- Verify adding weight no longer shows a false local-outbox failure when session lookup fails transiently.
- Verify the new chart with 2, 4, and 7+ weight entries on a physical iPhone.

## P1 — follow-up polish

- Replace temporary emoji tab/header glyphs with the project-standard icon component when the shared icon treatment is consolidated.
- Add an explicit Profile editor for registration-derived height and training experience without duplicating them in Coach.
- Decide whether approximate age storage should migrate from a January 1 date-of-birth surrogate to a dedicated age/year field in a future schema version.
- Add feature-scoped synchronization feedback near weight entry instead of relying only on the global mutation notice.
- Continue Russian localization for active workout/finish, remaining Workouts routes, Nutrition, Progress detail routes, and advanced Coach routes.
- Continue the disabled-control and dynamic-type audit across all tabs.

## Validation matrix

- Clean install, existing install, signed-out, signed-in, offline, expired-session, and transient secure-storage failure.
- English and Russian.
- Small and large text sizes.
- Registration, login, onboarding, relaunch, and logout.
- Home Profile shortcut, hidden Profile tab, visible Coach tab, Settings navigation.
- Goal edit, confirmation cancel, confirmation save, nutrition recalculation, persistence.
- Weight create/update/delete, queue retry, no duplicate outbox operation, and no false failure banner.
- Progress chart with equal values, narrow range, rising/falling values, and long localized date labels.
- No data loss, no persistence schema change, no backend deployment, and no native/runtime change.

## Next execution order

1. Complete automated validation and repair any TypeScript/test regressions from this slice.
2. Merge the exact validated PR head with an `[ota]` merge title.
3. Verify the production iOS EAS Update reports runtime `1.0.2` and a new update ID.
4. Perform physical-iPhone smoke validation in Russian and English.
5. Record device evidence and any remaining visual defects in this roadmap.
