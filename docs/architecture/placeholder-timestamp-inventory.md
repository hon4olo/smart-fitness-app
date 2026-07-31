# Placeholder Timestamp Inventory

Updated: 2026-08-01

Scope: fixed date and timestamp literals in non-test mobile production source at `9489f2c4cd7208a7f31f01c088d95b682db836b7`.

## Result

The audit found seven fixed date literals. Only one value participates in bundled persisted data:

- `2000-01-01T00:00:00.000Z` marks application-owned bundled workouts and exercises.

The exact serialized value is retained for compatibility. Its meaning is now explicit through `BUNDLED_CONTENT_CREATED_AT` in `src/data/bundledContent.ts`.

## Classification

### Bundled-content compatibility timestamp

Previous declarations:

- `DEFAULT_APP_DATA_CREATED_AT` in `src/data/defaults.ts`;
- a local `DEFAULT_EXERCISE_CREATED_AT` in `src/data/exercises/index.ts`;
- an unused exported `DEFAULT_EXERCISE_CREATED_AT` in `src/domain/models/exercise.ts`.

Outcome:

- consolidate the literal into `BUNDLED_CONTENT_CREATED_AT`;
- use it for bundled workout templates, embedded bundled exercises, and the local exercise catalog;
- remove the unused domain export;
- preserve the exact timestamp value to avoid changing stored snapshots, merge behavior, or deterministic ordering;
- do not substitute current time during hydration.

No persisted-state migration is required because the serialized data value and model shape are unchanged.

### Validation lower bounds

`1900-01-01` appears in:

- `src/cloud/FitnessProfileSync.ts`;
- `src/features/coach/userLimitationForm.ts`.

These literals are validation boundaries for user-entered dates. They are not persisted placeholders and remain unchanged.

### Input examples

Fixed examples appear in:

- `src/features/coach/screens/UserLimitationScreen.tsx`;
- `src/features/settings/PersonalDetailsSettingsCard.tsx`.

They are text-input hints only. They do not initialize state, enter synchronization payloads, or affect persistence. They remain outside the bundled-content timestamp contract.

## Guard

`test/bundled-content-timestamp.test.ts` enforces that:

- the compatibility literal is owned by exactly one semantic module;
- default workouts and the bundled exercise catalog use the semantic constant;
- ambiguous legacy constant names do not return.

## Decision

Changing `createdAt` to nullable, replacing the compatibility value with current time, or rewriting stored objects would add migration and synchronization risk without solving a current product defect. The bounded cleanup therefore clarifies ownership and removes duplication while preserving the persisted contract.
