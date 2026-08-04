# Privacy-safe support diagnostics

Status: source contract for P8-B.

## Purpose

Support diagnostics are a user-initiated, ephemeral evidence snapshot for release, update, and synchronization troubleshooting. They are not product analytics, crash telemetry, or a background event stream.

The contract is versioned as:

- event name: `support_diagnostics_snapshot`;
- schema version: `1`.

## Approved fields

The snapshot contains only bounded technical metadata:

- evidence timestamp;
- exact immutable source commit when available;
- app version and native build number;
- Expo runtime version, channel, update identifier, and embedded/downloaded source;
- bounded environment category: `development`, `preview`, `production`, or `unknown`;
- bounded synchronization status;
- pending-operation and conflict counts clamped to `0..9999`;
- derived `none` or `present` count categories.

Free-form environment values fail closed to `unknown`. Text metadata is trimmed and limited to 120 characters.

## Exact source provenance

`app.config.ts` embeds `extra.buildProvenance` with schema version `1` and a source commit resolved in this order:

1. `EXPO_PUBLIC_SOURCE_COMMIT_SHA`;
2. `GITHUB_SHA`.

Only a complete 40-character hexadecimal Git commit is accepted. Branch names, tags, shortened hashes, dirty suffixes, placeholders, and malformed values are rejected and represented as unavailable. This prevents support evidence from silently referring to a moving branch.

Release automation must provide the exact intended source SHA explicitly. The GitHub fallback exists for reproducible CI/export evidence and does not authorize a release or publication.

## Explicit exclusions

The diagnostic type and serializer do not accept or copy arbitrary input fields. The following are excluded:

- access or refresh tokens;
- email, user ID, device ownership ID, or account identifiers;
- health, weight, measurement, workout, food, nutrition, limitation, or recovery values;
- entity payloads, conflict payloads, free text, food names, or exercise names;
- full idempotency keys, request bodies, raw provider responses, raw backend errors, stack traces, or hidden prompts.

Operational evidence remains separate from localized user-facing copy. Raw event names and schema details are intended for support export and deterministic tests, not ordinary product messaging.

## Retention and transmission

The application creates the snapshot in memory when the diagnostics surface is evaluated. This slice adds no database table, AsyncStorage record, analytics SDK, upload endpoint, background transmission, or automatic retention.

Default application retention is therefore zero. A snapshot exists only for the current in-memory use unless the user explicitly copies or shares it through a separately reviewed support action. Any future server-side collection requires a new consent, purpose, access-control, deletion, retention, and redaction contract before activation.

## Validation

Blocking tests prove:

- exact full-SHA acceptance and moving-reference rejection;
- explicit SHA precedence and GitHub CI fallback;
- bounded status, environment, count, timestamp, and text normalization;
- a stable explicit field set;
- rejection of malformed provenance;
- omission of injected email, tokens, user IDs, payload values, and health/nutrition content from both the snapshot and serialized evidence.

This source contract does not perform an OTA publication, native build, installation, deployment, staging run, provider activation, or production activation.
