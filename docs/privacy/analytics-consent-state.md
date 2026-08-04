# Analytics consent state boundary

Status: P9-C provider-neutral source contract. Analytics remains disabled.

This document defines how a future measurement purpose may represent a user choice without treating that choice as permission to activate analytics. It does not decide which purposes require consent, select a provider, add a prompt, persist a choice or authorize collection.

The executable source is `src/privacy/analyticsConsentState.ts`.

## Production state

The production measurement-purpose registry is empty. Therefore:

- no purpose can be selected;
- no consent state can satisfy a production purpose;
- collection permission remains false;
- the separate analytics activation contract remains blocked.

The contract adds no AsyncStorage or SecureStore key, no backend table, no API route and no network transmission.

## Purpose contract

A future reviewed purpose must define exact versions for:

- the purpose itself;
- the applicable policy decision;
- the user disclosure;
- the closed analytics event registry.

It must also record whether policy review requires explicit opt-in or is still unresolved. `policy_decision_pending` always fails closed, even if a caller supplies a synthetic granted state.

## Consent-state shape

A state is purpose-scoped and contains only:

- schema version;
- purpose ID and purpose version;
- policy version;
- disclosure version;
- event-registry version;
- `granted`, `denied` or `withdrawn` choice;
- ISO recording timestamp.

The strict parser rejects unknown fields, unsupported schema versions, malformed purpose IDs, non-positive versions, unknown choices and non-canonical timestamps.

No email, account ID, device ID, advertising identifier, token, health value, workout value, nutrition value, sync payload or free text is part of this state.

## Fail-closed evaluation

For a synthetic opt-in purpose, the choice gate is satisfied only when:

- the purpose is registered;
- the state parses strictly;
- the state belongs to that exact purpose;
- purpose, policy, disclosure and event-registry versions all match;
- the current choice is `granted`.

The following remain blocked:

- missing state;
- `denied`;
- `withdrawn`;
- a pending policy decision;
- stale purpose/policy/disclosure/event-registry versions;
- malformed or cross-purpose state.

A changed reviewed version invalidates the older choice rather than silently carrying it forward.

## Consent is not activation

The collection-permission evaluator combines the purpose choice with the global analytics activation contract. The current activation contract always returns blocked, so even an exact synthetic granted choice cannot authorize collection.

Before any future activation, separate evidence is still required for:

- approved purpose and legal/policy basis;
- event/property schema;
- refusal and withdrawal UX;
- persistence and cross-device ownership model;
- provider, region and subprocessors;
- access controls;
- retention and deletion;
- account-deletion integration;
- security and incident handling;
- accurate user disclosures.

## Persistence boundary

This slice deliberately does not choose where consent evidence should live. A future persistence design must define:

- whether state is device-local, account-scoped or both;
- offline behavior and conflict resolution;
- ordering when withdrawal races with queued events;
- authentication and ownership of server state;
- bounded retention and deletion of consent evidence;
- migration when policy or disclosure versions change;
- account-deletion behavior distinct from ordinary withdrawal.

Until that design is reviewed, the state model is pure and non-persistent.

## Validation evidence

Automated tests prove:

- the production purpose registry is empty;
- unregistered purposes fail closed;
- strict parsing rejects unknown or malformed fields;
- denial and withdrawal are not treated as grants;
- any reviewed-version change invalidates an older choice;
- policy-pending purposes stay blocked;
- consent satisfaction alone cannot override the global activation blocker.

## Authorization boundary

No analytics SDK, production purpose, consent prompt, storage key, backend route, provider, credential, tracking identifier, event upload, native build, OTA/EAS publication or production collection is introduced by this source slice.
