# Smart Fitness Active Implementation Plan

Updated: 2026-08-02

This file contains the current verified baseline, active source program, execution order, and authorization boundary. Detailed tasks live in `docs/roadmap/provider-readiness.md`. Completed implementation history remains in merged pull requests and focused architecture and roadmap documents.

## Verified baseline

Before this documentation synchronization slice:

- mobile `main`: `e69185cb3a61f2c802a6c87ca33f8c168e1beb79`;
- backend `main`: `a2d4f67db3000785facb11e2d69cacb8cda03bc3`;
- backend PR #92 exact green head: `97f363221b77fc69041ab19d713e9d9c9124ef9d`;
- backend PR #92 merge: `7b557a216a3e08b043941f2863c6ae64c68b0cf0`;
- backend PR #93 exact green head: `d3a1f19ed419fe96111925ebe37e36ad855a67de`;
- backend PR #93 merge: `84e4100b85d24bfee04be2dbea0130fd95be3370`;
- mobile PR #363 exact green head: `ebda5b78713e0313bf088a54b299b6a943131074`;
- mobile PR #363 merge: `ac468c103db07ecb6b550535ed77aa72898fb68d`;
- backend PR #94 exact green head: `f0a199ac4c797d6b025fb48226502a7edddcab9e`;
- backend PR #94 merge: `a2d4f67db3000785facb11e2d69cacb8cda03bc3`;
- open mobile pull requests: none;
- open backend pull requests: none;
- production `useAppContext` consumers: `0`;
- Social S0-S6 and managed-media S7.1-S7.7 source boundaries are complete;
- Provider and Release Readiness P0 is source-complete;
- public media uploads and real providers remain disabled;
- the single AsyncStorage `AppState` snapshot remains the approved local-state architecture;
- the reviewed local-state evidence, budgets, and reopen criteria remain canonical in `docs/architecture/local-state-performance-decision.md`;
- blocking Mobile CI covers repository and changed-file line audits, TypeScript, Coach/sync contracts, full regression, Expo export, and Expo Doctor;
- blocking Backend CI covers lint, formatting, build, migrations, schema and PostgreSQL integration, full regression, startup, and health.

Always verify current exact `main` and open pull requests in both repositories before starting a slice.

## Active source program

There is no remaining approved autonomous source-refactor phase. The active work is the separately approved Provider and Release Readiness source-preparation program.

Status: approved for autonomous source preparation.

Goal: prepare mobile and backend provider integrations so later activation consists of provider selection, credentials, infrastructure creation, deployment, staging validation, native builds, and explicit feature enablement rather than additional core application work.

Canonical detailed roadmap:

- `docs/roadmap/provider-readiness.md`.

The program includes:

1. provider configuration, factories, readiness validation, and cross-repository capability contracts;
2. S3-compatible private object storage and immutable delivery adapters;
3. production worker entrypoints, process templates, recovery, and readiness;
4. classifier and OCR transport, strict adapters, and conformance tests;
5. moderation calibration tooling;
6. password-reset mobile flow, deep links, templates, and delivery adapter;
7. environment templates, storage/CDN/email policies, smoke scripts, and operational runbooks;
8. backend-owned explicit sync conflict choices before destructive mobile UI;
9. privacy-safe diagnostics, fixed-SHA release gating, and Android source preparation;
10. technical privacy, legal, and analytics prerequisites.

## Completed P0 status

Provider configuration and capability foundation is source-complete.

Backend PR #92, exact green head `97f363221b77fc69041ab19d713e9d9c9124ef9d`, merge `7b557a216a3e08b043941f2863c6ae64c68b0cf0`:

- provider-neutral selectors for private object storage, immutable media delivery, media classifier, OCR, and password-reset delivery;
- composition-root provider factories;
- explicit `configured`, `ready`, and `enabled` states;
- credentials and settings remain inert without explicit product enablement;
- strict fail-closed production validation for unsafe, incomplete, memory, unavailable, and source-unsupported enabled configurations;
- privacy-safe configuration/readiness representation;
- strict versioned backend capability response for managed avatars, workout-post images, media moderation, immutable media delivery, and password reset;
- safe disabled behavior when configuration is absent.

Backend PR #93, exact green head `d3a1f19ed419fe96111925ebe37e36ad855a67de`, merge `84e4100b85d24bfee04be2dbea0130fd95be3370`:

- public pre-auth access to the same privacy-safe capability bootstrap;
- no expansion of public DTO content or provider disclosure.

Mobile PR #363, exact green head `ebda5b78713e0313bf088a54b299b6a943131074`, merge `ac468c103db07ecb6b550535ed77aa72898fb68d`:

- exact-key and exact-version capability parser;
- rejection of unknown critical fields, unsupported versions, and inconsistent states;
- account/session-safe loading, cancellation, stale-response rejection, refresh, and recheck behavior;
- bounded EN/RU states without raw backend or provider text;
- password-reset, managed-avatar, and workout-post image controls and requests blocked until capability readiness is confirmed;
- text-only workout-post publication preserved when image capability is unavailable;
- existing offline, auth, navigation, draft, polling, sync, and persistence boundaries preserved.

No real provider adapter, credential, provider call, deployment, worker activation, public upload activation, or production password-reset email activation was added.

## Current P1 status

bounded P1 backend slice was merged in backend PR #94 from exact green head `f0a199ac4c797d6b025fb48226502a7edddcab9e` as merge `a2d4f67db3000785facb11e2d69cacb8cda03bc3`.

private-storage scope:

cy-free, provider-neutral S3 Signature Version 4 and bounded HTTPS transport primitives;
on S3-compatible private object storage selected only in the composition root;
 scoped presigned quarantine `PUT` uploads with exact key, method, MIME, size, signed headers, and expiry;
HEAD`, bounded private `GET`, conditional immutable private `PUT`, and idempotent exact-object deletion;
length, content type, ETag, last-modified, and optional SHA-256 validation;
sed namespace, endpoint, malformed-response, duplicate-write, checksum, and bounded-read behavior;
istic conformance tests without credentials or real network calls.

e provider may be `configured` and `ready`, but credentials still do not enable the product. Aggregate managed-media capabilities remain unavailable because immutable delivery, classifier, and OCR adapters are not operationally ready.

unded slice

1 with the immutable media-delivery adapter:

e merged SigV4 and bounded HTTPS primitives rather than introducing provider SDK payloads into domain code;
nly strict named JPEG variants under owner-opaque content-hashed keys;
HA-256, content length, content type, ETag or metadata, and immutable cache-control;
utable replacement and unsafe public-base URLs;
t bounded exact-prefix listing and cleanup only for validated managed-media asset prefixes;
plicate writes, missing objects, prefix isolation, partial publication, cleanup replay, malformed responses, and redacted errors;
the provider only at the application root and keep product enablement disabled.

ials, buckets, public access, CDN, real provider calls, deployment, workers, or environment activation are required or authorized.

## Execution rules

- Continue through one meaningful bounded phase or subphase rather than stopping after every micro-change.
- Inspect existing routes, services, repositories, modules, schemas, tests, and mobile parsers before adding abstractions.
- Reuse current media lifecycle, moderation, delivery, cleanup, appeal, review, password-reset, authentication, sync, and localization contracts.
- Keep provider-specific SDKs, model IDs, payloads, credentials, and raw responses behind backend adapters.
- Keep mobile provider-neutral and backend-only for all provider calls.
- Use branches and pull requests.
- Run the repository's complete blocking CI.
- Inspect review threads.
- Merge only the exact fully green head.
- After a backend phase, update the canonical mobile roadmap documents with exact head and merge SHAs.

## Invariants

- Preserve persisted schemas, stable IDs, canonical units, authentication, revisions, idempotency, conflicts, completed history, explicit Coach confirmations, media state versions, worker leases, retention deadlines, legal holds, and append-only audit.
- Keep private fitness data in the existing offline-first revision-aware private-data boundary.
- Keep Social data server-authoritative and separate from private `AppState` synchronization.
- Reviewed, pending, appealed, rejected, failed, and deleted media remain non-public unless an explicit valid transition approves them.
- Mobile never contains provider secrets or calls object storage, CDN, moderation, OCR, email, or model providers directly.
- Never expose raw provider responses, OCR plaintext, object keys, signed URLs, tokens, email, private payloads, or full idempotency keys in logs, diagnostics, DTOs, or user-visible copy.
- New user-facing copy uses the localization layer and bounded display mappings.
- Keep every new hand-written source or architecture file at or below 500 physical lines.
- Do not introduce SQLite, another persistence layer, a second backend, Firebase, or Supabase.

## Safe-default requirements

- Provider credentials alone must not enable a product capability.
- Production startup must fail closed when an enabled capability has incomplete or unsafe configuration.
- In-memory and unavailable providers remain test/development fallbacks and cannot satisfy enabled production readiness.
- Mobile hides or disables known-unavailable operations through the strict capability contract rather than issuing doomed requests.
- Missing provider configuration preserves current disabled behavior.

## Work allowed now

- backend and mobile source changes;
- provider adapters written against public provider contracts without real credentials;
- deterministic tests, provider conformance suites, fixtures, and CI changes;
- CLI and worker entrypoints that are not started in an environment;
- Docker Compose, systemd, environment, policy, smoke, and runbook templates;
- email templates and deep-link source configuration;
- technical privacy and legal drafts clearly marked as non-approved;
- documentation updates and exact-green PR merges.

## Work requiring explicit authorization or external inputs

- credentials, secret-store, DNS, sender-domain, bucket, CDN, or provider-account configuration;
- real provider calls or staging calibration;
- repository-token setup and execution of the fixed-SHA release gate;
- backend deployment or migration execution outside CI;
- worker scheduling or environment activation;
- OTA publication;
- native build or device installation;
- physical-device, second-device, accessibility, EN/RU/unit, offline-restart, and release matrices;
- public media upload enablement;
- production password-reset email activation;
- legal approval.

## Completion gate

The source program is complete only when the criteria in `docs/roadmap/provider-readiness.md` are satisfied and both repositories have exact fully green merged heads. Source completion does not imply deployment, provider activation, device validation, or public release.
