# Data access and export requirements

Status: first provider-neutral P9-D source contract. No export capability is active.

This document defines the technical boundary that must exist before Smart Fitness can offer an account-data access or export flow. It does not create a legal right determination, approve public policy text, implement an export API or authorize access to production data.

The executable source contract is `src/privacy/dataAccessExportContract.ts`.

## Current state

Data access/export is blocked.

Current source does not provide:

- an export request endpoint;
- identity re-verification for export;
- a mobile export screen;
- a local snapshot transformer;
- a backend cross-table export worker;
- a downloadable archive;
- email or object-storage delivery;
- provider-copy retrieval;
- production audit or failure monitoring;
- public access/export policy text.

The source contract only classifies candidate data surfaces, notice-only surfaces and secrets that must never be exported.

## Closed surface registry

The registry covers these technical categories:

- profile and bounded account metadata;
- workouts, programs, exercises and completed sets;
- nutrition entries, targets, meal templates and library records;
- weight, measurements and user-facing progress summaries;
- limitations, recovery check-ins and recorded safety context;
- structured Coach reviews, proposals, confirmations and run history;
- user-scoped social relationships and authored activity;
- managed-media metadata and lifecycle status;
- bounded synchronization, conflict and recovery explanations;
- aggregate local diagnostics;
- authentication and security secrets;
- account-deletion recovery secrets;
- provider, backup, log and operational copies.

Every surface remains `blocked`. A registry entry is not proof that the underlying source has been completely mapped or that its proposed export representation has passed minimization and policy review.

## Candidate export boundary

Candidate export categories are limited to user-provided records, user-visible structured outputs and bounded account metadata.

Before any category becomes exportable, implementation must define:

1. The authoritative mobile, backend or cross-surface source.
2. Stable user-facing field names and schema versions.
3. Redaction and minimization transforms.
4. Handling of deleted, superseded and conflicted records.
5. Unit, timestamp, locale and enum representation.
6. Bounded derived fields and their calculation provenance.
7. Pagination and deterministic ordering.
8. Partial-failure and retry semantics.
9. Export generation and delivery expiry.
10. Account deletion, withdrawal and environment-retirement behavior.

Raw storage snapshots, database rows or provider payloads must not be exported directly merely because they are technically available.

## Notice-only surfaces

Some surfaces require an understandable disclosure rather than raw internal records:

- synchronization and conflict machinery;
- aggregate local diagnostics;
- managed-media lifecycle and exceptional retention;
- logs, backups, providers, support copies and incident copies.

A notice-only representation must not expose:

- raw sync payloads;
- internal ownership IDs or revisions;
- full idempotency keys;
- private object keys;
- provider credentials or raw provider payloads;
- other users' data;
- incident security material;
- hidden model reasoning.

Provider and operational notices remain blocked by P9-B3 until exact selected-environment retention, access, deletion and failure evidence exists.

## Secrets excluded from export

The contract permanently excludes at minimum:

- access and refresh tokens;
- passwords and password hashes;
- account-deletion status secrets and secret hashes;
- authorization and cookie headers;
- provider API keys and credentials;
- private object-storage keys;
- full idempotency keys;
- security control material;
- raw internal provider payloads;
- hidden model reasoning.

Identity verification does not make a secret safe to export. These classes remain excluded even for the authenticated account owner.

## Request contract

The structural request parser accepts only:

- schema version `1`;
- format `json_v1`;
- a non-empty, duplicate-free list of registered surface IDs.

It rejects unknown fields, unsupported formats and versions, empty selections, duplicate surfaces and unknown identifiers.

This parser is not a network request model. It contains no account ID, email, delivery address, credential, request UUID or status secret. It cannot generate or deliver an export.

## Activation blockers

Even a structurally valid candidate remains blocked until all of these controls exist and are reviewed:

- exact identity re-verification;
- authenticated backend export route;
- bounded mobile-local transformation where required;
- complete source-inventory mapping;
- redaction and minimization transforms;
- selected-provider and operational-copy disposition;
- reviewed exceptional-retention notice;
- expiring and revocable delivery;
- abuse protection and rate limits;
- auditability and failure monitoring;
- reviewed user-facing policy disclosure.

The evaluator therefore always returns `allowed: false`.

## Security and delivery requirements

A future delivery design must be explicit about:

- whether generation is synchronous or asynchronous;
- archive encryption and key ownership;
- short maximum download lifetime;
- single-use or revocable links;
- authenticated status checks;
- response-loss and retry identity;
- maximum archive size and bounded worker selection;
- logging that excludes archive content and secrets;
- cleanup after success, expiry, cancellation and account deletion;
- failure evidence without retaining private payloads.

Email attachment delivery is not assumed safe and is not approved by this contract. Object-storage delivery is also blocked until the exact bucket/CDN lifecycle and access configuration is reviewed under P9-B3.

## Validation boundary

Automated tests currently prove only that:

- every declared surface remains blocked;
- surface IDs are unique;
- candidate surfaces declare included and excluded data classes;
- secret surfaces expose no candidate data classes;
- representative high-risk fields are explicitly forbidden;
- request parsing is exact and fail closed;
- a valid structural candidate still returns every unresolved activation blocker.

They do not prove source completeness, legal sufficiency, real identity verification, export correctness, secure delivery or provider deletion.

## Authorization boundary

This source slice does not add an export endpoint, database query, background worker, storage key, UI screen, downloadable file, provider call, credential, deployment, migration, native build, OTA/EAS publication or production-data operation.
