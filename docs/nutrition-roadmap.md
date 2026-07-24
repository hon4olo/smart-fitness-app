# Nutrition UX Roadmap

Updated: 2026-07-25

The main Nutrition diary screen remains the visual reference and is out of scope for child-flow redesign.

## Completed

- [x] Local-date-safe Add Food routing.
- [x] Provider serving values match displayed calories and macros.
- [x] Decimal-comma parsing and strict custom-food validation.
- [x] Stable narrow-iPhone calendar grid.
- [x] Destructive confirmations for food entries and saved meals.
- [x] Account-scoped local-catalog favorites.
- [x] Keyboard-safe, scrollable portion editor.
- [x] Saved-meal detail view with item totals and composition.
- [x] Saved-meal rename and replace-from-current-diary actions.
- [x] One debounced provider request cycle for search and autocomplete.
- [x] Distinct waiting, loading, empty, provider-error, and local-fallback copy.
- [x] Account-scoped reusable custom-food library.
- [x] Persistent provider-favorite snapshots that remain usable without a repeat provider lookup.
- [x] Favorite and custom-food removal from the Favorites & My foods surface.

## Remaining validation

- [ ] Run the full Nutrition flow on a matching production-channel iPhone build.
- [ ] Verify keyboard behavior on the smallest supported iPhone viewport.
- [ ] Verify provider search during airplane mode, timeout, empty result, and recovery.
- [ ] Verify anonymous-to-account and account-to-account library isolation.
- [ ] Verify saved-meal rename/replacement synchronization on a second device.
- [ ] Verify barcode permission denial, lookup failure, manual creation, and repeat scan.

## Guardrails

- Do not change `src/app/(tabs)/nutrition.tsx` solely for this phase.
- Keep food entry and meal template mutations offline-first.
- Keep provider credentials and provider-specific authentication on the backend.
- Do not add native dependencies for this phase.
- Do not publish OTA or create a native build without explicit authorization.
