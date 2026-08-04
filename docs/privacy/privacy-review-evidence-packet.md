# Privacy review evidence packet

Status: provider-neutral P9-D source contract. The packet is not ready for reviewer signoff.

This document defines a machine-readable index of technical evidence and unresolved questions that may support future policy/legal review. It does not make a legal determination, approve public wording, select providers or certify production behavior.

The executable registry is `src/privacy/privacyReviewEvidencePacket.ts`.

## Purpose

Privacy review requires more than a list of implemented source controls. The evidence packet separates:

- source-supported technical facts;
- exact environment/provider evidence;
- operational validation;
- product integration;
- policy/legal decisions;
- independent reviewer signoff.

Every evidence domain remains `not_ready` while any of these boundaries is incomplete.

## Covered domains

The packet currently covers:

1. Data inventory and ownership.
2. Purpose and minimization.
3. Authentication and security.
4. Offline synchronization and conflicts.
5. Provider processing and regions.
6. Retention and exceptional retention.
7. Account deletion and recovery.
8. Data access and export.
9. Analytics, consent and user choice.
10. Product audience and regional scope.
11. User disclosures and controls.

The registry is an index, not a replacement for the source documents it references.

## Evidence states

### Source supported

Repository source and deterministic tests establish a bounded technical fact.

Examples include:

- account-linked storage inventories;
- secret-exclusion registries;
- fail-closed analytics/event/consent contracts;
- deletion-receipt recovery semantics;
- data-access/export and retention-disclosure guards.

Source support does not prove deployment, external-provider behavior, physical-device behavior or legal sufficiency.

### Environment evidence required

The exact selected environment must provide reviewed evidence for:

- provider and region;
- subprocessors and support access;
- retention, expiry and deletion configuration;
- training or reuse terms where relevant;
- credential ownership and access roles;
- failure monitoring;
- environment retirement and account deletion.

Generic documentation and marketing claims are insufficient.

### Operational validation required

The deployed or isolated authorized environment must prove the behavior actually occurs.

Examples include:

- worker scheduling and bounded selection;
- deletion and expiry execution;
- response-loss recovery;
- secure export generation and delivery;
- release-device SecureStore and offline behavior;
- second-device reconciliation;
- audit and failure evidence without private payload retention.

No operational validation is performed by this source slice.

### Product integration required

A source mapper or registry is not a finished user control.

Integration evidence may require:

- reviewed navigation and screen placement;
- EN/RU localization;
- accessibility and discoverability;
- refusal and withdrawal behavior;
- accurate uncertainty and deletion-status presentation;
- secure authenticated export request/status/download flows.

### Policy decision required

Policy/legal review must decide matters source code cannot determine, including:

- supported countries and regions;
- intended audience and age/account eligibility;
- approved, optional or prohibited processing purposes;
- required user choice or other basis;
- exceptional retention wording;
- provider and sharing disclosures;
- public retention, deletion and access/export wording.

The registry deliberately records open questions rather than guessing answers.

## Forbidden conclusions

Each domain includes explicit conclusions that must not be drawn from current evidence.

Examples:

- a technical inventory is not automatically a complete legal record;
- hashing or aggregation does not automatically approve a data field;
- SecureStore source usage does not prove every release runtime;
- source tests do not prove every physical two-device scenario;
- generic provider documentation does not prove deployed configuration;
- record expiry does not prove provider-byte deletion;
- source-complete account deletion does not prove production cleanup;
- a structural export request parser is not an export capability;
- a synthetic consent grant does not authorize collection;
- localization keys are not approved public policy copy.

Review evidence must preserve these distinctions.

## Domain-specific requirements

### Inventory, ownership, purpose and minimization

Reviewers need:

- mobile, backend, operational and provider category mapping;
- accountable technical owners;
- named necessary purposes;
- minimum fields and forbidden classes;
- derived-field and re-identification review;
- confirmation that external operational/provider copies are included for the exact environment.

### Authentication, security, offline sync and conflicts

Reviewers need:

- token and session boundaries;
- identity re-verification requirements for destructive/export actions;
- deployed access controls and incident handling;
- accurate explanation of offline persistence and revisioned sync;
- user-facing conflict/recovery behavior;
- physical release-device and second-device evidence.

Internal payloads, revisions, ownership identifiers and idempotency keys are not public disclosure fields.

### Providers, regions and retention

Reviewers need exact selected-provider evidence, not placeholders.

Maximum lifetimes must remain unknown until configuration and execution are verified. Backup generations, legal holds, trust-safety evidence and incident copies require bounded exception scope, access, expiry and cleanup evidence.

### Account deletion and recovery

Reviewers need to distinguish:

- request submission;
- remote pending/blocked/completed states;
- response-loss recovery through secret-protected receipts;
- local cleanup pending/failed/completed states;
- primary database deletion;
- object/provider cleanup;
- backup/log/exceptional retention.

Missing sessions or expired receipts never prove deletion.

### Data access and export

Reviewers need evidence for:

- complete authoritative source mapping;
- identity re-verification;
- redaction and minimization;
- deterministic schemas and ordering;
- rate limits and abuse controls;
- response-loss and retry identity;
- secure expiring/revocable delivery;
- audit and failure monitoring;
- cleanup after success, expiry, cancellation and account deletion.

Raw snapshots and database rows are not automatically suitable exports.

### Analytics, consent and user choice

Analytics remains disabled. Reviewers need:

- approved purpose per region;
- closed event/property schema;
- provider, region, access, retention and deletion evidence;
- user-choice or other-basis decision;
- refusal and withdrawal behavior;
- versioned persistence/ownership/conflict semantics;
- account-deletion integration;
- reviewed user disclosures.

An empty registry is a safety guard, not a consent experience.

### Audience, regions, disclosures and controls

Repository language, app availability and implementation location do not determine intended legal scope.

Before public approval, the product needs explicit decisions on:

- supported regions;
- audience and age/account eligibility;
- EN/RU public wording;
- accessibility and control discoverability;
- consistency between disclosures and deployed behavior.

## Readiness evaluation

The executable evaluator always returns `ready: false` with these blockers:

- environment evidence missing;
- operational validation missing;
- policy decisions missing;
- product integration missing;
- reviewer signoff missing.

Source work may reduce the first implementation risks, but it must not remove blockers that require external evidence or independent review.

## Validation boundary

Automated tests prove only that:

- every domain remains not ready;
- domain identifiers are unique and complete for the current P9 scope;
- each item includes source references, required evidence states, open questions and forbidden conclusions;
- references are repository-relative rather than external marketing links;
- provider, retention, deletion, export, analytics and disclosure domains retain their required blockers;
- the packet contains no legal-compliance claim or selected provider name;
- evaluation always reports every current readiness blocker.

They do not prove legal sufficiency, provider configuration, production behavior, approved wording or reviewer signoff.

## Authorization boundary

This source slice does not select a provider or region, define a legal basis, approve policy text, implement a privacy UI, activate analytics, implement export, deploy, migrate, schedule workers, build native binaries, publish OTA/EAS updates, access production data or perform destructive cleanup.
