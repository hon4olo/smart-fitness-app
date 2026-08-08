# Visual UX and information architecture roadmap

Updated: 2026-08-08

## Current checkpoint

- Mobile repo: `ivangemini/smart-fitness-app`
- Responsive Phase 10 is source/CI complete through RUI-6.
- VUX-1A PR #468 → `c6092048e3b94e7fc372c783a26668fa897428b0`.
- VUX-1B PR #469 → `511cb08e2e1ec6e3575b2fff35a482a570bdae28`.
- VUX-2A PR #470 → `a5983354d6850ed00ac5d79a0db91981ddee1faa`.
- VUX-3A Home Summary PR #471 → `a83d65d559f4542fa01e7a4588fb134b474a7346`.
- Active visual branch: `ui/profile-goal-validation-p1`.
- Backend work is a separate workstream and is explicitly outside this roadmap execution.

Source/CI completion is not physical-device proof. OTA/EAS publication, native build/install, provider/production activation and store/release actions remain separately authorization-gated.

## Product principles

- Keep the five public tabs focused on Home, Workouts, Nutrition, Progress and Coach.
- Keep Profile reachable from Home rather than spending a permanent bottom-tab slot.
- Keep Profile focused on user summary, goals and Settings; keep Progress focused on outcomes/trends.
- Keep AI Coach actions on the dedicated Coach surface.
- Use one Lucide icon language for action controls; temporary emoji/text control glyphs are not final UI.
- Preserve 44 pt minimum touch ownership for compact actions.
- Never communicate disabled state through opacity alone.
- When a disabled action is not self-explanatory, show the blocking reason next to the relevant field/action and expose it to accessibility.
- Prefer one clear owning surface over decorative card-within-card nesting.
- Preserve EN/RU localization and Dynamic Type/reflow behavior.
- Preserve routes, persistence, sync, calculations, workout/program lifecycle and backend contracts during visual work.

## Completed information architecture

- [x] Profile removed from the public bottom bar and exposed from Home.
- [x] Coach is the fifth public tab.
- [x] Goal editing lives in Profile rather than Progress.
- [x] AI Coach planning/actions live on Coach.
- [x] Registration/onboarding ownership is separated from normal app editing.
- [x] Core Home/Profile/Progress/Coach/Auth/Onboarding copy is EN/RU localized.
- [x] Responsive hardening covers audited primary and secondary surfaces with focused regression guardrails.

## VUX-1 — visual primitives and iconography

**Status: complete for the audited primary affordances.**

### VUX-1A — shared primitives — PR #468

Delivered:

- Lucide Settings in Profile;
- explicit disabled surface/border/text states for shared Primary, Secondary and Destructive buttons;
- loading remains visually distinct from disabled/unavailable.

### VUX-1B — primary affordances — PR #469

Delivered:

- Home profile emoji → Lucide User;
- Workouts History/Search/Start → Lucide History/Search/Play;
- Program-row `+ / ♡ / ▰` → Plus/Heart/Dumbbell;
- Workouts History uses shared floating-tab clearance instead of legacy `+58`;
- Search owns a 44 pt touch target;
- Create Program has explicit disabled styling and retains its required-name helper.

Further icon cleanup is audit-driven only. Do not replace intentional copy, exercise initials, mathematical symbols or clear text actions merely because they are not icons.

## VUX-2 — disabled-control and validation clarity

### VUX-2A — Active Workout Finish — PR #470

**Status: complete.**

Delivered:

- preserved the existing completed-set requirement for Finish;
- visible EN/RU blocking reason while unavailable;
- same reason exposed as accessibility hint;
- explicit disabled surface/border/text styling;
- 44 pt Finish touch target;
- Lucide ChevronDown / Timer / Ellipsis in the session header.

### VUX-2B — Profile Goals field validation

**Status: active on `ui/profile-goal-validation-p1`.**

Audit finding:

- Profile goal Save can be disabled because target weight, weekly weight change or training days are invalid, but the user receives no field-level explanation before Save becomes available.

Current bounded remediation:

- keep the exact existing validity boundaries:
  - target weight must be finite and greater than zero;
  - weekly change must be finite and zero or greater;
  - training days must be an integer from 1 through 7;
- derive Save disabled state from those same three conditions;
- render the corresponding EN/RU message through each existing `FormField.errorMessage`;
- expose the first blocking reason as the disabled Save accessibility hint;
- preserve goal confirmation, recalculation, nutrition-target update and persistence behavior.

**Merge gate:** full exact-head Mobile CI on the post-#471 `main`.

Remaining disabled-reason work must stay selective. Nutrition custom-food forms already expose field errors after validation and Progress measurement flows already have an error channel; do not add duplicate explanatory noise without a concrete missing-state finding.

## VUX-3 — visual hierarchy

### VUX-3A — Home Summary — PR #471

**Status: complete.**

Delivered:

- one owning accent/warning Home Summary surface;
- Calories changed from a nested surfaced badge to a flat status block;
- Current Weight and Streak changed from nested mini-cards to flat metrics below a subtle divider;
- all values, calculations, warning conditions and information order preserved;
- `QuickActionsCard` and `HomeSnapshotCard` intentionally left unchanged after source review because they represent distinct action/metric ownership.

### Next hierarchy review

1. Workouts hub and active session beyond the already-fixed header;
2. Nutrition diary / Add Food;
3. Progress;
4. Coach;
5. Profile / Settings;
6. secondary Social / Safety / Recovery.

For every reviewed surface verify:

- one obvious primary action;
- hierarchy expressed by typography/spacing rather than redundant containers;
- no unnecessary card-within-card nesting;
- EN/RU and Dynamic Type do not break metric/action relationships;
- accent color indicates interaction/state rather than decoration;
- loading/empty/error/success states belong to the same visual system.

Do not redesign business flows while performing hierarchy cleanup.

## VUX-4 — icon/action consistency

**Status: continuous, audit-driven.**

- consolidate repeated header/back/settings/profile actions only when actual duplication warrants a primitive;
- keep Lucide sizing/stroke conventions consistent;
- retain 44 pt touch ownership;
- do not replace clear text actions with ambiguous icon-only controls;
- icon cleanup never implies permission to change route or behavior.

## Validation matrix

For runtime UI PRs:

- repository and changed-file line audits;
- TypeScript;
- full regression suite;
- expanded sync smoke;
- Expo export;
- Expo Doctor.

Physical/release evidence, only when explicitly authorized:

- narrow and short phones;
- large system text / Dynamic Type;
- English and Russian;
- keyboard-open editable states;
- modern iPhone safe areas and Android navigation insets;
- populated, empty, disabled, loading, error and success states.

No source/CI result is physical-device evidence.

## Next execution order

1. Finish VUX-2B Profile Goals field-level validation and run exact-head Mobile CI.
2. Merge only the validated VUX-2B head.
3. Start the next VUX-3 hierarchy package with Workouts hub/active-session structure, changing only concrete source-audited visual defects.
4. Continue Nutrition, Progress, Coach and Profile/Settings hierarchy in bounded packages.
5. Continue VUX-4 icon consistency only from actual audit findings.
6. Keep backend, OTA/EAS/native/release and production/provider actions out of this autonomous UI sequence unless directly requested.
