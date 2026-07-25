# Visual UX and information architecture roadmap

Updated: 2026-07-26

## Product principles

- Keep primary tabs focused on user goals and daily actions.
- Move account, language, appearance, units, sync, privacy, runtime diagnostics, and developer tools into Settings.
- Use progressive disclosure for secondary profile and Coach fields.
- Never communicate disabled state through opacity alone; show the blocking reason or validation message.
- Keep onboarding as a first-run/account-creation flow, not a permanent Home card.
- Localize all user-facing copy in English and Russian; technical labels may remain inside an explicitly developer-only section.
- Preserve current business logic, persistence schemas, sync contracts, and backend boundaries while restructuring presentation.

## P0 — broken or misleading states

- Fix onboarding completion so a successful local save is not followed by a blocking cloud-queue failure overlay.
- Keep the protected retry operation available in Settings > Data & Sync, not as a dominant Home banner.
- Audit buttons and segmented controls that appear transparent or inactive; distinguish disabled, loading, unavailable, and selected states.
- Ensure every disabled primary action has an adjacent validation explanation.

## P1 — Profile and Settings information architecture

- Profile contains account summary, current goal, compact body/training summary, and entry points to edit details.
- Move Sync & Backup, runtime metadata, OTA controls, build information, and developer actions out of Profile.
- Settings contains Account, Language, Appearance, Units, Data & Sync, Privacy, About, and a collapsed Developer tools section.
- Move date of birth, calculation sex, height, activity level, and training experience into a dedicated Profile details / Coach profile editor.
- Convert large inline Profile forms into compact summary cards with explicit Edit actions.
- Keep destructive account actions isolated from ordinary profile editing.

## P1 — onboarding and goal changes

- Show Quick Setup only during first run or immediately after account creation.
- Do not render Quick Setup as a permanent Home card after completion.
- Keep goal changes available from Profile as Cut / Maintain / Gain, with target weight and training frequency in the editor.
- Preserve existing onboarding data and migration behavior.

## P1 — localization

- Complete Russian localization for Profile, Settings, Home, onboarding, validation, alerts, empty states, and sync recovery.
- Remove mixed-language screens and hard-coded English section headings.
- Keep terminology consistent across tabs: goal, target weight, training days, synchronization, recovery, and Coach.

## P2 — screen density and hierarchy

- Reduce repeated cards, duplicated headings, and explanatory copy already implied by controls.
- Use one dominant action per card and avoid multiple equal-weight CTAs.
- Collapse advanced Coach and diagnostic information by default.
- Shorten Home to status, next action, and concise weekly snapshot.
- Keep error notices compact and attached to the affected feature rather than overlaying unrelated content.

## Validation matrix

- iPhone physical-device checks in English and Russian.
- Light and Dark appearance.
- First-run onboarding, completed onboarding, signed-out, signed-in, offline, queue failure, and retry-success states.
- Small and large text, keyboard open, loading, validation error, and disabled actions.
- Verify no data loss, no schema changes, no duplicate sync operations, and no regression in account deletion or recovery.

## Execution order

1. Finish the active Nutrition before/after backend slice.
2. Profile cleanup and technical-data removal.
3. Settings consolidation and developer-tools disclosure.
4. Onboarding completion / cloud-queue error fix.
5. Goal editor extraction from onboarding.
6. Russian localization pass for Profile, Settings, Home, and onboarding.
7. Home density cleanup and compact sync recovery notice.
8. Transparent/disabled control audit across all tabs.
9. Physical-device visual regression pass and roadmap update.
