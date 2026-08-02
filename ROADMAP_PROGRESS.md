# Smart Fitness Roadmap Progress

Updated: 2026-08-02

This is the canonical product and release roadmap index for:

- mobile: `hon4olo/smart-fitness-app`;
- backend: `hon4olo/smart-fitness-backend`.

Read this index together with:

- `AGENTS.md`;
- `PROJECT_LEARNINGS.md`;
- `docs/implementation-plan.md`;
- `docs/roadmap/provider-readiness.md`;
- `docs/roadmap/social-network.md`;
- `docs/roadmap/release-and-account.md`;
- `docs/roadmap/localization-settings.md`;
- `docs/roadmap/data-quality-and-scale.md`;
- `docs/nutrition-roadmap.md`;
- backend `AGENTS.md` when backend work is required.

Completed implementation history remains in merged pull requests and focused roadmap and architecture documents. This file tracks the verified baseline, active program, execution order, and activation boundary.

## Verified repository baseline

Before this documentation synchronization slice:

- mobile `main`: `4e2f7a0ef1dad2d1e1ec05ec533d484e54ae7cd0`;
- backend `main`: `7b557a216a3e08b043941f2863c6ae64c68b0cf0`;
- backend PR #92 exact green head: `97f363221b77fc69041ab19d713e9d9c9124ef9d`;
- backend PR #92 merge: `7b557a216a3e08b043941f2863c6ae64c68b0cf0`;
- open mobile pull requests: none;
- open backend pull requests: none.

Always recheck exact `main` and open pull requests in both repositories before changing code.

## Working rules

- Continue through a meaningful bounded phase rather than stopping after every micro-change.
- Use branches and pull requests; merge only an exact fully green head.
- Preserve routes, stable IDs, persisted schemas, canonical units, authentication, revisions, idempotency, conflicts, completed history, explicit Coach confirmations, media state versions, leases, retention, legal holds, and immutable audit unless the task explicitly changes them.
- Keep private fitness data in the existing offline-first and revision-aware private-data boundary.
- Keep Social data server-authoritative and separate from private `AppState` synchronization.
- Keep provider calls and credentials backend-only.
- Keep every hand-written source or architecture file at or below 500 physical lines.
- New user-facing copy must use the localization layer and bounded display mappings.
- Never add health, nutrition, workout, limitation, authentication, Coach, Social content, email, token, object key, signed URL, OCR plaintext, provider payload, or raw private values to telemetry or diagnostics.
- Do not publish OTA, create native builds, install on devices, deploy backend changes, execute migrations outside CI, activate environments, configure credentials, connect real providers, or enable public media uploads without explicit authorization.

## Completed product foundation

### Core application and synchronization

- Single Fastify/PostgreSQL backend and shared mobile API boundary.
- Offline-first local persistence with ordered observable critical mutations.
- Revision-aware synchronization for supported private fitness domains and the account-scoped Nutrition library.
- Restart recovery, auth-refresh retry, concurrent pull, idempotency, and two-device conflict source coverage.
- Data & Sync status, persistence retry, outbox recovery, unresolved-conflict review, and privacy-safe diagnostics.
- Secure native token storage and source-complete account deletion, password change, and session/device management.
- Focused state/action boundaries with zero production `useAppContext` consumers.
- Approved single AsyncStorage `AppState` snapshot after measured local-state performance review.

### Product surfaces

- Home, Workouts, Nutrition, Progress, Profile, Settings, Account & Security, Safety & Recovery, and Coach source flows.
- English/Russian localization and centralized date, number, plural, weight, length, and energy presentation.
- High-volume list virtualization and Progress chart boundaries.
- Blocking mobile and backend CI.

### Social S0-S6

Source-complete:

- profiles, visibility, usernames, follows, requests, and blocks;
- relationship discovery;
- immutable opt-in workout-post snapshots;
- profile post lists, post detail, deletion, and chronological following feed;
- bounded account-scoped feed cache;
- reactions, comments, notifications, and persistent rate limits;
- reports, Community Guidelines, operator review, audited restrictions, and fail-closed visibility enforcement;
- provider-neutral typed pre-publication text moderation.

Real moderation-provider activation remains disabled.

### Social S7 managed media

S7.1-S7.7 source boundaries are complete through backend PR #91 and mobile PR #355:

- managed-media ownership, lifecycle, state versions, leases, deletion, and account cascade;
- private quarantine uploads and strict image validation;
- normalization, metadata removal, classifier and OCR contracts, OCR text moderation, and fitness-aware policy;
- approved avatar and workout-post derivatives with owner-opaque immutable descriptors;
- managed avatar and optional one-image workout-post mobile flows;
- internal manual review, append-only decision audit, owner appeals, and rejected-evidence retention;
- reviewer evidence export with byte integrity and state-version revalidation;
- lifecycle-derived cleanup deadlines, restart-safe cleanup claims, legal holds, dependency-ordered deletion, and append-only cleanup audit.

Public media uploads, real storage, CDN, classifier, OCR, and worker scheduling remain disabled. Detailed history and acceptance criteria are in `docs/roadmap/social-network.md` and the merged PRs.

## Active autonomous source program

The approved active program is **Provider and Release Readiness**.

Canonical detail:

- `docs/roadmap/provider-readiness.md`.

Goal: prepare mobile and backend so later activation requires provider selection, credentials, infrastructure creation, deployment, staging validation, native builds, and explicit feature flags rather than new core application work.

### P0 — provider configuration and capabilities

Backend foundation merged in PR #92 from exact green head `97f363221b77fc69041ab19d713e9d9c9124ef9d` as merge `7b557a216a3e08b043941f2863c6ae64c68b0cf0`:

- provider-neutral selectors and composition-root factories;
- separate `configured`, `ready`, and `enabled` states;
- fail-closed production validation;
- privacy-safe redacted readiness representation;
- strict versioned backend capability response for managed avatars, workout-post images, media moderation, immutable media delivery, and password reset;
- safe disabled behavior when configuration is absent;
- credentials and settings remain inert without explicit product enablement.

Remaining P0 mobile boundary:

- strict versioned capability parser;
- rejection of unknown critical fields and versions;
- account/session-safe capability loading and refresh;
- no requests into known-disabled upload or password-reset pipelines;
- EN/RU bounded states for unavailable, temporarily unavailable, configuration-required, and recheck-required behavior;
- preservation of existing offline, auth, navigation, draft, and polling boundaries.

No real provider adapter, credential, deployment, worker, upload, or password-reset email activation was added by the backend foundation.

### P1 — storage and immutable delivery adapters

- S3-compatible private quarantine and moderation storage;
- narrowly scoped presigned uploads and bounded private reads;
- immutable derivative publication and trusted CDN URL construction;
- checksum, namespace, duplicate, expiry, and cleanup conformance tests.

### P2 — worker entrypoints and orchestration

- bounded moderation, delivery, retention-cleanup, expiry, and retry entrypoints;
- graceful shutdown, bounded concurrency, leases, backoff, readiness, and deterministic exit codes;
- systemd, timer, and Docker Compose templates without environment activation.

### P3 — classifier and OCR readiness

- bounded provider transport, timeout, cancellation, retry, rate-limit, and redaction behavior;
- strict provider-specific parsers after provider selection;
- mapping into existing internal signals and deterministic policy;
- reusable conformance tests without credentials in CI.

### P4 — moderation calibration harness

- local authorized-corpus manifest;
- aggregate allow/review/reject and false-positive/false-negative reporting;
- bounded fitness-specific categories;
- no raw media, OCR plaintext, credentials, identity, or provider payloads in reports.

### P5 — password-reset product readiness

- localized mobile forgot/reset routes and strict API states;
- validated app/universal links and token hygiene;
- production delivery adapter and EN/RU email templates;
- operational capability gating and provider-failure coverage.

### P6 — deployment templates and runbooks

- `.env.example`, secret-name, storage/CDN/email policy, and lifecycle templates;
- migration, rollout, worker-start, capability-enable, rollback, and key-rotation order;
- non-production smoke scripts and emergency-disable procedures.

### P7 — explicit sync conflict choices

- backend-owned `keep_local` and `keep_server` with exact revisions and idempotency;
- merge only for explicitly documented deterministic domains;
- immutable bounded resolution audit and stale-choice rejection;
- mobile destructive-choice UI only after the backend contract is merged.

### P8 — diagnostics, release gate, and Android source preparation

- privacy-safe auth/API/provider/worker failure categories;
- exact-SHA cross-repository compatibility manifest and fail-closed gate;
- Android permissions, picker, app-link, network, release-profile, native-module, and build-time source audit.

### P9 — privacy, legal, and analytics prerequisites

- technical data and retention inventory;
- engineering drafts for privacy, terms, acceptable use, provider subprocessors, and appeals;
- analytics consent, identity, taxonomy, retention, deletion, and prohibited-data requirements before any SDK.

## Current execution order

1. Complete the remaining P0 mobile capability parser, account/session-safe refresh, localized gating, and control suppression.
2. P1 S3-compatible storage and immutable delivery adapters.
3. P2 worker entrypoints and process templates.
4. P3 provider transport and selected classifier/OCR adapters.
5. P4 moderation calibration harness.
6. P5 password-reset mobile, links, templates, and delivery readiness.
7. P6 deployment policies, smoke scripts, and runbooks.
8. P7 backend-owned conflict choices and then mobile UI.
9. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.
10. P9 technical privacy, legal, and analytics prerequisites.

Each phase may be divided into bounded backend, mobile, and documentation PRs. After every backend slice, synchronize this mobile roadmap with exact head and merge SHAs.

## Source work allowed now

- backend and mobile implementation;
- provider adapters written against documented contracts without real credentials;
- deterministic tests, fixtures, conformance suites, and CI;
- CLI and worker entrypoints that are not started in an environment;
- environment, Docker Compose, systemd, policy, smoke, and runbook templates;
- mobile deep-link and Android source configuration;
- technical privacy and legal drafts marked as non-approved;
- exact-green PR merges.

## Activation and release boundary

Source completion does not activate production behavior.

Still prohibited without explicit authorization:

- credential, secret-store, provider-account, bucket, CDN, DNS, sender-domain, or repository-token changes;
- real provider calls or staging calibration;
- backend deployment or migration execution outside CI;
- worker scheduling;
- staging or production activation;
- OTA/EAS publication;
- native builds or device installation;
- public media upload enablement;
- production password-reset email activation;
- legal approval claims.

Physical-device, second-device, offline-restart, accessibility, EN/RU/unit, Android, release, and rollback validation remain external after source preparation.

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
- public body or health leaderboards;
- multi-image posts and advanced media formats before the bounded one-image pipeline is proven;
- lab analysis, diagnosis, pharmacology, hormone, or supplement protocol features.

## New-chat starter prompt

> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. Do not rely only on this prompt: first verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, and `docs/architecture/app-context-consumer-inventory.md`; then inspect only code and tests relevant to the selected bounded slice. P0 backend configuration and capability foundation was merged in backend PR #92 from exact green head `97f363221b77fc69041ab19d713e9d9c9124ef9d` as merge `7b557a216a3e08b043941f2863c6ae64c68b0cf0`. Start with the remaining P0 mobile boundary: strict versioned capability parsing, rejection of unknown critical fields and versions, account/session-safe loading and refresh, suppression of known-disabled requests and controls, and bounded localized EN/RU unavailable states. Preserve all existing media lifecycle, moderation, delivery, review, appeal, retention, legal-hold, cleanup, password-reset, authentication, sync, idempotency, revision, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without my direct request.
