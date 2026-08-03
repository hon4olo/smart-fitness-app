# Mobile Managed-Media Composition Analysis

Updated: 2026-08-03

## Scope

This slice records the current mobile managed-media architecture and identifies a bounded composition seam shared by managed avatars and workout-post images.

It does not change runtime behavior, public API contracts, persistence schemas, capability flags, dependencies, Expo configuration, native projects, provider configuration, credentials, deployment, OTA/EAS state, or production activation.

Verified baselines before this slice:

- mobile `main`: `7de40845e56f1618af5a64562974550673e45130`;
- backend `main`: `06c955ff57a75ea73921fd8e676787a4ebc2e0ae`;
- backend PR #122 exact green head: `1c5cdadfd39e63eacff479e416ddd3bbe8c093e4`;
- backend PR #122 merge: `bd7f4499a455252b663c8687dda1e5f4a4d5f327`;
- backend PR #123 exact green head: `822a2ce030457c6914dd5ce224150cdddd7b6827`;
- backend PR #123 merge: `06c955ff57a75ea73921fd8e676787a4ebc2e0ae`;
- no open mobile or backend pull requests after backend PR #123 merged.

Backend PR #122 added the injected staging composition core. Backend PR #123 added the reusable callback-form synthetic auth lease and proved integration with that composition. Neither change enabled a public media capability or performed a real staging call.

## Existing mobile layers

### Strict contracts and parsers

`src/api/social/media-contracts.ts` and `src/api/social/media-parsers.ts` own the fail-closed DTO boundary for:

- owner media assets;
- signed uploads;
- managed public descriptors;
- avatar binding;
- lifecycle states and state versions.

This remains the only place where untrusted backend media payloads become typed mobile data. A composition refactor must not weaken exact-key, schema-version, asset-type, URL, state, or state-version validation.

### Authenticated media API

`src/api/social/media-api.ts` owns released authenticated HTTP operations:

- create private upload;
- complete upload;
- read one owned asset;
- delete one owned asset;
- read and bind the current managed avatar.

It validates asset path segments, create inputs, idempotency-key bounds, and positive expected state versions before requests. It must remain transport-focused and must not absorb picker, draft, polling, UI, or domain policy.

### Signed upload transport

`src/api/social/signed-media-upload.ts` owns the direct signed `PUT` boundary. It:

- reads the selected local file;
- verifies exact byte size;
- preserves the expected media type;
- rejects expired upload grants;
- sends only the signed URL and headers returned by the backend;
- supports progress and cancellation;
- maps local-file, size, network, rejection, expiry, and abort failures to bounded codes.

The signed URL and headers are ephemeral and are not persisted. This transport should remain independent from avatar and workout-post policy.

### Domain-specific image preparation

The current image-selection and preprocessing modules are intentionally separate:

- `socialManagedAvatarImage.ts` for avatar selection, recovery, resize, and compression;
- `socialWorkoutPostImage.ts` for workout-post image selection, recovery, resize, and compression.

Their output shapes are similar, but crop/aspect, dimensions, quality, picker recovery, and user-facing policy may diverge. A shared composition layer may consume prepared media, but should not merge these modules prematurely.

### Domain-specific draft persistence

Restart-safe drafts are also intentionally separate:

- managed-avatar drafts are account-scoped;
- workout-post media drafts are account-and-session-scoped.

Both persist only asset identity and local preview URI. They do not persist tokens, signed URLs, signed headers, private bytes, or backend response bodies. A shared composition layer must depend on a narrow draft adapter rather than inventing one universal storage key or schema.

### Feature controllers

`useSocialManagedAvatar.ts` and `useSocialWorkoutPostMedia.ts` currently compose the full client lifecycle inside React hooks.

Both controllers perform the same structural sequence:

1. capability/account precondition;
2. sequence isolation and cancellation of stale work;
3. image preparation;
4. upload creation with a bounded idempotency key;
5. restart-safe draft persistence;
6. signed upload with progress and abort support;
7. completion with exact state version;
8. bounded owner-asset polling;
9. refresh, delete, and draft cleanup;
10. bounded localized error mapping.

The duplication is architectural rather than merely syntactic: each hook currently owns orchestration, state transitions, cancellation, polling, and cleanup in addition to domain policy and React presentation state.

## Required domain differences

A reusable composition layer must preserve these differences rather than erase them.

### Managed avatar

- keeps both a currently attached asset and a replacement candidate;
- preserves the current approved avatar while a replacement is pending or rejected;
- binds only an approved candidate with a public descriptor;
- requires an existing Social profile;
- uses an account-scoped draft;
- deletion can target either the candidate or current avatar.

### Workout-post image

- owns at most one draft asset for one account and workout session;
- produces an attachment only for an approved `workout_post_image` asset;
- blocks publication while a selected asset is non-approved;
- releases local draft state after successful post publication;
- replacing or removing a draft may delete the previous private asset;
- uses an account-and-session-scoped draft.

These policies belong in thin domain adapters/controllers above the reusable lifecycle composition.

## Current capability boundary

Managed avatar and workout-post image operations are gated by strict backend capability state. When the capability is unavailable, the hooks must stop before picker recovery, upload creation, signed transfer, completion, polling, binding, refresh, or deletion.

The refactor must preserve:

- fail-closed behavior before capability confirmation;
- cancellation and stale-response isolation across account/session changes;
- text-only workout-post publication when image capability is unavailable;
- no raw backend/provider/status/error text in presentation;
- no direct provider or storage SDK in mobile.

## Composition seam

The appropriate reusable seam is the private client lifecycle from a prepared local media item through one owned terminal asset:

```text
prepared local media
→ create private upload
→ persist restart-safe draft
→ signed PUT
→ complete with exact state version
→ bounded owner polling
→ terminal owner asset
→ domain-specific bind/attach/delete/release policy
```

The composition layer should own only cross-domain mechanics:

- operation sequencing;
- cancellation checks;
- create/upload/complete ordering;
- bounded polling;
- progress forwarding;
- exact state-version use;
- generic cleanup hooks;
- typed lifecycle outcomes.

It should not own:

- React rendering or localized copy;
- image picker configuration or preprocessing policy;
- account/session key construction;
- avatar binding rules;
- workout-post attachment rules;
- publication eligibility;
- public descriptor rendering;
- capability loading;
- raw API parsing;
- persistence implementation.

## Dependency direction

The intended dependency direction is:

```text
screen/card
→ domain hook/controller
→ managed-media composition layer
→ narrow draft/API/signed-upload/time ports
→ existing strict API clients and storage modules
```

The composition layer must not import screens, cards, localization, Expo Router, profile forms, post forms, or provider-specific code.

## Risks to prevent

- A generic hook that combines avatar and workout-post UI state would increase coupling rather than reduce it.
- Moving strict parsing into the composition layer would duplicate the trust boundary.
- Persisting signed upload grants for restart recovery would expand secret lifetime and is prohibited.
- Reusing one draft key shape could cause cross-account or cross-session leakage.
- Automatic retry of create or complete without preserving the same idempotency identity and state version could violate server contracts.
- Polling without sequence isolation could materialize stale asset state after account, session, replacement, or capability changes.
- A cleanup abstraction must not delete a currently bound approved avatar or a published post asset.
- Error normalization must remain bounded and domain presentation must stay localized.

## Independent follow-on slices

### Slice 2 — composition-layer extraction

Create a focused non-React module and pure lifecycle state model without migrating either feature flow. The diff should establish dependency direction only and preserve all current behavior.

### Slice 3 — narrow interfaces

Add explicit ports for:

- create/complete/read/delete media operations;
- signed upload;
- draft save/clear;
- bounded wait/clock;
- cancellation/current-request checks;
- domain cleanup callbacks.

No interface should expose tokens, signed grants after upload, raw responses, or provider details.

### Slice 4 — minimal implementation

Migrate one flow first, preferably workout-post media because it has one draft asset and no separate current-versus-candidate binding state. Keep the managed-avatar hook unchanged until the first migration is green.

### Slice 5 — deterministic tests

Cover exact operation order, idempotency identity preservation, state-version use, signed-upload expiry/failure mapping, cancellation, stale-sequence isolation, polling bounds, terminal states, draft cleanup, and callback failure containment.

### Slice 6 — second-flow adoption

Only after the first migrated flow is green, adapt managed-avatar composition while preserving current-avatar/candidate separation and approved-only binding. This must be a separate PR.

## Exit criteria for this analysis slice

- current layers and dependency direction are explicit;
- shared mechanics are separated from domain policy;
- security, privacy, persistence, capability, and cancellation invariants are recorded;
- subsequent work is divided into independently reviewable PRs;
- no runtime or activation behavior changes in this slice.
