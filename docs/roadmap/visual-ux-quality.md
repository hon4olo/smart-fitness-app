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
- VUX-4B Add Food action affordances PR #474 → `5eaa389328e3c649b63833fcf511484e7e2321b4`.
- VUX-3C Progress measurement hierarchy PR #475 → `afcb93924d1d7fc2c74cbe18122495eaf5300aea`.
- VUX-3D Progress weight action ownership PR #476 → `fd361bc5eaf10a2be8054488d9a0cbc6cbcfa41a`.
- VUX-3E Progress compact selector touch targets PR #477 → `b58356f5b814b076c964ef249f4a0cc12c30dffd`.
- VUX-4C Coach input touch targets PR #478 → `8e73fcb76b77c834b81c63d998d6dfa1f85b0524`.
- Active visual branch: `ui/coach-review-touch-targets`.
- Backend is a separate workstream and remains outside this roadmap execution.

Source/CI completion is not physical-device proof. OTA/EAS publication, native build/install, provider/production activation and store/release actions remain separately authorization-gated.

## Product principles

- Keep the public tabs focused on Home, Workouts, Nutrition, Progress and Coach.
- Use one Lucide icon language for action controls; do not replace intentional content symbols merely because they are not icons.
- Preserve at least 44 pt touch ownership through control size or hit slop.
- Never communicate disabled state through opacity alone.
- When a disabled action is not self-explanatory, show the blocking reason near the relevant field/action and expose it to accessibility.
- Prefer one clear owning surface over decorative card-within-card nesting.
- Give each destination/action one clear owner inside a surface; do not duplicate the same route under different labels.
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

### VUX-4B — Add Food action icon consistency — PR #474

- Search clear and Portion Sheet close → Lucide X.
- Favorite controls → Lucide Star with selected fill.
- Quick-add controls → Lucide Plus.
- Saved Meal delete → Lucide Trash2.
- Existing 44 pt control geometry/hit slop and localized labels are preserved.
- Clear localized text actions such as Scan/Cancel remain text.
- Retired glyph-only styles were removed and a focused source-contract guard was added.
- Search/provider behavior, food data, favorites, meal templates, portion logic, routes, persistence and sync are unchanged.

### VUX-3C — Progress body-measurement hierarchy — PR #475

- Body Measurements keeps one owning `AppCard`; the editor is flat content inside it.
- A quiet hairline divider separates the editor instead of a nested raised/bordered card.
- Metric radio choices explicitly own a 44 pt minimum touch height; unit controls remain 48 pt.
- A focused source-contract guard protects hierarchy/touch ownership.
- Measurement model, supported units/ranges, analytics, persistence and sync remain unchanged.

### VUX-3D — Progress weight action ownership — PR #476

- `Weight details` beside the weight hero is the sole `/weight-details` owner on the Progress screen.
- The duplicate `Training details` button was removed.
- `Add weight` remains the only bottom action under the weight chart.
- A focused source-contract guard requires exactly one `/weight-details` push.
- Weight analytics, chart/range behavior, routes, persistence and sync remain unchanged.

### VUX-3E — Progress compact selector touch targets — PR #477

- Weight range tabs explicitly own a 44 pt minimum height while preserving tablist/tab semantics.
- Safety & Recovery period chips in both historical Progress surfaces now own a 44 pt minimum height.
- Weekly Safety selected-history filter chips now own a 44 pt minimum height.
- Selection/history semantics, period definitions, chart data and routes are unchanged.
- A focused source-contract guard protects the compact control geometry.

### VUX-4C — Coach input touch targets — PR #478

- Recovery score controls now own a 44 pt minimum height.
- Recovery `Clear` owns a 44 pt Pressable surface and exposes its disabled accessibility state.
- Recovery and Limitations back controls now use 44 × 44 geometry.
- Limitation movement chips explicitly own a 44 pt minimum height.
- Recovery scoring, required signals, limitation state transitions, routes, persistence and sync remain unchanged.
- A focused source-contract guard protects the interaction geometry.

## VUX-4D — Coach review touch targets

**Status: active on `ui/coach-review-touch-targets`.**

Audit findings:

- Safety & Recovery review back navigation uses 42 × 42 geometry.
- Safety & Recovery review period controls use `minHeight: 42`.
- Combined review back navigation uses 42 × 42 geometry.
- These controls already have explicit state/selection behavior; the defect is interaction geometry, not business logic.

Current bounded remediation:

- Safety & Recovery review back → 44 × 44.
- Safety & Recovery review period controls → `minHeight: 44`.
- Combined review back → 44 × 44.
- Add a focused source-contract guard.
- Keep raw back glyph/icon-language migration separate from this geometry-only package.
- Do not change review calculations, period semantics, generation behavior, routes, persistence, sync or backend contracts.

**Merge gate:** full exact-head Mobile CI.

## Remaining hierarchy / validation review order

1. Finish Coach review touch-target package.
2. Fix remaining inline-heavy Coach back geometry in Preflight and Combined Proposal as a separate bounded package.
3. Harden Coach history filter pills from the source-audited compact-control finding.
4. Audit repeated raw Coach back glyphs/navigation presentation as a separate visual-language package.
5. Profile / Settings.
6. Secondary Social surfaces.
7. Return to Workouts/Nutrition/Progress only for concrete audited defects.

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

1. Finish VUX-4D Coach review touch targets and run full exact-head Mobile CI.
2. Merge only the validated VUX-4D head.
3. Continue with Preflight/Combined Proposal back geometry, then Coach history filters.
4. Keep back icon migration separate and audit-driven.
5. Keep backend, OTA/EAS/native/release and production/provider actions out of this autonomous UI sequence unless directly requested.
