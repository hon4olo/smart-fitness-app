# Visual UX and information architecture roadmap

Updated: 2026-08-08

## Current checkpoint

- Mobile repo: `ivangemini/smart-fitness-app`
- Responsive Mobile UI Phase 10 is source/CI complete through RUI-6.
- RUI-5 merged in PR #467 as `45db592aa0470399a02dbadeadd30f36e2dab270`.
- RUI-6 focused responsive guardrails merged in PR #466 as `0ea861766a9bbea8611599d5f6e38e611fc91514` after full exact-head Mobile CI passed.
- Active visual branch: `ui/visual-primitives-p1`.
- Backend work is a separate workstream and is not part of this roadmap execution.

Source/CI completion is not physical-device proof. OTA/EAS publication, native build/install, production/provider activation and store/release actions remain separately authorization-gated.

## Product principles

- Keep the five primary tabs focused on daily actions: Home, Workouts, Nutrition, Progress, and Coach.
- Keep Profile available from the Home header instead of spending a permanent bottom-tab slot.
- Keep Profile focused on user summary, goal planning, and the Settings entry point.
- Keep Progress focused on recorded outcomes, trends, measurements, and recovery history.
- Keep every AI Coach action on the dedicated Coach screen.
- Keep account creation before plan onboarding; do not let signed-out users enter the normal app shell.
- Collect stable registration inputs once, then avoid duplicate editors in Coach.
- Never communicate disabled state through opacity alone; use an explicit surface/text/border treatment and retain a visible blocking reason or validation message where the product flow has one.
- Use one icon language across navigation and header actions. Temporary emoji/text glyphs are not final UI.
- Preserve minimum touch targets while polishing iconography or compact controls.
- Localize all user-facing copy in English and Russian.
- Preserve routes, persistence schemas, sync payloads, calculations and backend boundaries while restructuring presentation.

## Completed information architecture

- [x] Profile is removed from the public bottom tab bar.
- [x] A Profile control is available in the top-right of Home.
- [x] Coach replaces Profile as the fifth public tab.
- [x] Goal and plan editing moved from Progress to Profile.
- [x] Progress no longer renders goal or Coach planning controls.
- [x] The obsolete explanatory block was removed from Profile.
- [x] AI Coach actions moved to the dedicated Coach screen.
- [x] Height and training experience were removed from the Coach editor and moved into registration.
- [x] First launch presents Create account / Sign in before onboarding.
- [x] Post-registration onboarding collects age, current weight, activity level, goal and training days.
- [x] Goal saving requires confirmation that activity recommendations and nutrition targets will be recalculated.
- [x] Progress weight history uses the compact grid-and-column chart treatment.
- [x] Weight outbox identity lookup fails soft when cached session restoration is temporarily unavailable.
- [x] Auth, onboarding, Profile, Progress and Coach core copy is localized in English and Russian.
- [x] Responsive layout hardening covers primary and secondary audited surfaces with focused regression guardrails.

## VUX-1 — visual primitives and iconography

**Status: active.**

Current package on `ui/visual-primitives-p1`:

- replace the Profile settings text glyph with the same Lucide icon language already used by the floating bottom bar;
- replace opacity-only disabled styling in shared Primary, Secondary and Destructive buttons with explicit background/border/text states;
- keep loading visually distinct from a disabled/unavailable action;
- preserve existing button heights, touch targets, accessibility state, labels and callbacks.

Next iconography item after this bounded package:

- replace the remaining Home `👤` profile glyph with a Lucide user icon without changing the 44×44 control, route or accessibility label;
- audit remaining user-facing emoji/text-icon affordances and change only actual UI controls, not intentional content copy.

**Merge gate:** full exact-head Mobile CI.

## VUX-2 — disabled-control and validation clarity audit

**Status: queued.**

Audit callers after shared button styling is consistent:

- disabled actions must expose a nearby validation/blocking explanation when the reason is not self-evident;
- loading/busy must not look identical to permanently unavailable;
- destructive disabled actions must remain visually distinct from enabled destructive actions;
- do not introduce tooltip-only explanations that are inaccessible on touch devices.

Prioritize auth/onboarding, Workout save/finish, Nutrition create/save, Profile goals, Coach review/apply and Social publish/comment flows.

## VUX-3 — typography and visual hierarchy audit

**Status: queued.**

Review primary screens in this order:

1. Home;
2. Workouts hub + active session;
3. Nutrition diary/add-food;
4. Progress;
5. Coach;
6. Profile/Settings;
7. secondary Social/Safety/Recovery surfaces.

For each screen verify:

- one obvious primary action;
- section hierarchy is expressed by typography/spacing rather than extra containers;
- repeated cards do not create unnecessary visual noise;
- labels, metrics and actions preserve column relationships under EN/RU and Dynamic Type;
- accent color is used for interaction/state, not as decoration everywhere;
- empty/loading/error/success states belong to the same visual system.

Do not redesign business flows while performing this audit.

## VUX-4 — icon/action consistency

**Status: queued after the first hierarchy pass.**

- consolidate repeated header/back/settings/profile action treatments only where actual duplication justifies a shared primitive;
- keep Lucide sizing/stroke conventions consistent;
- preserve 44 pt minimum touch ownership for compact header actions;
- avoid replacing clear text actions with ambiguous icon-only controls.

## Localization and accessibility continuation

Continue EN/RU coverage for active Workout/Finish, remaining Workouts routes, Nutrition, Progress detail routes and advanced Coach routes.

Every touched visual package must consider:

- narrow width and short height;
- increased system text size;
- long Russian labels;
- focus/keyboard reachability for editable flows;
- VoiceOver/TalkBack role, label and disabled/busy state;
- contrast of normal, pressed, selected, disabled, warning and destructive states.

## Validation matrix

Automated source gate for runtime UI PRs:

- repository and changed-file line audits;
- TypeScript;
- full regression suite;
- expanded sync smoke;
- Expo export;
- Expo Doctor.

Runtime/release evidence, only when explicitly authorized:

- clean install and existing install;
- signed-out/signed-in/offline/expired-session states;
- English and Russian;
- small and large text sizes;
- narrow/short iPhone and modern safe areas;
- Android navigation/system insets;
- open keyboard on editable surfaces;
- populated, empty, error, disabled, loading and success states.

No source/CI result should be described as physical-device evidence.

## Next execution order

1. Finish VUX-1 shared disabled states + Profile settings icon and run full exact-head Mobile CI.
2. Merge only the validated head.
3. Replace the remaining Home profile emoji in a bounded iconography package and audit other actual header-control glyphs.
4. Run VUX-2 caller-level disabled/blocking-reason audit.
5. Start VUX-3 screen-by-screen hierarchy review, beginning with Home and Workouts.
6. Keep OTA/EAS/native/release actions out of this autonomous UI sequence unless directly requested.