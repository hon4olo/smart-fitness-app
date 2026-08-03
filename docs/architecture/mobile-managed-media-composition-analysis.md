# Mobile Managed-Media Composition Audit

Updated: 2026-08-03

## Scope

This document records the implemented mobile managed-media composition boundary after the initial architecture analysis and four independently validated slices.

It defines what is now shared, what intentionally remains domain-specific, and where further abstraction would add coupling rather than remove technical debt.

This audit does not change runtime behavior, public API contracts, persistence schemas, capability flags, dependencies, Expo configuration, native projects, provider configuration, credentials, deployment, OTA/EAS state, or production activation.

## Verified baselines

Current verified repository state after the completed slices:

- mobile `main`: `e9c923056bbc04a26db7061dcb892d56e6ab0c73`;
- backend `main`: `06c955ff57a75ea73921fd8e676787a4ebc2e0ae`;
- no open mobile or backend pull requests after mobile PR #399 merged.

Backend composition prerequisites:

- backend PR #122 exact green head: `1c5cdadfd39e63eacff479e416ddd3bbe8c093e4`;
- backend PR #122 merge: `bd7f4499a455252b663c8687dda1e5f4a4d5f327`;
- backend PR #123 exact green head: `822a2ce030457c6914dd5ce224150cdddd7b6827`;
- backend PR #123 merge: `06c955ff57a75ea73921fd8e676787a4ebc2e0ae`.

Backend PR #122 added the injected staging managed-media composition core. Backend PR #123 added the reusable callback-form synthetic auth lease and proved that an owner-bound composed scenario can run before mandatory account deletion and session-revocation verification. Neither PR enabled a public capability or made a real staging call.

## Completed mobile slices

### PR #396 — architecture analysis

- exact green head: `aeacf4af597f61e03e87dd4b15467fc9f0456a19`;
- merge: `e6b8773e7fe9ac0c1e2f87444cfdf8bb99b43ea7`;
- Mobile CI run: #1646.

The slice mapped strict contracts/parsers, authenticated API transport, signed upload, image preparation, restart-safe drafts, capability gates, and the two feature controllers. It identified the safe shared lifecycle without changing runtime behavior.

### PR #397 — upload composition and workout-post adoption

- exact green head: `057b5331a7f7c2658ca1726f8ac7c8ee8668e2ae`;
- merge: `d7b20506363c6be65b7ea7a2bd10b79f01038b23`;
- Mobile CI run: #1648.

The slice added `managedMediaUploadComposition.ts` and migrated only the workout-post image create/upload/complete path.

### PR #398 — managed-avatar adoption

- exact green head: `ea6b3094807b8ad751200659e5b594d0c484104f`;
- merge: `146cfd36808d37f49810eca4ec46d2e084c8d6d6`;
- Mobile CI run: #1650.

The slice adopted the same upload composition core for managed avatars while preserving current-versus-candidate separation and approved-only binding.

### PR #399 — bounded polling extraction

- exact green head: `9aaff9fe2cd4d1a67dc85605b03e1712b4df3ffb`;
- merge: `e9c923056bbc04a26db7061dcb892d56e6ab0c73`;
- Mobile CI run: #1652.

The slice added `managedMediaPolling.ts` and replaced only the duplicated bounded polling loops. Domain-specific refresh, validation, binding, attachment, and cleanup remained in their controllers.

Every listed Mobile CI run passed:

- repository file line audit;
- changed-file line limit;
- TypeScript;
- Coach and sync contract tests;
- complete regression suite;
- Expo export;
- Expo Doctor.

## Current shared layers

### Strict contract boundary

`src/api/social/media-contracts.ts` and `src/api/social/media-parsers.ts` remain the only trust boundary where untrusted backend media payloads become typed mobile data.

The composition modules do not parse raw responses and do not weaken:

- exact schema versions;
- exact asset types;
- owner asset lifecycle states;
- state-version validation;
- public descriptor validation;
- signed upload URL/header validation.

### Authenticated API transport

`src/api/social/media-api.ts` remains responsible for released authenticated HTTP operations:

- create private upload;
- complete upload;
- read one owned asset;
- delete one owned asset;
- read and bind the current managed avatar.

The API layer remains independent from picker, draft, polling, React state, and domain policy.

### Signed upload transport

`src/api/social/signed-media-upload.ts` remains responsible for the direct signed `PUT` boundary:

- local-file read;
- exact byte-size verification;
- media-type preservation;
- signed-grant expiry check;
- upload progress;
- abort support;
- bounded transport failures.

Signed URLs and signed headers remain ephemeral and are never persisted.

### Upload composition core

`src/features/social/managedMediaUploadComposition.ts` now owns only the mechanics shared by both current consumers:

```text
create private upload
→ validate created owner asset
→ persist restart-safe draft identity
→ verify request is current
→ signed PUT with bounded progress
→ verify request is current
→ complete with exact created state version
→ validate completed owner asset
→ publish completed owner asset
```

The core exposes narrow callbacks for:

- create;
- draft persistence;
- signed upload;
- completion;
- domain asset validation;
- current-request checks;
- stage, progress, and asset publication.

It does not know about React, localization, account/session key construction, avatar binding, workout-post publication, or public rendering.

### Bounded polling core

`src/features/social/managedMediaPolling.ts` owns only:

- exact attempt and interval bounds;
- current-request cancellation before each refresh;
- one caller-supplied refresh per attempt;
- caller-supplied terminal-state detection;
- the existing wait after each non-terminal attempt;
- terminal, exhausted, and cancelled outcomes.

It does not decide how an asset is refreshed, validated, bound, attached, deleted, or presented.

## Intentionally domain-specific layers

### Image selection and preprocessing

These remain separate:

- `socialManagedAvatarImage.ts`;
- `socialWorkoutPostImage.ts`.

Their crop/aspect, dimensions, quality, picker recovery, and user-facing policies may diverge. A shared prepared-media shape is sufficient; a common picker/preprocessor would create unnecessary coupling.

### Restart-safe drafts

These remain separate:

- managed-avatar drafts are account-scoped;
- workout-post drafts are account-and-session-scoped.

Both persist only asset identity and local preview URI. They do not persist tokens, signed grants, headers, private bytes, or backend response bodies.

A universal draft key or schema would increase the risk of cross-account or cross-session leakage.

### Managed avatar controller

`useSocialManagedAvatar.ts` remains responsible for:

- profile existence precondition;
- current attached avatar versus replacement candidate;
- preserving the current approved avatar while a candidate is pending or rejected;
- approved-only binding with a public descriptor;
- account-scoped recovery;
- candidate/current deletion policy;
- localized avatar errors.

### Workout-post media controller

`useSocialWorkoutPostMedia.ts` remains responsible for:

- account-and-session-scoped draft ownership;
- replacement deletion before a new upload;
- exact `workout_post_image` validation;
- approved-only post attachment;
- publication blocking while a selected asset is non-approved;
- local draft release after successful publication;
- localized workout-post media errors.

## Preserved security and correctness boundaries

The completed extraction preserves:

- fail-closed capability gating before picker recovery or any media request;
- account/session sequence isolation;
- signed upload cancellation on stale work;
- exact created asset ID and state version at completion;
- no automatic create or complete retry;
- no signed grant persistence;
- no direct provider or storage SDK in mobile;
- no raw backend/provider/status/error text in presentation;
- current avatar preservation during replacement processing;
- text-only workout-post publication when image capability is unavailable;
- domain-specific cleanup that cannot generically delete a bound avatar or published post asset.

## Residual duplication audit

The remaining similarities are not currently suitable for another generic layer.

### Idempotency-key generation

Both controllers generate a bounded key, but use domain-specific prefixes and invoke generation at different domain decision points. Extracting a generic helper would save only a few lines while hiding useful identity context. Keep local unless a third consumer appears or key policy becomes centrally versioned.

### Sequence and abort ownership

Both hooks use sequence refs and abort controllers, but ownership is tied to React lifecycle, account/session changes, picker recovery, replacement, and publication release. A generic controller would need domain callbacks for nearly every transition and would increase indirection.

### Restore, refresh, delete, and cleanup

The shapes look similar but the invariants differ:

- avatar restore compares candidate identity with the attached asset and may bind;
- workout restore validates session ownership and attachment type;
- avatar delete can target candidate or current asset;
- workout delete releases one session draft;
- avatar cleanup can change the public profile;
- workout cleanup must not remove an already published post asset.

These operations should remain explicit in domain controllers.

### Error mapping and visible state

Avatar and workout-post media use different copy and policy outcomes. Centralizing errors would either leak raw failure detail or create a large cross-domain mapping table. Keep bounded domain mapping.

## Composition boundary decision

For the current two consumers, the mobile composition layer is source-complete at:

```text
strict API and signed transport
→ shared upload composition
→ shared bounded polling
→ domain controller policy
→ presentation
```

Do not introduce a generic managed-media React hook, universal draft store, universal cleanup policy, or combined avatar/workout controller without a concrete third consumer or a demonstrated correctness defect.

## Next bounded work

The next safe step is not another abstraction pass. It is a targeted residual integration audit against future media consumers and canonical roadmap synchronization.

A future implementation slice should begin only when one of these conditions is true:

1. a third managed-media consumer needs the same upload/polling mechanics;
2. an observed defect shows that sequence, cleanup, or terminal-state policy is inconsistent;
3. released API contracts add a new lifecycle phase requiring shared orchestration;
4. product requirements introduce multi-asset composition with explicit ownership semantics.

Until then, preserve the current small shared cores and keep domain behavior visible.

## Audit exit criteria

- exact completed PR and merge evidence is recorded;
- shared mechanics and domain policy are explicitly separated;
- remaining duplication has been evaluated rather than automatically extracted;
- security, persistence, capability, and cancellation boundaries remain explicit;
- no runtime or activation behavior changes in this audit slice.
