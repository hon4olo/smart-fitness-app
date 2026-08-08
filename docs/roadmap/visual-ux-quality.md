# Visual UX and information architecture roadmap

Updated: 2026-08-08

## Current checkpoint

- Mobile repo: `ivangemini/smart-fitness-app`
- Responsive Mobile UI Phase 10 is source/CI complete through RUI-6.
- RUI-5 merged in PR #467 as `45db592aa0470399a02dbadeadd30f36e2dab270`.
- RUI-6 focused responsive guardrails merged in PR #466 as `0ea861766a9bbea8611599d5f6e38e611fc91514` after full exact-head Mobile CI passed.
- VUX-1A shared visual primitives merged in PR #468 as `c6092048e3b94e7fc372c783a26668fa897428b0` after full exact-head Mobile CI passed.
- VUX-1B primary action affordances merged in PR #469 as `511cb08e2e1ec6e3575b2fff35a482a570bdae28` after full exact-head Mobile CI passed.
- VUX-2A Active Workout header/Finish clarity merged in PR #470 as `a5983354d6850ed00ac5d79a0db91981ddee1faa` after full exact-head Mobile CI passed.
- Active visual branch: `ui/home-hierarchy-p1`.
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
- Use one icon language across navigation and action controls. Temporary emoji/text glyphs are not final UI.
- Preserve minimum touch targets while polishing iconography or compact controls.
- Prefer one clear surface hierarchy over card-within-card decoration when nested surfaces do not represent distinct interaction or ownership.
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

### VUX-1A — shared primitives

**Status: complete.**

PR #468 merged as `c6092048e3b94e7fc372c783a26668fa897428b0`.

Delivered:

- Profile Settings text glyph replaced with a Lucide Settings icon while preserving the 44×44 control and route;
- Primary, Secondary and Destructive shared buttons use explicit disabled surface/border/text states instead of opacity-only styling;
- loading remains visually distinct from disabled/unavailable;
- button heights, callbacks and accessibility state remain unchanged.

### VUX-1B — primary action affordances

**Status: complete.**

PR #469 merged as `511cb08e2e1ec6e3575b2fff35a482a570bdae28`.

Delivered:

- Home profile `👤` → Lucide User while preserving the 44×44 button, route and accessibility label;
- Workouts History `↺` → Lucide History and moved from legacy `insets.bottom + 58` to shared floating-tab clearance;
- Workouts Search `⌕` → Lucide Search with a 44 pt touch target;
- Workouts Start/Resume `▶` → Lucide Play without changing the action or sticky-footer geometry;
- Program rows replace `+ / ♡ / ▰` control glyphs with Lucide Plus / Heart / Dumbbell;
- Create Program uses an explicit disabled surface/text state while preserving the visible required-name helper;
- responsive source-contract coverage prevents Workouts History from returning to the legacy `+58` placement.

Remaining icon cleanup is audit-driven. Do not replace intentional copy, exercise initials, mathematical symbols, or clear text actions merely because they are not icons.

## VUX-2 — disabled-control and validation clarity audit

### VUX-2A — Active Workout header and Finish state

**Status: complete.**

PR #470 merged as `a5983354d6850ed00ac5d79a0db91981ddee1faa`.

Delivered:

- preserved the existing rule that Finish becomes available only after at least one completed set;
- added a visible localized EN/RU blocking reason while Finish is unavailable and exposed it as the accessibility hint;
- replaced opacity-only Finish disabled styling with explicit surface/border/text states;
- raised Finish to a 44 pt minimum touch target;
- replaced the hand-built chevron/stopwatch and `•••` glyph with Lucide ChevronDown / Timer / Ellipsis;
- preserved workout draft, completion count, finish route, overflow behavior and timer logic.

### VUX-2B — remaining caller-level disabled reasons

**Status: audited selectively; follow-up remains queued.**

Confirmed candidate:

- Profile goal Save can become disabled because target weight, weekly change or training days are invalid without currently showing the specific blocking reason.

Do not mass-edit every disabled button. Nutrition custom-food inputs already expose field errors on submit, and Progress measurement forms already carry an error channel; those surfaces should change only if parent-level review shows a real missing explanation.

Rules:

- disabled actions must expose a nearby validation/blocking explanation when the reason is not self-evident;
- loading/busy must not look identical to permanently unavailable;
- destructive disabled actions must remain visually distinct from enabled destructive actions;
- do not introduce tooltip-only explanations that are inaccessible on touch devices;
- do not add explanatory noise when the reason is already obvious and visible.

## VUX-3 — typography and visual hierarchy audit

### VUX-3A — Home summary hierarchy

**Status: active on `ui/home-hierarchy-p1`.**

Audit finding:

- `HomeSummaryCard` nested a surfaced calories badge and two surfaced mini-stat cards inside an already surfaced accent `AppCard`, producing unnecessary card-within-card noise in the first visual block on Home.

Current bounded remediation:

- preserve every current prop, value, calculation, warning condition and information order;
- keep one accent/warning hero `AppCard` as the owning surface;
- render Calories as a flat status block rather than another card;
- render Current Weight and Streak as flat metrics below a subtle divider rather than separate inner cards;
- retain wrapping/shrink ownership for narrow screens and long localized text;
- do not change `HomeSnapshotCard` automatically; evaluate it separately after this package.

**Merge gate:** full exact-head Mobile CI. Do not mark VUX-3A complete until the validated head merges.

### Remaining hierarchy review order

1. Home Snapshot / Quick Actions only if the post-VUX-3A audit still shows redundant hierarchy;
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

**Status: continuous audit-driven cleanup.**

- consolidate repeated header/back/settings/profile action treatments only where actual duplication justifies a shared primitive;
- keep Lucide sizing/stroke conventions consistent;
- preserve 44 pt minimum touch ownership for compact header actions;
- avoid replacing clear text actions with ambiguous icon-only controls;
- treat icon-only replacements as visual changes, not permission to change routes or behavior.

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

1. Finish VUX-3A Home Summary hierarchy and run full exact-head Mobile CI.
2. Merge only the validated VUX-3A head.
3. Re-audit Home as a whole; touch Snapshot or Quick Actions only if the remaining hierarchy is still unnecessarily noisy.
4. Implement the confirmed Profile Goals validation-reason fix as a bounded VUX-2B package.
5. Continue VUX-3 screen-by-screen with Workouts and Nutrition.
6. Continue VUX-4 icon consistency only where the audit finds actual temporary control glyphs or inconsistent action treatment.
7. Keep OTA/EAS/native/release actions and all backend work out of this autonomous UI sequence unless directly requested.