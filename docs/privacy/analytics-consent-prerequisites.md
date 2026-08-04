# Analytics and consent prerequisites

Status: P9-C source activation contract. Analytics remains disabled.

This document defines the minimum technical boundary that must exist before Smart Fitness may add an analytics, crash-reporting, performance-telemetry, marketing-attribution or advertising SDK. It does not select a provider, determine a legal basis, provide legal approval or authorize collection.

Executable source boundaries:

- `src/privacy/analyticsActivationContract.ts` keeps activation fail closed and records unresolved approval requirements;
- `src/privacy/analyticsEventRegistry.ts` provides a closed, versioned event/property review mechanism while the production registry remains empty.

## Current state

All analytics-adjacent surfaces are disabled:

- product-usage analytics;
- crash diagnostics;
- performance telemetry;
- marketing attribution;
- advertising and cross-app tracking.

For every surface the current contract is:

- provider: none;
- collection: none;
- upload: none;
- retention: zero;
- user choice or other legal basis: policy review required;
- activation: blocked.

Existing local-state diagnostics remain local aggregate state. They have no backend ingestion or background upload and are deleted with local account data.

## Mandatory activation prerequisites

Activation remains blocked until every prerequisite has exact reviewed evidence:

1. A named and necessary measurement purpose.
2. A versioned event/property allowlist with an owner.
3. A reviewed user-choice or other lawful-basis decision for each purpose and region.
4. Refusal and withdrawal behavior where user choice applies.
5. Data-minimization review and explicit forbidden fields.
6. Operator/provider access controls and auditability.
7. Maximum retention, expiry, deletion and failure evidence.
8. Exact provider, region, subprocessors and training/reuse policy.
9. Tested account-deletion integration or bounded exceptional retention.
10. Security, secret-handling and incident-copy controls.
11. Accurate user-facing purpose, sharing, retention and control disclosures.

A provider SDK, environment variable, API key, upload endpoint or event emission must not be introduced before this evidence exists in source and passes review.

## Closed event registry

The production event registry is intentionally empty. Therefore every event candidate is rejected as unregistered and no event can be collected or uploaded through this source boundary.

A future event definition must include:

- a lower-case versioned event name;
- one analytics surface;
- a named purpose ID and accountable owner;
- an explicit finite property list;
- a data class for every property;
- only boolean, bounded-enum or bounded-integer property kinds.

The evaluator rejects:

- unknown event names or versions;
- malformed identities;
- missing required properties;
- undeclared properties;
- type mismatches;
- enum values or integers outside reviewed bounds.

No generic `track(name, properties)` escape hatch is approved. Passing this local structural validator would not itself authorize collection: the activation contract, provider/environment evidence, user-choice decision, retention/deletion contract and disclosure review must also be complete.

## Allowed registry data classes

The source registry mechanism recognizes only narrow structural classes:

- aggregate product state;
- bounded failure category;
- coarse performance bucket;
- release metadata.

These labels are not automatic approval. Every actual event and property still needs purpose, re-identification and minimization review. Raw records cannot be converted into an approved event merely by renaming or hashing them.

## Forbidden analytics data

The activation contract excludes at minimum:

- access or refresh tokens, passwords and password hashes;
- account-deletion status secrets;
- authorization/cookie headers;
- email, direct contact details and account/session/device identifiers;
- advertising or cross-app identifiers;
- raw health, fitness, recovery, workout or nutrition values/payloads;
- nutrition search/free text and other unbounded free text;
- sync payloads, conflicts, revisions and idempotency keys;
- private media object keys or provider payloads;
- precise location;
- hidden model reasoning.

Aggregating or hashing a forbidden field does not automatically make it approved. Any proposed derived metric still requires an explicit event-schema and re-identification review.

## Choice and withdrawal boundary

This source contract does not assume that one consent model is correct for every purpose or jurisdiction. Policy/legal review must decide whether a purpose requires opt-in consent, another lawful basis or must remain prohibited.

Where user choice applies, the technical design must prove:

- no collection before the recorded choice;
- refusal is as easy as acceptance;
- withdrawal stops future collection promptly;
- unrelated core product access is not silently conditioned on optional measurement;
- local and remote consent state is versioned and recoverable;
- account deletion and consent withdrawal have distinct, documented effects;
- consent evidence itself has bounded retention and deletion rules.

## Identity minimization

Before activation, the architecture must decide whether any stable account identity is necessary. Anonymous or pseudonymous identifiers are not automatically exempt from retention, access, deletion or user-choice requirements. Advertising identifiers and cross-app linkage remain prohibited by the current contract.

## Provider and operational evidence

P9-B3 provider/environment blockers also apply to analytics. Exact evidence must cover:

- selected provider and region;
- subprocessors and support access;
- request/event retention and deletion APIs;
- training/reuse policy;
- access roles and credential ownership;
- outage, rejection and deletion-failure monitoring;
- account deletion, environment retirement and incident handling;
- bounded logs, exports and support copies.

Marketing claims or generic provider documentation are insufficient without configuration and verification for the exact environment.

## Validation boundary

The automated source contracts prove only that:

- activation evaluates to blocked;
- every declared surface has zero collection/upload/retention;
- mandatory prerequisites are explicit and unresolved;
- forbidden data classes are recorded;
- the production event registry is empty;
- synthetic event definitions accept only exact allowlisted shapes;
- unknown events, properties, types and values fail closed;
- known analytics/crash/attribution/advertising SDK markers are absent from package and Expo config surfaces.

They do not prove that all possible custom telemetry code could never be written. Any future network/event subsystem change still requires review against these contracts and full repository CI.

## Authorization boundary

This source slice does not add an SDK, production event, consent prompt, tracking identifier, backend ingestion route, provider account, credential, environment variable, deployment, native build, OTA/EAS publication or production collection.
