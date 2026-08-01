# Smart Fitness Roadmap Progress

Updated: 2026-08-02

This is the canonical product and release roadmap index for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Detailed contracts and phase history live in the linked focused files. Completed work must not remain listed as future implementation.

Read this index together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md` for the current bounded engineering decision gate;
- `docs/roadmap/social-network.md`;
- `docs/roadmap/release-and-account.md`;
- `docs/roadmap/localization-settings.md`;
- `docs/roadmap/data-quality-and-scale.md`;
- `docs/nutrition-roadmap.md`;
- backend `AGENTS.md` when backend work is required.

## Verified repository baseline

At this update:

- mobile `main`: `1a1fd4f12752ab1bd7782fffcc1877a30965e96e`;
- backend `main`: `3f6c907efcfa503bd4beaf12b072c4e5b4573362`;
- open mobile pull requests: none;
- open backend pull requests: none.

Always recheck exact `main` and open pull requests before changing code.

## Working rules

- Continue through a meaningful phase rather than stopping after every micro-change.
- Use bounded branches and pull requests; merge only an exact fully green head.
- Preserve routes, stable IDs, persisted schemas, canonical units, authentication, revisions, idempotency, conflicts, completed history, and explicit Coach confirmations unless the task explicitly changes them.
- Keep private fitness data in the existing offline-first and revision-aware private-data boundary.
- Keep Social data server-authoritative and separate from private `AppState` synchronization.
- Keep every hand-written source file at or below 500 physical lines.
- New user-facing copy must use the localization layer.
- Never add health, nutrition, workout, limitation, authentication, Coach, Social content, email, token, or raw payload values to telemetry.
- Do not publish OTA, create native builds, install on devices, deploy backend changes, activate staging or production, configure credentials, or execute migrations without explicit authorization.

## Completed foundation

### Core application and architecture

- Single Fastify/PostgreSQL backend and shared mobile API boundary.
- Offline-first local persistence with ordered observable critical mutations.
- Revision-aware synchronization for the supported private fitness domains and account-scoped Nutrition library.
- Secure native token storage and source-complete account deletion, password change, and session/device management.
- Focused state/action boundaries with zero production `useAppContext` compatibility consumers.
- High-volume Nutrition Diary, Programs, Workout History, and Exercise Library virtualization.
- Weight trend `7D / 30D / 90D` and continuous weekly workout-volume Progress charts.
- Deterministic default, representative, and stress local-state benchmarks.
- Current storage decision: retain the single AsyncStorage `AppState` snapshot; SQLite and domain partitioning are not justified by current measurements.
- Blocking mobile CI for line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor.
- Blocking backend lint, formatting, build, tests, migration/schema, startup, and health validation.

### Localization, Settings, and recovery

- First-class English/Russian localization foundation and centralized date, number, plural, weight, length, and energy presentation.
- Repository-wide source guards against unsafe visible copy, raw statuses, provider errors, fixed display units, and presentation formatting.
- Data & Sync status, privacy-safe diagnostics, persistence retry, outbox recovery, and unresolved-conflict review surfaces.
- Source-level restart recovery, auth-refresh retry, concurrent pull, idempotency, and two-device conflict coverage for current synchronized contracts.

### Social network source status

Social phases S0-S6 are source-complete for the currently bounded text-first product:

- social profiles, visibility, usernames, follows, requests, and blocks;
- follower/following/request discovery lists;
- immutable opt-in workout-post snapshots and explicit Share Workout confirmation;
- profile post lists, post detail, deletion, and chronological following feed;
- bounded account-scoped first-page feed cache;
- reactions, comments, notifications, and persistent write-rate limits;
- profile/post/comment reports, Community Guidelines, operator report queue, audited hide/restore restrictions, and fail-closed visibility enforcement;
- provider-neutral, typed, deterministic pre-publication text moderation for captions, comments, display names, and bios;
- production moderation-provider activation remains disabled until separately configured and validated.

Do not restart Social work from profiles, follow graph, workout posts, feed, reactions, comments, notifications, reports, or text moderation. Those stages are already implemented.

## Active source-code program — Social S7 managed media

Status: architecture approved; implementation not started.

Goal: replace arbitrary remote avatar URLs and text-only workout posts with a bounded, server-owned, privacy-safe image pipeline. Public image upload must remain disabled until the complete quarantine, validation, moderation, derivative, deletion, and account-cleanup contract is implemented and validated.

### S7.1 Media domain and lifecycle contracts

- Add versioned `social_media_assets` metadata and explicit owner/type/state fields in PostgreSQL.
- Define strict public and internal DTOs using asset IDs and named immutable variants rather than arbitrary URLs.
- Define states such as upload pending, quarantined, processing, review required, approved, rejected, failed, and deleted.
- Define ownership, idempotency, account-deletion cascade, retention, restart recovery, and stale-processing behavior.
- Keep image bytes outside PostgreSQL.

### S7.2 Private quarantine upload boundary

- Introduce a provider-neutral S3-compatible object-storage abstraction.
- Use narrowly scoped signed uploads to private quarantine storage.
- Accept only bounded JPEG, HEIC/HEIF, and PNG inputs initially; reject animated and unsupported formats.
- Verify real file signatures, decode validity, pixel dimensions, and configured byte/pixel limits.
- Defend against malformed files, decompression bombs, repeated abusive uploads, and cross-owner access.
- Keep originals private and temporary.

### S7.3 Normalization, privacy, and image moderation

- Normalize orientation and color space.
- Remove EXIF, GPS, embedded thumbnails, device metadata, and unsupported profiles server-side.
- Produce a normalized moderation master.
- Run image classification, OCR, and OCR-text moderation through strict provider-neutral contracts.
- Add a fitness-specific deterministic policy so ordinary adult gym photos, sportswear, posing, bodybuilding stages, and non-erotic progress photos are not automatically classified as explicit content.
- Never claim or persist a precise age inferred from appearance; combine possible-minor and sexual-content signals conservatively.
- Keep uncertain cases non-public in `review_required`.

### S7.4 Approved derivatives and delivery

- Generate public derivatives only after approval.
- Generate bounded avatar and workout-post sizes plus a layout-stable placeholder.
- Publish immutable content-hashed URLs through a CDN or equivalent approved delivery boundary.
- Return strict descriptors containing asset ID, dimensions, aspect ratio, placeholder, and named variants.
- Support deletion of quarantine, master, variants, and origin objects during account deletion or terminal cleanup.

### S7.5 Mobile managed-avatar flow

- Replace free-form avatar URL editing with managed selection, local preview, upload progress, moderation status, retry, rejection, and deletion states.
- Add bounded client preprocessing for orientation, resizing, and compression where a reviewed native dependency is justified.
- Treat all client validation and EXIF removal as UX optimization only; server validation remains authoritative.
- Preserve existing social profile ownership, localization, visibility, block, and moderation contracts.

### S7.6 One-image workout-post flow

- Add at most one moderated image per workout post before considering multi-image posts.
- Keep the private completed workout and public immutable post snapshot separate.
- Keep pending, review-required, rejected, failed, and deleted assets out of public profiles, feeds, notifications, and post DTOs.
- Use bounded polling or refresh for asynchronous processing rather than holding the upload request open.
- Add localized offline, retry, compression, upload, processing, moderation, rejection, and removed-asset states.

### S7 exit criteria

- private object bytes are never publicly readable before approval;
- no arbitrary user-supplied image URL is trusted as a managed Social asset;
- ownership, retries, stale workers, duplicate delivery, deletion, and account cleanup are covered;
- metadata and public DTOs expose no private fitness or authentication content;
- image policy includes fitness-specific false-positive tests;
- backend and mobile blocking CI are fully green;
- no deployment, credentials, migration execution, native build, OTA, or public media activation is claimed without explicit authorization.

## Other remaining product and release work

### Release and device validation

- Configure and run the fixed-SHA cross-repository release gate when repository-token access is authorized.
- Create and validate a matching Android standalone build.
- Run preview/internal-production rollout and rollback rehearsal.
- Run real-device matrices for small/standard iPhone, Android, offline termination/restart, force-close recovery, second-device synchronization, EN/RU, units, keyboard, Dynamic Type, VoiceOver/TalkBack, permissions, clipping, touch targets, and safe areas.
- Capture reference screenshots and validate standalone launch without Metro.

### Password reset and account lifecycle

- Select and configure a mail provider and verified sender domain.
- Add the mobile forgot-password/reset-password flow and validated deep link.
- Deploy and validate the existing backend reset migration/endpoints when explicitly authorized.
- Validate expiry, replay rejection, all-session invalidation, cleanup retry, destructive flows, and re-registration on devices.
- Add user-facing privacy explanations.

### Conflict-choice contract

- Define ownership, revision, idempotency, audit, rollback, and mixed-version behavior before adding destructive local-versus-account choices.
- Do not add client-only “keep local / keep server / merge” controls without the backend-owned contract.

### Privacy, legal, analytics, and moderation operations

- Review Terms of Service and Privacy Policy before broad Social release.
- Define consent, event taxonomy, retention, deletion, and identity boundaries before adding product analytics.
- Add manual review and appeal operations before broad public image rollout.
- Calibrate moderation thresholds and false-positive handling in staging before production provider activation.
- Push notifications remain deferred until permission, privacy, delivery, and settings contracts are approved.

### Nutrition and synchronization validation

- Run the full Nutrition flow on a matching release-channel iPhone build.
- Validate provider search under airplane mode, timeout, empty result, and recovery.
- Validate barcode permission denial, lookup failure, manual creation, and repeat scan.
- Validate anonymous/account isolation, account switching, saved-meal synchronization, Nutrition library restart recovery, and second-device behavior.

## Deferred beyond the current program

Do not begin without explicit product prioritization:

- direct messages;
- groups or communities;
- trainer marketplace;
- subscriptions, payments, or tips;
- algorithmic feed ranking or recommendations;
- contact-book discovery;
- location sharing;
- automatic workout publication;
- public nutrition, weight, body-measurement, limitation, recovery, or Coach data;
- public body/health leaderboards;
- multi-image posts and advanced media formats before the bounded one-image pipeline is stable;
- lab analysis, diagnosis, pharmacology, hormone, or supplement protocol features.

## Immediate execution order

1. Implement S7.1 backend media metadata, strict state machine, ownership, idempotency, deletion, and tests without activating storage credentials.
2. Implement S7.2 provider-neutral object-storage and signed quarantine-upload contracts with deterministic fake-provider tests.
3. Implement S7.3 validation, normalization, metadata removal, moderation orchestration, OCR, policy, and stale-worker recovery.
4. Implement S7.4 approved variants, descriptors, deletion lifecycle, and CDN-neutral delivery contracts.
5. Implement S7.5 managed mobile avatars after backend contracts are merged.
6. Implement S7.6 the bounded one-image workout-post flow after managed avatars and media descriptors are stable.
7. Define and implement manual review/appeal and retention operations.
8. Run staging calibration, physical-device, release, rollback, privacy, and legal gates only with the required authorization and configuration.

## New-chat starter prompt

> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`, with Social S7 managed media as the active source-code program. Work autonomously through meaningful bounded slices instead of stopping after micro-changes. At the start, verify exact `main` and open PRs for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/roadmap/social-network.md`, and only the files relevant to the current slice. Do not restart already completed Social S0-S6 work. Begin with S7.1: backend `social_media_assets` metadata, strict versioned state/DTO contracts, ownership, idempotency, deletion/account-cleanup semantics, migration and tests, while keeping image bytes outside PostgreSQL and public uploads disabled. Then proceed through provider-neutral quarantine storage, validation/normalization/privacy stripping, image moderation/OCR and fitness-specific policy, approved variants, managed avatars, and one-image workout posts. Preserve the private-data versus Social boundary, existing routes/contracts, localization, block/restriction enforcement, and file-size limits. Run full blocking CI, inspect review threads, and merge only exact green heads. Do not publish OTA, create/install native builds, deploy backend changes, execute migrations, activate staging/production, configure credentials, or enable public image uploads without my explicit request.
