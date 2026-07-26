# Visual UX and information architecture roadmap

Updated: 2026-07-26

## Product principles

- Keep primary tabs focused on user goals and daily actions.
- Keep Profile as a concise identity and summary surface, with a Settings icon in the header.
- Move account, personal details, language, appearance, units, sync, privacy, runtime diagnostics, and developer tools into Settings.
- Keep goal planning, progress inputs, and AI Coach controls together in Progress.
- Never communicate disabled state through opacity alone; show the blocking reason or validation message.
- Keep onboarding as a first-run/account-creation flow, not a permanent Home card.
- Localize all user-facing copy in English and Russian; technical labels may remain inside an explicitly developer-only section.
- Preserve current business logic, persistence schemas, sync contracts, and backend boundaries while restructuring presentation.

## Completed visual architecture

- [x] Profile has a top-right Settings control.
- [x] Account actions were removed from Profile and live in Settings.
- [x] Developer tools, OTA runtime metadata, and reset onboarding live only in Settings.
- [x] Goal editing moved from Profile to Progress.
- [x] AI Coach profile and secondary Coach routes moved from Profile to Progress.
- [x] Date of birth and calculation formula have one canonical Settings editor.
- [x] Date of birth and calculation formula are no longer duplicated in the Coach form.
- [x] Coach validation reads those identity inputs from the stored profile.
- [x] The large Home cloud-queue failure overlay was replaced by a compact recoverable status.
- [x] Quick Setup moved to a dedicated first-run route.
- [x] Home shell received the initial Russian localization and density pass.

## P0 — remaining broken or misleading states

- Audit every disabled primary action and keep a visible explanation next to it.
- Verify Coach profile persistence after force-close and relaunch on a physical iPhone.
- Verify personal-details persistence and revisioned fitness-profile synchronization while signed in.
- Verify signed-out personal details remain local and survive restart.
- Verify queue-failure recovery does not duplicate a fitness-profile mutation.

## P1 — localization

- [x] Centralize and complete Settings, Account, Privacy, About, sync validation, alerts, diagnostics, and recovery copy in PR #147.
- [x] Complete Profile summary, Progress overview/planning, Goals, AI Coach profile, body-measurement entry, charts, and Safety & Recovery card localization in PR #148.
- Complete Russian localization for Home/onboarding, Workouts, Nutrition, Progress detail routes, and advanced Coach.
- Remove mixed-language headings from Progress and Coach secondary routes.
- Keep terminology consistent across tabs: goal, target weight, training days, synchronization, recovery, and Coach.

## P1 — Profile and Settings polish

- Replace the temporary text-based Settings glyph with the project-standard icon component when the shared icon treatment is consolidated.
- Keep Profile limited to concise user-facing summary content.
- Keep destructive account actions isolated inside the Account section in Settings.
- Keep Developer tools collapsed by default and at the bottom of Settings.
- Add clear saved/loading/failure feedback to personal-details and Coach mutations.

## P1 — Progress planning hierarchy

- Keep Goal and AI Coach sections collapsed by default.
- Present planning controls before historical charts without allowing them to dominate the screen.
- Split Progress into focused components before the route approaches the 500-line limit.
- [x] Localize weight, body-measurement, training-progress, and Safety & Recovery overview cards in PR #148.

## P2 — screen density and hierarchy

- Reduce repeated cards, duplicated headings, and explanatory copy already implied by controls.
- Use one dominant action per card and avoid multiple equal-weight CTAs.
- Collapse advanced Coach and diagnostic information by default.
- Keep error notices compact and attached to the affected feature rather than overlaying unrelated content.

## Validation matrix

- iPhone physical-device checks in English and Russian.
- First-run onboarding, completed onboarding, signed-out, signed-in, offline, queue failure, and retry-success states.
- Settings gear placement and navigation from Profile.
- Account actions available in Settings and absent from Profile.
- Goals and AI Coach available in Progress and absent from Profile.
- Personal details save, Coach save, force-close, relaunch, and sync retry.
- Small and large text, keyboard open, loading, validation error, and disabled actions.
- Verify no data loss, no schema changes, no duplicate sync operations, and no regression in account deletion or recovery.

## Next execution order

1. Physical-iPhone validation of the new Profile / Settings / Progress structure.
2. Verify Coach and personal-details persistence after force-close and relaunch.
3. Continue localization with Home/onboarding, then Workouts and Nutrition.
4. Add explicit saved/loading/failure feedback for profile mutations.
5. Continue the transparent/disabled control audit across all tabs.
6. Complete the remaining visual-density pass and update this roadmap with device evidence.
