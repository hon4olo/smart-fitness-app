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
- VUX-3B / VUX-4A Nutrition diary affordances PR #473 → `158d3adb2b2e0a8fcc585951b8633b50260fc53c`.
- Active visual branch: `ui/add-food-affordance-icons`.
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
- EN/RU field-level errors explain why Save is unavailable.
- First blocking reason is exposed as the disabled Save accessibility hint.
- Confirmation, nutrition-target recalculation and persistence behavior are unchanged.

### VUX-3A — Home Summary — PR #471

- One owning accent/warning summary surface instead of nested cards.
- Calories is a flat status block.
- Current Weight and Streak are flat metrics below a divider.
- Values/calculations/warning conditions/order are unchanged.

### VUX-3B / VUX-4A — Nutrition diary affordances — PR #473

- Calendar emoji → Lucide CalendarDays.
- Meal Add / expand-collapse glyphs → Lucide Plus / ChevronDown / ChevronRight.
- Today has an explicit disabled background/border/text state instead of opacity-only treatment.
- Week-strip accessibility labels are localized in EN/RU.
- Retired glyph/disabled styles were removed and the diary source contract was updated.
- Diary data, date selection, meal expansion, Add Food routing, calculations and SectionList behavior are unchanged.

## VUX-4B — Add Food action icon consistency

**Status: active on `ui/add-food-affordance-icons`.**

Audit findings:

- Search clear still uses a raw `×` control glyph.
- Search/Favorites use raw `★ / ☆` favorite controls.
- Search/Recent/Favorites/Saved Meals use raw `+` quick-add controls.
- Saved Meals delete and Portion Sheet close use raw `×` controls.
- These controls already own appropriate 44 pt geometry/hit slop, so the defect is visual-language consistency rather than layout.

Current bounded remediation:

- Search clear and Portion Sheet close → Lucide X.
- Favorite states → Lucide Star with filled accent for the selected state.
- Quick-add controls → Lucide Plus.
- Saved Meal delete → Lucide Trash2 with the existing destructive semantics/accessibility label preserved.
- Keep localized Scan/Cancel/Close-style text actions as text where the word is clearer than an icon.
- Remove retired glyph-only text styles.
- Add a focused source-contract guard against reintroducing the old Add Food action glyphs.
- Preserve search/provider behavior, food data, favorites state, meal templates, portion logic, routes, persistence, sync and backend contracts.

**Merge gate:** full exact-head Mobile CI.

## Remaining hierarchy / validation review order

1. Re-audit Nutrition/Add Food hierarchy after VUX-4B; change containers only for a concrete hierarchy defect.
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

1. Finish VUX-4B Add Food action icon consistency and run full exact-head Mobile CI.
2. Merge only the validated VUX-4B head.
3. Re-audit Nutrition/Add Food hierarchy without automatically flattening legitimate content ownership.
4. Continue bounded visual hierarchy/validation work through Progress, Coach and Profile/Settings from concrete audit findings.
5. Keep backend, OTA/EAS/native/release and production/provider actions out of this autonomous UI sequence unless directly requested.