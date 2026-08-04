# Retention and exceptional-retention disclosure requirements

Status: provider-neutral P9-D source contract. No public retention disclosure is approved or active.

This document defines how Smart Fitness must distinguish source-known lifecycle boundaries from unresolved provider/environment retention before presenting any user-facing retention statement. It does not replace legal review, remove P9-B3 blockers or authorize infrastructure/provider activation.

The executable contract is `src/privacy/retentionDisclosureContract.ts`.

## Core rule

A source lifecycle field is not the same as proven deletion of external bytes.

The product must not convert any of the following into an exact public maximum lifetime without exact environment evidence:

- account-lifecycle cleanup;
- record expiry timestamps;
- database cascades;
- source cleanup commands;
- retryable cleanup operation records;
- generic provider documentation;
- marketing claims;
- undeployed worker behavior.

Unknown maximum lifetimes remain unknown and block publication.

## Covered disclosure surfaces

The source registry includes:

- mobile local account data;
- native authentication secrets;
- account-deletion receipts;
- application and reverse-proxy logs;
- database backups;
- private media and delivery derivatives;
- email delivery metadata;
- model, moderation, classifier and OCR provider requests;
- food-provider cache;
- support diagnostics;
- review exports and incident copies.

Every disclosure entry remains `blocked` pending policy, localization, accessibility, product-surface and environment evidence review.

## Evidence states

### Source account lifecycle

Source code proves that account-linked local data or authentication state participates in account/auth cleanup. It does not define an arbitrary number of days.

Current examples:

- mobile account-scoped AsyncStorage data;
- native token state in SecureStore.

These entries use `maximumDays: null` until reviewed public wording accurately describes the lifecycle and matching-device behavior is validated.

### Source record expiry

Source records contain expiry/lifecycle metadata and bounded cleanup code exists.

Current examples:

- account-deletion receipts;
- managed private-media and delivery records.

This does not prove that a production worker is scheduled, that provider bytes are expired or that CDN invalidation completed. Maximum days remain `null` until exact configuration and execution evidence exists.

### Source zero

The source currently retains and uploads nothing by default.

Current example:

- support diagnostics: zero default retention, no background upload and no backend ingestion.

This is the only current disclosure evidence represented as `maximumDays: 0`. Even this source fact remains publication-blocked until the wording and product surface are reviewed.

### Unset blocker

No acceptable production maximum lifetime or deletion evidence exists.

Current examples include:

- application/reverse-proxy logs;
- backups;
- email provider metadata;
- model and moderation providers;
- food-provider cache;
- review exports and incident copies.

These entries must not receive a guessed number, provider name or region.

## Account-deletion relationships

The technical registry distinguishes:

- `account_scoped_cleanup_required` — direct account data or external account-linked bytes must participate in deletion;
- `aggregate_not_account_scoped` — minimized operational aggregates are not direct account records but still require bounded retention;
- `exceptional_retention_review_required` — backups, provider evidence, legal holds or incident records require a reviewed bounded exception;
- `not_account_scoped` — shared reference/provider cache data is not deleted per account but still needs a retention contract.

These labels do not determine legal requirements. They prevent the UI from claiming that deletion of the primary user row immediately removes every backup, log, provider copy or protected incident record.

## Exceptional-retention categories

### Backup generation expiry

A disclosure must explain that deleted records may remain only inside protected recovery generations for a bounded period, and must state the exact maximum lifetime once configured and verified.

It must not imply:

- immediate row-level deletion from historical backups;
- indefinite backup retention;
- restoration for ordinary product use;
- unrestricted operator access.

### Bounded legal-hold or incident review

A disclosure requires:

- declared case or hold authority;
- minimum necessary scope;
- named access roles;
- integrity/audit evidence;
- explicit expiry or reviewed bounded renewal;
- post-expiry cleanup evidence.

The product must not expose internal case identifiers, security material or detailed investigation data.

### Provider evidence required

Exact provider/environment evidence must cover:

- selected provider and region;
- subprocessors/support access;
- training/reuse policy where relevant;
- maximum request/response or object lifetime;
- deletion, expiry and invalidation mechanisms;
- failure monitoring;
- account-deletion and environment-retirement behavior;
- bounded support and incident copies.

Generic provider documentation is insufficient.

## Secrets and sensitive implementation details

Public retention disclosures must not expose:

- tokens, passwords or deletion status secrets;
- provider credentials;
- private object keys;
- raw provider payloads;
- full idempotency keys;
- ownership IDs or internal revisions;
- hidden model reasoning;
- incident security material;
- raw account records used only to prove engineering behavior.

## Publication blockers

Publication remains blocked until all of the following are complete:

- exact environment evidence for every included surface;
- reviewed exceptional-retention explanations;
- policy/legal review;
- English and Russian localization review;
- accessibility review;
- an implemented privacy-facing product surface;
- consistency with account deletion, access/export and support behavior.

The executable evaluator always returns `allowed: false` and lists unresolved and exceptional surfaces.

## Validation boundary

Automated tests prove only that:

- all disclosure entries remain blocked;
- IDs are unique;
- each entry names source and unresolved evidence;
- zero days is used only for source-zero behavior;
- account-lifecycle, record-expiry and unset evidence do not invent maximum days;
- provider/infrastructure surfaces remain unresolved;
- record expiry is not treated as deployed provider deletion proof;
- support diagnostics retain zero by default without background upload;
- backups and incident copies require exception explanations;
- no selected provider names or fake regions appear in the registry.

They do not prove legal sufficiency, provider configuration, worker execution, real deletion, public-copy accuracy or production activation.

## Authorization boundary

This source slice does not select a provider, set retention, change logs/backups, schedule workers, delete objects, alter legal holds, add a privacy screen, add public policy text, deploy, migrate, build, publish OTA/EAS updates or access production data.
