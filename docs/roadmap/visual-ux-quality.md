# Visual UX and information architecture roadmap

Updated: 2026-08-08

## Current checkpoint

- Mobile repo: `ivangemini/smart-fitness-app`
- Responsive Phase 10 is source/CI complete through RUI-6.
- VUX-1A PR #468 → `c6092048e3b94e7fc372c783a26668fa897428b0`.
- VUX-1B PR #469 → `511cb08e2e1ec6e3575b2fff35a482a570bdae28`.
- VUX-2A PR #470 → `a5983354d6850ed00ac5d79a0db91981ddee1faa`.
- VUX-3A Home Summary PR #471 → `a83d65d559f4542fa01e7a4588fb134b474a7346`.
- VUX-2B Profile Goals PR #472 → `1d717b114faefbac3101ff0c340554d53a7651bd`.
- Active visual branch: `ui/nutrition-affordance-p1`.
- Backend is a separate workstream and remains outside this roadmap execution.

Source/CI completion is not physical-device proof. OTA/EAS publication, native build/install, provider/production activation and store/release actions remain separately authorization-gated.

## Product principles

- Keep the public tabs focused on Home, Workouts, Nutrition, Progress and Coach.
- Use one Lucide icon language for action controls; do not replace intentional content symbols merely because they are not icons.
- Preserve at least 44 pt touch ownership through control size or hit slop.
- Never communicate disabled state through opacity alone.
- When a disabled action is not self-explanatory, show the blocking reason near the relevant field/action and expose it to accessibility.
- Prefer one clear owning surface over decorative card-within-card nesting.
- Preserve EN/RU localization, Dynamic Type/reflow, routes, persistence, sync, calculations and backend contracts during visual work.

## Completed visual packages

### VUX-1A — shared primitives — PR #468

- Lucide Settings in Profile.
- Explicit disabled surface/border/text states for shared Primary, Secondary and Destructive buttons.
- Loading remains visually distinct from disabled/unavailable.

### VUX-1B — primary affordances — PR #469

- Home profile emoji → Lucide User.
- Workouts History/Search/Start → Lucide History/Search/Play.
- Program-row action glyphs → Plus/Heart/Dumbbell.
- History uses shared floating-tab clearance; Search owns a 44 pt touch target.
- Create Program retains its required-name helper with an explicit disabled state.

### VUX-2A — Active Workout Finish — PR #470

- Existing completed-set requirement preserved.
- Visible EN/RU blocking reason + accessibility hint.
- Explicit disabled state and 44 pt Finish target.
- Session header controls use Lucide ChevronDown/Timer/Ellipsis.

### VUX-2B — Profile Goals — PR #472

- Existing validity boundaries preserved: target weight > 0, weekly change >= 0, training days integer 1–7.
- EN/RU field-level FormField errors now explain why Save is unavailable.
- First blocking reason is exposed as the disabled Save accessibility hint.
- Confirmation, nutrition-target recalculation and persistence behavior are unchanged.

### VUX-3A — Home Summary — PR #471

- One owning accent/warning summary surface instead of nested cards.
- Calories is a flat status block.
- Current Weight and Streak are flat metrics below a divider.
- Values/calculations/warning conditions/order are unchanged.

## VUX-3B / VUX-4 — Nutrition diary affordances

**Status: active on `ui/nutrition-affordance-p1`.**

Audit findings:

- Calendar is an emoji control rather than the established Lucide action language.
- Meal Add and expand/collapse controls use text glyphs (`+`, `▾`, `▸`).
- Today communicates disabled state through `opacity: 0.35` only.
- Week-strip accessibility labels are hardcoded in English despite EN/RU localization.
- Meal-type markers (`○ ◇ □ △`) are semantic content markers and are intentionally not replaced.

Current bounded remediation:

- Calendar → Lucide CalendarDays while preserving route/accessibility label and existing hit slop.
- Meal Add → Lucide Plus; expand/collapse → Lucide ChevronDown/ChevronRight; existing hit slop preserves touch ownership.
- Today uses explicit disabled background/border/text rather than opacity-only styling.
- Week-strip accessibility text is generated from the EN/RU Nutrition diary copy.
- Diary data, date selection, meal expansion, Add Food routing, nutrition calculations, SectionList virtualization and meal-type markers remain unchanged.

**Merge gate:** full exact-head Mobile CI.

## Remaining hierarchy / validation review order

1. Re-audit Nutrition hierarchy after the affordance package; change containers only if a real hierarchy defect remains.
2. Progress.
3. Coach.
4. Profile / Settings.
5. Secondary Social / Safety / Recovery.
6. Return to Workouts only for concrete audited defects; do not redesign the hub merely to satisfy roadmap order.

For each surface verify one obvious primary action, restrained surface nesting, EN/RU/Dynamic Type resilience, consistent interaction states and coherent loading/empty/error/success presentation.

## Validation matrix

Runtime UI PRs require exact-head:

- repository and changed-file line audits;
- TypeScript;
- full regression suite;
- expanded sync smoke;
- Expo export;
- Expo Doctor.

Physical/release evidence remains separately authorization-gated: narrow/short phones, large text, EN/RU, keyboard-open states, iPhone safe areas, Android system insets, and populated/empty/disabled/loading/error/success states.

No source/CI result is physical-device evidence.

## Next execution order

1. Finish Nutrition affordance/accessibility cleanup and run full exact-head Mobile CI.
2. Merge only the validated head.
3. Re-audit Nutrition hierarchy without automatically flattening legitimate metric/meal ownership.
4. Continue bounded visual hierarchy/validation work through Progress, Coach and Profile/Settings from concrete audit findings.
5. Keep backend, OTA/EAS/native/release and production/provider actions out of this autonomous UI sequence unless directly requested.
